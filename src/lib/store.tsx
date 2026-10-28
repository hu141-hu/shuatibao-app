'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { UserProgress, Note, QuizResult, Question, ImportedBank, UserAccount, WrongQuestion, ReviewRecord, KnowledgePoint, PracticeRecord, CategoryHierarchy } from '@/types';
import { eduQuestions as builtinQuestions } from '@/data/eduQuestions';
import { eduCategories } from '@/data/eduCategories';
import { eduKnowledgePoints as builtinKnowledgePoints } from '@/data/eduKnowledge';

const ACCOUNTS_KEY = 'accounts_list';
const CURRENT_USER_KEY = 'current_user_id';
const THEME_KEY = 'app_theme';

// === 主题管理 ===
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  resolvedTheme: 'light',
});

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // 初始化
  useEffect(() => {
    // 隐私模式下访问 localStorage 会抛错，需与其他读取处一样兜底
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch { /* ignore */ }
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored as Theme);
    }
    setSystemTheme(getSystemTheme());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch { /* 存储不可用时仍切换外观，不影响使用 */ }
  }, []);

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  // 应用 dark class 到 html
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

const getToday = () => new Date().toISOString().split('T')[0];

const defaultProgress: UserProgress = {
  dailyGoal: 20,
  todayCount: 0,
  todayCorrect: 0,
  totalCount: 0,
  totalCorrect: 0,
  streak: 0,
  lastStudyDate: '',
  wrongQuestionIds: [],
  favoriteIds: [],
  notes: [],
  nickname: '刷题达人',
  dailyStats: {},
};

// === 默认分类层级（为内置题目创建） ===
const DEFAULT_CATEGORIES: CategoryHierarchy[] = eduCategories;

/** 内置题库版本：变更时会刷新设备上的内置目录 */
const BANK_VERSION = 'edu-3500-v1';
/** 旧版内置目录 id 前缀（迁移时丢弃） */
const OLD_BUILTIN_PREFIX = 'cat-chapter-';

// === 按账号分区的 storage 工具 ===
function userKey(userId: string, suffix: string) {
  return `${userId}_${suffix}`;
}

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveJSON(key: string, data: unknown): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    // 配额超限/隐私模式会抛错，之前被静默吞掉，用户以为已保存
    console.warn('[store] 保存失败（可能超出本地存储配额）:', key, e);
    return false;
  }
}

// === 账号列表 ===
function loadAccounts(): UserAccount[] {
  return loadJSON<UserAccount[]>(ACCOUNTS_KEY, []);
}
function saveAccounts(accounts: UserAccount[]) {
  saveJSON(ACCOUNTS_KEY, accounts);
}

// === 用户数据加载 ===
export function loadUserProgress(userId: string): UserProgress {
  const stored = loadJSON<Partial<UserProgress> | null>(userKey(userId, 'progress'), null);
  if (!stored) return { ...defaultProgress };
  const today = getToday();
  const todayStats = stored.dailyStats?.[today];
  return {
    ...defaultProgress,
    ...stored,
    todayCount: todayStats?.count || 0,
    todayCorrect: todayStats?.correct || 0,
  };
}

function loadWrongQuestions(userId: string): WrongQuestion[] {
  return loadJSON<WrongQuestion[]>(userKey(userId, 'wrongQuestions'), []);
}

function loadConfusedQuestions(userId: string): string[] {
  return loadJSON<string[]>(userKey(userId, 'confusedQuestions'), []);
}

function loadReviewHistory(userId: string): ReviewRecord[] {
  return loadJSON<ReviewRecord[]>(userKey(userId, 'reviewHistory'), []);
}

function loadImportedBanks(userId: string): { banks: ImportedBank[]; questions: Question[] } {
  const rawBanks = loadJSON<Array<Record<string, unknown>>>(userKey(userId, 'importedBanks'), []);
  // 向后兼容：旧数据没有 fileName/chapterId 字段，补充默认值
  const banks: ImportedBank[] = rawBanks.map((b) => ({
    id: String(b.id || ''),
    name: String(b.name || ''),
    fileName: String(b.fileName || b.name || ''),
    categoryId: String(b.categoryId || ''),
    chapterId: String(b.chapterId || 'cat-chapter-cs'),
    sectionId: b.sectionId ? String(b.sectionId) : undefined,
    questionCount: Number(b.questionCount || 0),
    importedAt: String(b.importedAt || new Date().toLocaleDateString('zh-CN')),
  }));
  return {
    banks,
    questions: loadJSON<Question[]>(userKey(userId, 'importedQuestions'), []),
  };
}

