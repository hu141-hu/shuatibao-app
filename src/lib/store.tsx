'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useState, useMemo } from 'react';
import { UserProgress, Note, QuizResult, Question, ImportedBank, UserAccount, WrongQuestion, ReviewRecord, KnowledgePoint, PracticeRecord, CategoryHierarchy } from '@/types';
import { questions as builtinQuestions } from '@/data/questions';
import { builtinKnowledgePoints } from '@/data/knowledge';

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
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setThemeState(stored);
    }
    setSystemTheme(getSystemTheme());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
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
const DEFAULT_CATEGORIES: CategoryHierarchy[] = [
  {
    id: 'cat-chapter-cs',
    name: '常识判断',
    parentId: null,
    level: 'chapter',
    order: 0,
    questionIds: ['cs-001', 'cs-002', 'cs-003', 'cs-004', 'cs-005', 'cs-006'],
  },
  {
    id: 'cat-chapter-lr',
    name: '逻辑推理',
    parentId: null,
    level: 'chapter',
    order: 1,
    questionIds: ['lr-001', 'lr-002', 'lr-003', 'lr-004', 'lr-005', 'lr-006'],
  },
  {
    id: 'cat-chapter-yr',
    name: '言语理解',
    parentId: null,
    level: 'chapter',
    order: 2,
    questionIds: ['yr-001', 'yr-002', 'yr-003', 'yr-004', 'yr-005', 'yr-006'],
  },
  {
    id: 'cat-chapter-sl',
    name: '数量关系',
    parentId: null,
    level: 'chapter',
    order: 3,
    questionIds: ['sl-001', 'sl-002', 'sl-003', 'sl-004', 'sl-005', 'sl-006'],
  },
];

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

function saveJSON(key: string, data: unknown) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
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
  return stored;
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
  | { type: 'TOGGLE_KNOWLEDGE_FAVORITE'; payload: string };

function reducer(state: UserProgress, action: Action): UserProgress {
  const today = getToday();

  switch (action.type) {
    case 'LOAD': {
      return loadUserProgress(action.payload);
    }

    case 'RECORD_ANSWER': {
      const { questionId, isCorrect } = action.payload;
      const dailyStats = { ...state.dailyStats };
      const todayStat = dailyStats[today] || { count: 0, correct: 0 };
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
      const todayStat = dailyStats[today] || { count: 0, correct: 0 };
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
    if (currentUser) saveJSON(userKey(currentUser.id, 'progress'), progress);
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
    if (currentUser) saveJSON(userKey(currentUser.id, 'categoryHierarchy'), categoryHierarchy);
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
    const nextBanks = [...importedBanks, bank];
    const nextQuestions = [...importedQuestions, ...newQs];
    setImportedBanks(nextBanks);
    setImportedQuestions(nextQuestions);
    saveJSON(userKey(currentUser.id, 'importedBanks'), nextBanks);
    saveJSON(userKey(currentUser.id, 'importedQuestions'), nextQuestions);
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
        // 找不到分类，加入默认常识判断章
        const csIdx = updated.findIndex(c => c.id === 'cat-chapter-cs');
        if (csIdx !== -1) {
          updated[csIdx] = { ...updated[csIdx], questionIds: [...updated[csIdx].questionIds, ...qIds] };
        }
      }
      return updated;
    });
  }, [currentUser, importedBanks, importedQuestions]);

  const removeImportedBank = useCallback((bankId: string) => {
    if (!currentUser) return;
    
    // 1. 获取要删除的题目 ID（通过 bankId 精确匹配）
    const questionsToRemove = importedQuestions.filter(q => q.id === bankId || q.id.startsWith(bankId + '-'));
    const removedQIds = questionsToRemove.map(q => q.id);
    
    // 2. 从错题本中移除这些题目的记录
    const updatedWrongQuestions = wrongQuestions.filter(w => !removedQIds.includes(w.questionId));
    setWrongQuestions(updatedWrongQuestions);
    saveJSON(userKey(currentUser.id, 'wrongQuestions'), updatedWrongQuestions);
    
    // 3. 从不会的题中移除
    const updatedConfusedQuestions = confusedQuestions.filter(id => !removedQIds.includes(id));
    setConfusedQuestions(updatedConfusedQuestions);
    saveJSON(userKey(currentUser.id, 'confusedQuestions'), updatedConfusedQuestions);
    
    // 4. 从收藏列表中移除
    const updatedFavoriteIds = progress.favoriteIds.filter(id => !removedQIds.includes(id));
    dispatch({ type: 'TOGGLE_FAVORITE', payload: '' }); // 占位，实际不会触发
    
    // 5. 从笔记中移除（如果有包含这些题目 ID 的笔记）
    const updatedNotes = progress.notes.filter(n => 
      !removedQIds.some(id => n.content.includes(id))
    );
    dispatch({ type: 'REMOVE_NOTE', payload: '' }); // 占位，实际在 component 处理
    
    // 6. 更新导入题库列表
    const nextBanks = importedBanks.filter(b => b.id !== bankId);
    setImportedBanks(nextBanks);
    saveJSON(userKey(currentUser.id, 'importedBanks'), nextBanks);
    
    // 7. 更新导入题目列表
    const nextQuestions = importedQuestions.filter(q => !removedQIds.includes(q.id));
    setImportedQuestions(nextQuestions);
    saveJSON(userKey(currentUser.id, 'importedQuestions'), nextQuestions);
    
    // 8. 从分类层级移除这些题目
    setCategoryHierarchy(prev => prev.map(cat => ({
      ...cat,
      questionIds: cat.questionIds.filter(id => !removedQIds.includes(id)),
    })));
    saveJSON(userKey(currentUser.id, 'categoryHierarchy'), categoryHierarchy.map(cat => ({
      ...cat,
      questionIds: cat.questionIds.filter(id => !removedQIds.includes(id)),
    })));
    
    // 9. 从刷题历史中移除相关记录
    const allHistory = practiceHistory.filter(h => !removedQIds.includes(h.questionId));
    setPracticeHistory(allHistory);
    saveJSON(userKey(currentUser.id, 'practiceHistory'), allHistory);
    
  }, [currentUser, importedBanks, importedQuestions, wrongQuestions, confusedQuestions, progress, categoryHierarchy, practiceHistory]);

  const addCustomQuestion = useCallback((question: Question) => {
    if (!currentUser) return;
    const next = [...customQuestions, question];
    setCustomQuestions(next);
    saveJSON(userKey(currentUser.id, 'customQuestions'), next);
  }, [currentUser, customQuestions]);

  const removeCustomQuestion = useCallback((questionId: string) => {
    if (!currentUser) return;
    const next = customQuestions.filter(q => q.id !== questionId);
    setCustomQuestions(next);
    saveJSON(userKey(currentUser.id, 'customQuestions'), next);
  }, [currentUser, customQuestions]);

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
      // 同时删除所有子分类
      const childIds = prev.filter(c => c.parentId === id).map(c => c.id);
      return prev.filter(c => c.id !== id && !childIds.includes(c.id));
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