function loadCustomQuestions(userId: string): Question[] {
  return loadJSON<Question[]>(userKey(userId, 'customQuestions'), []);
}

function loadKnowledgeFavorites(userId: string): string[] {
  return loadJSON<string[]>(userKey(userId, 'knowledgeFavorites'), []);
}

function loadCustomKnowledgePoints(userId: string): KnowledgePoint[] {
  return loadJSON<KnowledgePoint[]>(userKey(userId, 'customKnowledgePoints'), []);
}

function loadPracticeHistory(userId: string): PracticeRecord[] {
  return loadJSON<PracticeRecord[]>(userKey(userId, 'practiceHistory'), []);
}

function loadCategoryHierarchy(userId: string): CategoryHierarchy[] {
  const stored = loadJSON<CategoryHierarchy[] | null>(userKey(userId, 'categoryHierarchy'), null);
  if (!stored || stored.length === 0) {
    // 首次使用，返回默认分类
    return DEFAULT_CATEGORIES;
  }
  // 内置题库版本变化时（旧版常识/逻辑等演示目录），丢弃旧内置目录并换成新题库目录，
  // 用户自建目录保留。
  const ver = loadJSON<string>(userKey(userId, 'bankVersion'), '');
  if (ver === BANK_VERSION) return stored;
  const userCats = stored.filter(
    c => !c.id.startsWith(OLD_BUILTIN_PREFIX) && !c.id.startsWith('cat-edu')
  );
  const keptIds = new Set(userCats.map(c => c.id));
  const validUserCats = userCats.filter(
    c => c.parentId === null || keptIds.has(c.parentId)
  );
  return [...DEFAULT_CATEGORIES, ...validUserCats];
}

// === Action 类型 ===
type Action =
  | { type: 'LOAD'; payload: string }
  | { type: 'RECORD_ANSWER'; payload: { questionId: string; isCorrect: boolean } }
  | { type: 'RECORD_QUIZ_RESULT'; payload: QuizResult }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'REMOVE_NOTE'; payload: string }
  | { type: 'SET_DAILY_GOAL'; payload: number }
  | { type: 'SET_NICKNAME'; payload: string }
  | { type: 'REMOVE_WRONG'; payload: string }
  | { type: 'ADD_WRONG'; payload: string }
  | { type: 'RETRY_WRONG'; payload: { questionId: string; isCorrect: boolean } }
  | { type: 'ADD_CONFUSED'; payload: string }
  | { type: 'REMOVE_CONFUSED'; payload: string }
  | { type: 'ADD_REVIEW'; payload: ReviewRecord }
  | { type: 'TOGGLE_KNOWLEDGE_FAVORITE'; payload: string }
  | { type: 'SET_FAVORITES'; payload: string[] }
  | { type: 'SET_NOTES'; payload: Note[] };

function reducer(state: UserProgress, action: Action): UserProgress {
  const today = getToday();

  switch (action.type) {
    case 'LOAD': {
      return loadUserProgress(action.payload);
    }

    case 'RECORD_ANSWER': {
      const { questionId, isCorrect } = action.payload;
      const dailyStats = { ...state.dailyStats };
      // 必须复制当日统计对象：直接 += 会就地修改旧 state（StrictMode 下 reducer 双调用会重复计数）
      const prevStat = dailyStats[today] || { count: 0, correct: 0 };
      const todayStat = { count: prevStat.count, correct: prevStat.correct };
      todayStat.count += 1;
      if (isCorrect) todayStat.correct += 1;
      dailyStats[today] = todayStat;

      const wasYesterday = state.lastStudyDate === new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const isToday = state.lastStudyDate === today;
      let streak = state.streak;
      if (!isToday) {
        streak = wasYesterday ? streak + 1 : 1;
      }

      const wrongQuestionIds = isCorrect
        ? state.wrongQuestionIds.filter(id => id !== questionId)
        : [...new Set([...state.wrongQuestionIds, questionId])];

      return {
        ...state,
        todayCount: todayStat.count,
        todayCorrect: todayStat.correct,
        totalCount: state.totalCount + 1,
        totalCorrect: state.totalCorrect + (isCorrect ? 1 : 0),
        streak,
        lastStudyDate: today,
        wrongQuestionIds,
        dailyStats,
      };
    }

    case 'RECORD_QUIZ_RESULT': {
      const result = action.payload;
      const dailyStats = { ...state.dailyStats };
      // 同上：复制后再累加，避免就地修改旧 state
      const prevStat = dailyStats[today] || { count: 0, correct: 0 };
      const todayStat = { count: prevStat.count, correct: prevStat.correct };
      todayStat.count += result.total;
      todayStat.correct += result.correct;
      dailyStats[today] = todayStat;

      const wasYesterday = state.lastStudyDate === new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const isToday = state.lastStudyDate === today;
      let streak = state.streak;
      if (!isToday) {
        streak = wasYesterday ? streak + 1 : 1;
      }

      const wrongIds = result.questionResults.filter(r => !r.isCorrect).map(r => r.questionId);
      const correctIds = result.questionResults.filter(r => r.isCorrect).map(r => r.questionId);

      const wrongQuestionIds = [
        ...state.wrongQuestionIds.filter(id => !correctIds.includes(id)),
        ...wrongIds.filter(id => !state.wrongQuestionIds.includes(id)),
      ];

      return {
        ...state,
        todayCount: todayStat.count,
        todayCorrect: todayStat.correct,
        totalCount: state.totalCount + result.total,
        totalCorrect: state.totalCorrect + result.correct,
        streak,
        lastStudyDate: today,
        wrongQuestionIds,
        dailyStats,
      };
    }

    case 'TOGGLE_FAVORITE': {
      const id = action.payload;
      const favoriteIds = state.favoriteIds.includes(id)
        ? state.favoriteIds.filter(fid => fid !== id)
        : [...state.favoriteIds, id];
      return { ...state, favoriteIds };
    }

    case 'ADD_NOTE': return { ...state, notes: [...state.notes, action.payload] };
    case 'REMOVE_NOTE': return { ...state, notes: state.notes.filter(n => n.id !== action.payload) };
    case 'SET_DAILY_GOAL': return { ...state, dailyGoal: action.payload };
    case 'SET_NICKNAME': return { ...state, nickname: action.payload };
    case 'REMOVE_WRONG': return { ...state, wrongQuestionIds: state.wrongQuestionIds.filter(id => id !== action.payload) };
    case 'ADD_WRONG': {
      const id = action.payload;
      return state.wrongQuestionIds.includes(id) ? state : { ...state, wrongQuestionIds: [...state.wrongQuestionIds, id] };
    }
    case 'ADD_REVIEW': return state; // review records stored separately
    case 'ADD_CONFUSED': return state; // confused stored separately
    case 'REMOVE_CONFUSED': return state;
    case 'RETRY_WRONG': return state;
    case 'TOGGLE_KNOWLEDGE_FAVORITE': return state; // knowledge favorites stored separately
    case 'SET_FAVORITES': return { ...state, favoriteIds: action.payload };
    case 'SET_NOTES': return { ...state, notes: action.payload };
    default: return state;
  }
}

// === Context 类型 ===
interface StoreContextType {
  // 账号
  currentUser: UserAccount | null;
  accounts: UserAccount[];
  createAccount: (nickname: string, avatar: string) => UserAccount;
  switchAccount: (userId: string) => void;
  deleteAccount: (userId: string) => void;
  // 进度
  progress: UserProgress;
  dispatch: React.Dispatch<Action>;
  recordAnswer: (questionId: string, isCorrect: boolean) => void;
  toggleFavorite: (questionId: string) => void;
  addNote: (questionId: string, content: string) => void;
  removeNote: (noteId: string) => void;
  setDailyGoal: (goal: number) => void;
  setNickname: (name: string) => void;
  removeWrong: (questionId: string) => void;
  // 错题本
  wrongQuestions: WrongQuestion[];
  addWrongQuestion: (questionId: string) => void;
  retryWrongQuestion: (questionId: string, isCorrect: boolean) => void;
  removeWrongQuestion: (questionId: string) => void;
  // 不会的题
  confusedQuestions: string[];
  addConfusedQuestion: (questionId: string) => void;
  removeConfusedQuestion: (questionId: string) => void;
  toggleConfused: (questionId: string) => void;
  // 复习
  reviewHistory: ReviewRecord[];
  addReviewRecord: (record: ReviewRecord) => void;
  todayReviewCount: number;
  // 导入题库
  importedBanks: ImportedBank[];
  importedQuestions: Question[];
  addImportedQuestions: (bank: ImportedBank, questions: Question[]) => void;
  removeImportedBank: (bankId: string) => void;
  // 自定义题目
  customQuestions: Question[];
  addCustomQuestion: (question: Question) => void;
  removeCustomQuestion: (questionId: string) => void;
  // 全部题目
  allQuestions: Question[];
  // 知识点库
  knowledgeFavorites: string[];
  customKnowledgePoints: KnowledgePoint[];
  allKnowledgePoints: KnowledgePoint[];
  toggleKnowledgeFavorite: (knowledgeId: string) => void;
  addCustomKnowledge: (kp: KnowledgePoint) => void;
  removeCustomKnowledge: (knowledgeId: string) => void;
  // 刷题历史
  practiceHistory: PracticeRecord[];
  addPracticeRecord: (record: PracticeRecord) => void;
  // 分类层级
  categoryHierarchy: CategoryHierarchy[];
  addCategory: (name: string, parentId: string | null, level: 'chapter' | 'section' | 'knowledge') => CategoryHierarchy;
  removeCategory: (id: string) => void;
  updateCategory: (id: string, updates: Partial<Pick<CategoryHierarchy, 'name' | 'order' | 'questionIds'>>) => void;
  moveQuestionsToCategory: (questionIds: string[], categoryId: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // 账号状态
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  // 切换账号的瞬间：新用户的 progress 还没 dispatch 进来，此时保存会把上一个账号的进度写进新账号
  const loadingUserRef = useRef(false);

  // 进度
  const [progress, dispatch] = useReducer(reducer, defaultProgress);

  // 错题 / 不会 / 复习
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [confusedQuestions, setConfusedQuestions] = useState<string[]>([]);
  const [reviewHistory, setReviewHistory] = useState<ReviewRecord[]>([]);

  // 导入 & 自定义
  const [importedBanks, setImportedBanks] = useState<ImportedBank[]>([]);
  const [importedQuestions, setImportedQuestions] = useState<Question[]>([]);
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);

  // 知识点
  const [knowledgeFavorites, setKnowledgeFavorites] = useState<string[]>([]);
  const [customKnowledgePoints, setCustomKnowledgePoints] = useState<KnowledgePoint[]>([]);

  // 刷题历史
  const [practiceHistory, setPracticeHistory] = useState<PracticeRecord[]>([]);

  // 分类层级
  const [categoryHierarchy, setCategoryHierarchy] = useState<CategoryHierarchy[]>(DEFAULT_CATEGORIES);

  // 初始化：加载账号列表和当前用户
  useEffect(() => {
    const accts = loadAccounts();
    const currentId = typeof window !== 'undefined' ? localStorage.getItem(CURRENT_USER_KEY) : null;

    if (accts.length === 0) {
      // 首次使用，自动创建默认账号
      const defaultAccount: UserAccount = {
        id: 'default_user',
        nickname: '刷题达人',
        avatar: 'fox',
        createdAt: new Date().toISOString(),
      };
      const next = [defaultAccount];
      saveAccounts(next);
      setAccounts(next);
      setCurrentUser(defaultAccount);
      if (typeof window !== 'undefined') localStorage.setItem(CURRENT_USER_KEY, defaultAccount.id);
    } else {
      setAccounts(accts);
      if (currentId) {
        const found = accts.find(a => a.id === currentId);
        if (found) setCurrentUser(found);
      }
    }
    setIsInitialized(true);
  }, []);

  // 切换/加载用户数据
  const loadUserData = useCallback((userId: string) => {
    loadingUserRef.current = true;
    dispatch({ type: 'LOAD', payload: userId });
    setWrongQuestions(loadWrongQuestions(userId));
    setConfusedQuestions(loadConfusedQuestions(userId));
    setReviewHistory(loadReviewHistory(userId));
    const ib = loadImportedBanks(userId);
    setImportedBanks(ib.banks);
    setImportedQuestions(ib.questions);
    setCustomQuestions(loadCustomQuestions(userId));
    setKnowledgeFavorites(loadKnowledgeFavorites(userId));
    setCustomKnowledgePoints(loadCustomKnowledgePoints(userId));
    setPracticeHistory(loadPracticeHistory(userId));
    setCategoryHierarchy(loadCategoryHierarchy(userId));
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadUserData(currentUser.id);
    }
  }, [currentUser, loadUserData]);

  // 保存进度
  useEffect(() => {
    if (!currentUser) return;
    // 刚切账号、新数据尚未注入时跳过本次写入，避免把上个账号的进度写到新账号名下
    if (loadingUserRef.current) {
      loadingUserRef.current = false;
      return;
    }
    saveJSON(userKey(currentUser.id, 'progress'), progress);
  }, [progress, currentUser]);

  // 保存错题
  useEffect(() => {
    if (currentUser) saveJSON(userKey(currentUser.id, 'wrongQuestions'), wrongQuestions);
  }, [wrongQuestions, currentUser]);

  // 保存不会的题
  useEffect(() => {
    if (currentUser) saveJSON(userKey(currentUser.id, 'confusedQuestions'), confusedQuestions);
  }, [confusedQuestions, currentUser]);

  // 保存复习记录
  useEffect(() => {
    if (currentUser) saveJSON(userKey(currentUser.id, 'reviewHistory'), reviewHistory);
  }, [reviewHistory, currentUser]);

  // 保存知识点收藏
  useEffect(() => {
    if (currentUser) saveJSON(userKey(currentUser.id, 'knowledgeFavorites'), knowledgeFavorites);
  }, [knowledgeFavorites, currentUser]);

  // 保存自定义知识点
  useEffect(() => {
    if (currentUser) saveJSON(userKey(currentUser.id, 'customKnowledgePoints'), customKnowledgePoints);
  }, [customKnowledgePoints, currentUser]);

  // 保存刷题历史
  useEffect(() => {
    if (currentUser) saveJSON(userKey(currentUser.id, 'practiceHistory'), practiceHistory);
  }, [practiceHistory, currentUser]);

  // 保存分类层级
  useEffect(() => {
    if (currentUser) {
      saveJSON(userKey(currentUser.id, 'categoryHierarchy'), categoryHierarchy);
      saveJSON(userKey(currentUser.id, 'bankVersion'), BANK_VERSION);
    }
  }, [categoryHierarchy, currentUser]);

  // === 账号操作 ===
  const createAccount = useCallback((nickname: string, avatar: string): UserAccount => {
    const account: UserAccount = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      nickname,
      avatar,
      createdAt: new Date().toISOString(),
    };
    setAccounts(prev => {
      const next = [...prev, account];
      saveAccounts(next);
      return next;
    });
    setCurrentUser(account);
    if (typeof window !== 'undefined') localStorage.setItem(CURRENT_USER_KEY, account.id);
    return account;
  }, []);

  const switchAccount = useCallback((userId: string) => {
    const found = accounts.find(a => a.id === userId);
    if (found) {
      setCurrentUser(found);
      if (typeof window !== 'undefined') localStorage.setItem(CURRENT_USER_KEY, userId);
    }
  }, [accounts]);

  const deleteAccount = useCallback((userId: string) => {
    setAccounts(prev => {
      const next = prev.filter(a => a.id !== userId);
      saveAccounts(next);
      return next;
    });
    // 清理该用户所有数据
    if (typeof window !== 'undefined') {
      const keys = ['progress', 'wrongQuestions', 'confusedQuestions', 'reviewHistory', 'importedBanks', 'importedQuestions', 'customQuestions', 'favorites', 'notes', 'settings', 'history', 'knowledgeFavorites', 'customKnowledgePoints', 'practiceHistory', 'categoryHierarchy'];
      keys.forEach(k => localStorage.removeItem(userKey(userId, k)));
    }
    if (currentUser?.id === userId) {
      setCurrentUser(null);
      if (typeof window !== 'undefined') localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, [currentUser]);

  // === 进度操作 ===
  const recordAnswer = useCallback((questionId: string, isCorrect: boolean) => {
    dispatch({ type: 'RECORD_ANSWER', payload: { questionId, isCorrect } });
  }, []);

  const toggleFavorite = useCallback((questionId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: questionId });
  }, []);

  const addNote = useCallback((questionId: string, content: string) => {
    const note: Note = {
      id: `note-${Date.now()}`,
      questionId,
      content,
      author: progress.nickname,
      isPublic: false,
      createdAt: getToday(),
    };
    dispatch({ type: 'ADD_NOTE', payload: note });
  }, [progress.nickname]);

  const removeNote = useCallback((noteId: string) => {
    dispatch({ type: 'REMOVE_NOTE', payload: noteId });
  }, []);

  const setDailyGoal = useCallback((goal: number) => {
    dispatch({ type: 'SET_DAILY_GOAL', payload: goal });
  }, []);

  const setNickname = useCallback((name: string) => {
    dispatch({ type: 'SET_NICKNAME', payload: name });
  }, []);

  const removeWrong = useCallback((questionId: string) => {
    dispatch({ type: 'REMOVE_WRONG', payload: questionId });
  }, []);

  // === 错题本操作 ===
  const addWrongQuestion = useCallback((questionId: string) => {
    setWrongQuestions(prev => {
      const existing = prev.find(w => w.questionId === questionId);
      if (existing) {
        return prev.map(w => w.questionId === questionId
          ? { ...w, wrongCount: w.wrongCount + 1, lastWrongAt: new Date().toISOString() }
          : w
        );
      }
      return [...prev, { questionId, wrongCount: 1, lastWrongAt: new Date().toISOString(), correctOnRetry: 0 }];
    });
  }, []);

  const retryWrongQuestion = useCallback((questionId: string, isCorrect: boolean) => {
    if (isCorrect) {
      setWrongQuestions(prev => {
        const updated = prev.map(w => w.questionId === questionId
          ? { ...w, correctOnRetry: w.correctOnRetry + 1 }
          : w
        );
        // 答对2次自动移出
        return updated.filter(w => !(w.questionId === questionId && w.correctOnRetry >= 2));
      });
    }
  }, []);

  const removeWrongQuestion = useCallback((questionId: string) => {
    setWrongQuestions(prev => prev.filter(w => w.questionId !== questionId));
  }, []);

  // === 不会的题操作 ===
  const addConfusedQuestion = useCallback((questionId: string) => {
    setConfusedQuestions(prev => prev.includes(questionId) ? prev : [...prev, questionId]);
  }, []);

  const removeConfusedQuestion = useCallback((questionId: string) => {
    setConfusedQuestions(prev => prev.filter(id => id !== questionId));
  }, []);

  const toggleConfused = useCallback((questionId: string) => {
    setConfusedQuestions(prev =>
      prev.includes(questionId) ? prev.filter(id => id !== questionId) : [...prev, questionId]
    );
  }, []);

  // === 复习操作 ===
  const addReviewRecord = useCallback((record: ReviewRecord) => {
    setReviewHistory(prev => [...prev, record]);
  }, []);

  const todayReviewCount = useMemo(() => {
    const today = getToday();
    const todayRecord = reviewHistory.find(r => r.date === today);
    return todayRecord ? todayRecord.totalCount : 0;
  }, [reviewHistory]);

  // === 导入题库 ===
  const addImportedQuestions = useCallback((bank: ImportedBank, newQs: Question[]) => {
    if (!currentUser) return;
    const uid = currentUser.id;
    // 用函数式更新：连续导入两次时，闭包里的 importedBanks/importedQuestions 还是旧值，会互相覆盖
    setImportedBanks(prev => {
      const next = [...prev, bank];
      saveJSON(userKey(uid, 'importedBanks'), next);
      return next;
    });
    setImportedQuestions(prev => {
      const next = [...prev, ...newQs];
      saveJSON(userKey(uid, 'importedQuestions'), next);
      return next;
    });
    // 将导入的题目加入分类层级
    const qIds = newQs.map(q => q.id);
    setCategoryHierarchy(prev => {
      const updated = [...prev];
      // 找到目标分类并加入题目ID
      const targetId = bank.categoryId || bank.chapterId;
      const idx = updated.findIndex(c => c.id === targetId);
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], questionIds: [...updated[idx].questionIds, ...qIds] };
      } else {
        // 找不到分类，加入内置题库的顶级目录（教育学）
        const csIdx = updated.findIndex(c => c.id === 'cat-edu');
        if (csIdx !== -1) {
          updated[csIdx] = { ...updated[csIdx], questionIds: [...updated[csIdx].questionIds, ...qIds] };
        }
      }
      return updated;
    });
  }, [currentUser]);

  const removeImportedBank = useCallback((bankId: string) => {
    if (!currentUser) return;
    
    // 1. 获取要删除的题目 ID
    // 题目 id 由 mdParser 生成为 `imported-<bankId>-<题号>`，老数据可能是 `<bankId>-<题号>`，
    // 只按 bankId 前缀匹配会全部漏掉，导致"删了题库但题目还在"。
    const idPrefixes = [`imported-${bankId}-`, `${bankId}-`];
    const questionsToRemove = importedQuestions.filter(
      q => q.id === bankId || idPrefixes.some(prefix => q.id.startsWith(prefix))
    );
    const removedQIds = questionsToRemove.map(q => q.id);
    
    // 2. 从错题本中移除这些题目的记录
    const updatedWrongQuestions = wrongQuestions.filter(w => !removedQIds.includes(w.questionId));
    setWrongQuestions(updatedWrongQuestions);
    saveJSON(userKey(currentUser.id, 'wrongQuestions'), updatedWrongQuestions);
    
    // 3. 从不会的题中移除
    const updatedConfusedQuestions = confusedQuestions.filter(id => !removedQIds.includes(id));
    setConfusedQuestions(updatedConfusedQuestions);
    saveJSON(userKey(currentUser.id, 'confusedQuestions'), updatedConfusedQuestions);
    
    // 4. 从收藏列表中移除（原来用 TOGGLE_FAVORITE:'' 占位，实际会把空字符串写进收藏列表）
    const updatedFavoriteIds = progress.favoriteIds.filter(id => id && !removedQIds.includes(id));
    dispatch({ type: 'SET_FAVORITES', payload: updatedFavoriteIds });

    // 5. 从笔记中移除（按 questionId 精确匹配，之前用 content.includes 会误删/漏删）
    const updatedNotes = progress.notes.filter(n => !removedQIds.includes(n.questionId));
    dispatch({ type: 'SET_NOTES', payload: updatedNotes });
    
    // 6. 更新导入题库列表
    const nextBanks = importedBanks.filter(b => b.id !== bankId);
    setImportedBanks(nextBanks);
    saveJSON(userKey(currentUser.id, 'importedBanks'), nextBanks);
    
    // 7. 更新导入题目列表
    const nextQuestions = importedQuestions.filter(q => !removedQIds.includes(q.id));
    setImportedQuestions(nextQuestions);
    saveJSON(userKey(currentUser.id, 'importedQuestions'), nextQuestions);
    
    // 8. 从分类层级移除这些题目（state 与落盘使用同一份数据，避免写入过滤前的旧值）
    const nextHierarchy = categoryHierarchy.map(cat => ({
      ...cat,
      questionIds: cat.questionIds.filter(id => !removedQIds.includes(id)),
    }));
    setCategoryHierarchy(nextHierarchy);
    saveJSON(userKey(currentUser.id, 'categoryHierarchy'), nextHierarchy);
    
    // 9. 从刷题历史中移除相关记录
    const allHistory = practiceHistory.filter(h => !removedQIds.includes(h.questionId));
    setPracticeHistory(allHistory);
    saveJSON(userKey(currentUser.id, 'practiceHistory'), allHistory);
    
  }, [currentUser, importedBanks, importedQuestions, wrongQuestions, confusedQuestions, progress, categoryHierarchy, practiceHistory]);

  const addCustomQuestion = useCallback((question: Question) => {
    if (!currentUser) return;
    const uid = currentUser.id;
    setCustomQuestions(prev => {
      const next = [...prev, question];
      saveJSON(userKey(uid, 'customQuestions'), next);
      return next;
    });
  }, [currentUser]);

  const removeCustomQuestion = useCallback((questionId: string) => {
    if (!currentUser) return;
    const uid = currentUser.id;
    setCustomQuestions(prev => {
      const next = prev.filter(q => q.id !== questionId);
      saveJSON(userKey(uid, 'customQuestions'), next);
      return next;
    });
  }, [currentUser]);

  // === 知识点操作 ===
  const toggleKnowledgeFavorite = useCallback((knowledgeId: string) => {
    setKnowledgeFavorites(prev =>
      prev.includes(knowledgeId) ? prev.filter(id => id !== knowledgeId) : [...prev, knowledgeId]
    );
  }, []);

  const addCustomKnowledge = useCallback((kp: KnowledgePoint) => {
    if (!currentUser) return;
    setCustomKnowledgePoints(prev => {
      const next = [...prev, kp];
      saveJSON(userKey(currentUser.id, 'customKnowledgePoints'), next);
      return next;
    });
  }, [currentUser]);

  const removeCustomKnowledge = useCallback((knowledgeId: string) => {
    if (!currentUser) return;
    setCustomKnowledgePoints(prev => {
      const next = prev.filter(k => k.id !== knowledgeId);
      saveJSON(userKey(currentUser.id, 'customKnowledgePoints'), next);
      return next;
    });
  }, [currentUser]);

  const allKnowledgePoints = useMemo(
    () => [...builtinKnowledgePoints, ...customKnowledgePoints],
    [customKnowledgePoints]
  );

  // === 刷题历史操作 ===
  const addPracticeRecord = useCallback((record: PracticeRecord) => {
    setPracticeHistory(prev => {
      const next = [...prev, record];
      return next;
    });
  }, []);

  // === 分类层级操作 ===
  const addCategory = useCallback((name: string, parentId: string | null, level: 'chapter' | 'section' | 'knowledge'): CategoryHierarchy => {
    const newCat: CategoryHierarchy = {
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      parentId,
      level,
      order: categoryHierarchy.filter(c => c.parentId === parentId).length,
      questionIds: [],
    };
    setCategoryHierarchy(prev => [...prev, newCat]);
    return newCat;
  }, [categoryHierarchy]);

  const removeCategory = useCallback((id: string) => {
    setCategoryHierarchy(prev => {
      // 同时删除所有后代分类（章 → 节 → 知识点），原来只删除直接子级会留下孤儿节
      const removed = new Set<string>([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const c of prev) {
          if (c.parentId && removed.has(c.parentId) && !removed.has(c.id)) {
            removed.add(c.id);
            changed = true;
          }
        }
      }
      return prev.filter(c => !removed.has(c.id));
    });
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Pick<CategoryHierarchy, 'name' | 'order' | 'questionIds'>>) => {
    setCategoryHierarchy(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const moveQuestionsToCategory = useCallback((questionIds: string[], categoryId: string) => {
    setCategoryHierarchy(prev => {
      // 先从所有分类中移除这些题目
      const updated = prev.map(c => ({
        ...c,
        questionIds: c.questionIds.filter(id => !questionIds.includes(id)),
      }));
      // 再添加到目标分类
      const idx = updated.findIndex(c => c.id === categoryId);
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], questionIds: [...updated[idx].questionIds, ...questionIds] };
      }
      return updated;
    });
  }, []);

  const allQuestions = useMemo(() => {
    const normalize = (q: Question) => ({
      ...q,
      category: q.category || '未分类',
      explanation: q.explanation || { brief: '', detailed: '', knowledge: '', tips: '' },
    });
    return [
      ...builtinQuestions,
      ...importedQuestions.map(normalize),
      ...customQuestions.map(normalize),
    ];
  }, [importedQuestions, customQuestions]);

  // 未初始化时不渲染
  if (!isInitialized) {
    return null;
  }

  return (
    <StoreContext.Provider value={{
      currentUser, accounts, createAccount, switchAccount, deleteAccount,
      progress, dispatch,
      recordAnswer, toggleFavorite, addNote, removeNote, setDailyGoal, setNickname, removeWrong,
      wrongQuestions, addWrongQuestion, retryWrongQuestion, removeWrongQuestion,
      confusedQuestions, addConfusedQuestion, removeConfusedQuestion, toggleConfused,
      reviewHistory, addReviewRecord, todayReviewCount,
      importedBanks, importedQuestions, addImportedQuestions, removeImportedBank,
      customQuestions, addCustomQuestion, removeCustomQuestion,
      allQuestions,
      knowledgeFavorites, customKnowledgePoints, allKnowledgePoints,
      toggleKnowledgeFavorite, addCustomKnowledge, removeCustomKnowledge,
      practiceHistory, addPracticeRecord,
      categoryHierarchy, addCategory, removeCategory, updateCategory, moveQuestionsToCategory,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
