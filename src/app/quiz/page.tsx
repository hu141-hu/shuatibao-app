'use client';

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Question, PracticeRecord } from '@/types';
import QuestionCard from '@/components/QuestionCard';
import OptionButton from '@/components/OptionButton';
import ExplanationPanel from '@/components/ExplanationPanel';
import FavoriteButton from '@/components/FavoriteButton';
import AiChat from '@/components/AiChat';
import CustomQuizModal, { QuizMode } from '@/components/CustomQuizModal';
import QuizBuilderModal from '@/components/QuizBuilderModal';
import AnswerSheet from '@/components/AnswerSheet';
import { useSwipeNav } from '@/lib/useSwipeNav';
import { registerBackInterceptor } from '@/lib/backHandler';
import { getChildren, getCategoryQuestions, getMasteryLevel, getCategoryStats, shuffleQuestions } from '@/lib/categoryUtils';
import {
  buildQuizByPlan, restorePlanQuestions, quizPlanStorageKey,
  type QuizPlanItem, type SavedQuizPlan,
} from '@/lib/quizBuilder';
import {
  OPTION_LABELS as labels,
  isMultiQuestion,
  checkAnswer,
  correctIndices,
  answerText,
} from '@/lib/answerUtils';

// 生成练习记录 ID（避免在事件处理器中使用 Math.random，满足 React 纯函数规则）
let practiceSeq = 0;
function nextPracticeId(): string {
  practiceSeq += 1;
  return `pr-${Date.now()}-${practiceSeq.toString(36)}`;
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-6 text-center text-gray-500">加载中...</div>}>
      <QuizContent />
    </Suspense>
  );
}

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 从首页点章节进入：题目乱序，退出直接回首页（不落在刷题模式的目录列表）
  const fromHome = searchParams.get('from') === 'home';
  const { dispatch, addWrongQuestion, toggleConfused, confusedQuestions, addPracticeRecord, practiceHistory, allQuestions, categoryHierarchy, currentUser } = useStore();

  // 章列表
  const chapters = useMemo(() => {
    return categoryHierarchy
      .filter(c => c.level === 'chapter' && c.parentId === null)
      .sort((a, b) => a.order - b.order);
  }, [categoryHierarchy]);

  // 章下的节 / 节下的知识点，统一按 parentId 取
  const getSections = useCallback((chapterId: string) => getChildren(categoryHierarchy, chapterId), [categoryHierarchy]);
  const getKnowledges = useCallback((sectionId: string) => getChildren(categoryHierarchy, sectionId), [categoryHierarchy]);

  // 聚合目录及其所有后代的题目：顶级目录直接刷题 = 递归全部
  const getQuestionsByCategoryId = useCallback(
    (catId: string) => getCategoryQuestions(categoryHierarchy, allQuestions, catId),
    [categoryHierarchy, allQuestions]
  );

  // 选中状态：章 → 节 → 知识点
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<string | null>(null);
  // 自定义刷题：勾选的目录 / 模式 / 弹窗
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [quizMode, setQuizMode] = useState<QuizMode>('practice');
  const [showCustom, setShowCustom] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  // 多章节出题：当前答题卡计划 / 抽题提示 / 未答完的存档
  const [activePlan, setActivePlan] = useState<QuizPlanItem[]>([]);
  const [planWarnings, setPlanWarnings] = useState<string[]>([]);
  const [savedPlan, setSavedPlan] = useState<SavedQuizPlan | null>(null);
  const [builderError, setBuilderError] = useState('');

  // === 断点续刷：按目录记录最后一题的 id ===
  const lastKey = currentUser ? `${currentUser.id}_categoryLast` : '';
  const [lastMap, setLastMap] = useState<Record<string, string>>({});
  // URL 初始化 effect 不能依赖 lastMap，否则断点加载完成后会重跑并重置当前答题
  const lastMapRef = useRef<Record<string, string>>({});
  useEffect(() => {
    if (!lastKey) return;
    let next: Record<string, string> = {};
    try {
      const raw = JSON.parse(localStorage.getItem(lastKey) || '{}');
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) next = raw;
    } catch { /* 脏数据当作无断点 */ }
    lastMapRef.current = next;
    setLastMap(next);
  }, [lastKey]);

  const saveLast = useCallback((catId: string | null, questionId: string) => {
    if (!lastKey || !catId) return;
    setLastMap(prev => {
      const next = { ...prev, [catId]: questionId };
      try { localStorage.setItem(lastKey, JSON.stringify(next)); } catch { /* 存储不可用时忽略 */ }
      return next;
    });
  }, [lastKey]);

  // 当前所在目录（答题断点按这个 key 记录）
  const activeCategoryId = selectedKnowledgeId || selectedSectionId
    || (selectedChapterId && selectedChapterId !== '全部' ? selectedChapterId : null);

  // 自定义刷题候选池：勾选目录的题目并集
  const customPool = useMemo(() => {
    if (selectedCategoryIds.length === 0) return [];
    const map = new Map<string, Question>();
    for (const id of selectedCategoryIds) {
      for (const q of getQuestionsByCategoryId(id)) map.set(q.id, q);
    }
    return [...map.values()];
  }, [selectedCategoryIds, getQuestionsByCategoryId]);

  const doneIds = useMemo(() => [...new Set(practiceHistory.map(h => h.questionId))], [practiceHistory]);
  const wrongIds = useMemo(() => [...new Set(practiceHistory.filter(h => !h.isCorrect).map(h => h.questionId))], [practiceHistory]);
  const doneSet = useMemo(() => new Set(doneIds), [doneIds]);

  // 目录已全部刷完时的提示（避免点了没反应）
  const [quizNotice, setQuizNotice] = useState<{ id: string; name: string; total: number } | null>(null);

  /** 取目录题目：all=全部，rest=未做（默认只刷未做） */
  const pickPracticePool = useCallback((catId: string) => {
    const all = getQuestionsByCategoryId(catId);
    return { all, rest: all.filter(q => !doneSet.has(q.id)) };
  }, [getQuestionsByCategoryId, doneSet]);

  const toggleCategorySelect = (id: string) => {
    setSelectedCategoryIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = (ids: string[]) => {
    if (ids.length === 0) return;
    const allSelected = ids.every(id => selectedCategoryIds.includes(id));
    setSelectedCategoryIds(allSelected ? [] : ids);
  };

  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  // 多选题：勾选的选项（提交后统一判分）
  const [multiSelected, setMultiSelected] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<{ questionId: string; selected: number; selectedAll?: number[]; isCorrect: boolean }[]>([]);
  const [startTime, setStartTime] = useState(() => Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(() => Date.now());
  const [confusedAnim, setConfusedAnim] = useState(false);

  // 开始一轮刷题：必须同时重置下标/作答记录，
  // 否则上一轮停在第 5 题、换一个只有 3 题的分类时 currentIndex 越界，currentQ 为 undefined 直接白屏
  const startQuiz = useCallback((qs: Question[], startAtId?: string, mode: QuizMode = 'practice', plan: QuizPlanItem[] = []) => {
    // 有断点时从上次那道题继续
    const idx = startAtId ? qs.findIndex(q => q.id === startAtId) : 0;
    setQuizQuestions(qs.length > 0 ? qs : []);
    setCurrentIndex(idx > 0 ? idx : 0);
    setSelectedAnswer(null);
    setShowResult(false);
    setResults([]);
    setQuizMode(mode);
    // plan 为空 = 普通刷题，需清掉上一张答题卡的分组信息
    setActivePlan(plan);
    if (plan.length === 0) setPlanWarnings([]);
    setQuestionStartTime(Date.now());
    setStartTime(Date.now());
  }, []);

  // 支持 URL 参数直接跳转
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 初始化时根据 URL 参数同步选中状态
    const chId = searchParams.get('chapterId');
    const secId = searchParams.get('sectionId');
    const knId = searchParams.get('knowledgeId');
    const oldCategory = searchParams.get('category');

    if (knId) {
      // 从知识点回溯节与章，保证面包屑与返回路径正确
      const kn = categoryHierarchy.find(c => c.id === knId);
      const sec = kn && kn.parentId ? categoryHierarchy.find(c => c.id === kn.parentId) : undefined;
      if (sec) {
        setSelectedSectionId(sec.id);
        if (sec.parentId) setSelectedChapterId(sec.parentId);
      }
      setSelectedKnowledgeId(knId);
      startQuiz(getQuestionsByCategoryId(knId), lastMapRef.current[knId]);
    } else if (secId) {
      // 从节ID找到章ID
      const sec = categoryHierarchy.find(c => c.id === secId);
      if (sec && sec.parentId) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 初始化时根据 URL 参数同步选中状态
        setSelectedChapterId(sec.parentId);
      }
      setSelectedSectionId(secId);
      const qs = getQuestionsByCategoryId(secId);
      startQuiz(fromHome ? shuffleQuestions(qs) : qs, lastMapRef.current[secId]);
    } else if (chId) {
      setSelectedChapterId(chId);
      const qs = getQuestionsByCategoryId(chId);
      startQuiz(fromHome ? shuffleQuestions(qs) : qs, lastMapRef.current[chId]);
    } else if (oldCategory) {
      // 向后兼容旧分类名
      const ch = chapters.find(c => c.name === oldCategory);
      if (ch) {
        setSelectedChapterId(ch.id);
        startQuiz(getQuestionsByCategoryId(ch.id));
      }
    }
  }, [searchParams, categoryHierarchy, chapters, getQuestionsByCategoryId, startQuiz, fromHome]);

  const handleSelectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setSelectedSectionId(null);
    setSelectedKnowledgeId(null);
    setQuizNotice(null);
    // 进入下一级时清空勾选，避免章与节混选造成"先到先得"后数量被吃掉
    setSelectedCategoryIds([]);
    const sections = getSections(chapterId);
    if (sections.length === 0) {
      // 没有子级，直接开刷：默认跳过已做
      const { all, rest } = pickPracticePool(chapterId);
      if (all.length > 0 && rest.length === 0) {
        setQuizNotice({ id: chapterId, name: categoryHierarchy.find(c => c.id === chapterId)?.name || '本章', total: all.length });
        return;
      }
      startQuiz(rest.length > 0 ? rest : all);
    }
  };

  const handleSelectSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setSelectedKnowledgeId(null);
    setQuizNotice(null);
    setSelectedCategoryIds([]);
    const knowledges = getKnowledges(sectionId);
    if (knowledges.length === 0) {
      const { all, rest } = pickPracticePool(sectionId);
      if (all.length > 0 && rest.length === 0) {
        setQuizNotice({ id: sectionId, name: categoryHierarchy.find(c => c.id === sectionId)?.name || '本节', total: all.length });
        return;
      }
      startQuiz(rest.length > 0 ? rest : all);
    }
  };

  const handleSelectKnowledge = (knowledgeId: string) => {
    setSelectedKnowledgeId(knowledgeId);
    setQuizNotice(null);
    const { all, rest } = pickPracticePool(knowledgeId);
    if (all.length > 0 && rest.length === 0) {
      setQuizNotice({ id: knowledgeId, name: categoryHierarchy.find(c => c.id === knowledgeId)?.name || '本知识点', total: all.length });
      return;
    }
    startQuiz(rest.length > 0 ? rest : all);
  };

  // 继续上次：必须先恢复目录层级，否则会一直停在章列表分支（点了没反应）
  const resumeQuiz = useCallback((catId: string) => {
    const cat = categoryHierarchy.find(c => c.id === catId);
    if (!cat) return;
    setQuizNotice(null);
    if (cat.level === 'chapter') {
      setSelectedChapterId(cat.id);
      setSelectedSectionId(null);
      setSelectedKnowledgeId(null);
    } else if (cat.level === 'section') {
      setSelectedSectionId(cat.id);
      setSelectedKnowledgeId(null);
      if (cat.parentId) setSelectedChapterId(cat.parentId);
    } else {
      setSelectedKnowledgeId(cat.id);
      const sec = cat.parentId ? categoryHierarchy.find(c => c.id === cat.parentId) : undefined;
      if (sec) {
        setSelectedSectionId(sec.id);
        if (sec.parentId) setSelectedChapterId(sec.parentId);
      }
    }
    // 续刷用全量题目，保证断点题一定在列表里
    startQuiz(getQuestionsByCategoryId(cat.id), lastMap[cat.id]);
  }, [categoryHierarchy, getQuestionsByCategoryId, lastMap, startQuiz]);

  // === 多章节出题：答题卡存档（未答完自动保存，回到列表可恢复） ===
  const planKey = currentUser ? quizPlanStorageKey(currentUser.id) : '';

  useEffect(() => {
    if (!planKey || quizQuestions.length > 0) return;
    try {
      const raw = JSON.parse(localStorage.getItem(planKey) || 'null') as SavedQuizPlan | null;
      if (raw && Array.isArray(raw.questionIds) && raw.questionIds.length > 0) setSavedPlan(raw);
      else setSavedPlan(null);
    } catch { setSavedPlan(null); }
  }, [planKey, quizQuestions.length]);

  useEffect(() => {
    if (!planKey || activePlan.length === 0 || quizQuestions.length === 0) return;
    const data: SavedQuizPlan = {
      plan: activePlan,
      questionIds: quizQuestions.map(q => q.id),
      currentIndex,
      results,
      savedAt: Date.now(),
    };
    try { localStorage.setItem(planKey, JSON.stringify(data)); } catch { /* 配额不足忽略 */ }
  }, [planKey, activePlan, quizQuestions, currentIndex, results]);

  const clearSavedPlan = useCallback(() => {
    if (planKey) {
      try { localStorage.removeItem(planKey); } catch { /* ignore */ }
    }
    setSavedPlan(null);
    setActivePlan([]);
  }, [planKey]);

  /** 按每章设定的题量生成答题卡 */
  const handleStartPlanned = (
    items: { categoryId: string; count: number }[],
    mode: QuizMode,
    includeDone: boolean
  ) => {
    const selections = items.map(i => ({
      categoryId: i.categoryId,
      categoryName: categoryHierarchy.find(c => c.id === i.categoryId)?.name || '未命名章节',
      requested: i.count,
    }));
    const { questions, plan, warnings } = buildQuizByPlan(
      categoryHierarchy, allQuestions, practiceHistory, selections, { includeDone }
    );

    setShowBuilder(false);
    setSelectedCategoryIds([]);
    setBuilderError('');

    if (questions.length === 0) {
      setBuilderError(
        includeDone
          ? '所选章节没有题目，请检查目录或重新导入题库'
          : '所选章节没有可用题目：可能已全部刷完，可开启「包含已刷过的题」再试'
      );
      return;
    }

    setPlanWarnings(warnings);
    setSelectedChapterId('全部');
    setSelectedSectionId(null);
    setSelectedKnowledgeId(null);
    startQuiz(questions, undefined, mode, plan);
  };

  /** 恢复未答完的答题卡 */
  const resumeSavedPlan = () => {
    if (!savedPlan) return;
    const qs = restorePlanQuestions(savedPlan.questionIds, allQuestions);
    if (qs.length === 0) {
      clearSavedPlan();
      setBuilderError('上次的答题卡题目已不存在，存档已清除');
      return;
    }
    const idx = Math.min(Math.max(savedPlan.currentIndex, 0), qs.length - 1);
    setSelectedChapterId('全部');
    setSelectedSectionId(null);
    setSelectedKnowledgeId(null);
    startQuiz(qs, undefined, 'practice', savedPlan.plan);
    setCurrentIndex(idx);
    setResults(savedPlan.results);
    const prev = savedPlan.results.find(r => r.questionId === qs[idx]?.id);
    setSelectedAnswer(prev ? prev.selected : null);
    setShowResult(Boolean(prev));
  };

  // 答题卡按章节分组（用于 AnswerSheet）
  const answerGroups = useMemo(() => {
    if (activePlan.length === 0) return undefined;
    let cursor = 0;
    const groups = activePlan
      .filter(p => p.actual > 0)
      .map(p => {
        const indexes = Array.from({ length: p.actual }, (_, i) => cursor + i);
        cursor += p.actual;
        return { name: p.categoryName, indexes };
      });
    // 题目被删除等情况导致实际题数少于计划时，补一个兜底分组，避免答题卡漏题
    if (cursor < quizQuestions.length) {
      groups.push({
        name: '其他',
        indexes: Array.from({ length: quizQuestions.length - cursor }, (_, i) => cursor + i),
      });
    }
    return groups.length > 0 ? groups : undefined;
  }, [activePlan, quizQuestions.length]);

  // 当前题属于哪一章（多章节混合出题时显示）
  const currentPlanItem = useMemo(() => {
    if (activePlan.length === 0) return null;
    let cursor = 0;
    for (const p of activePlan.filter(item => item.actual > 0)) {
      if (currentIndex < cursor + p.actual) return p;
      cursor += p.actual;
    }
    return null;
  }, [activePlan, currentIndex]);

  // 三级目录共用的底部操作条与弹窗（章 / 节 / 知识点列表都能出题）
  const selectionBar = selectedCategoryIds.length > 0 ? (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 z-40 flex gap-2">
      <button
        onClick={() => setShowCustom(true)}
        className="flex-1 py-3 rounded-2xl bg-gray-900/90 dark:bg-slate-700 text-white text-xs font-semibold shadow-xl backdrop-blur"
      >
        🎛 自定义（{customPool.length} 题）
      </button>
      <button
        onClick={() => { setBuilderError(''); setShowBuilder(true); }}
        className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-semibold shadow-xl"
      >
        🧩 按量出题
      </button>
    </div>
  ) : null;

  const customModal = (
    <CustomQuizModal
      isOpen={showCustom}
      onClose={() => setShowCustom(false)}
      questions={customPool}
      doneIds={doneIds}
      wrongIds={wrongIds}
      onStart={(qs, mode) => {
        setShowCustom(false);
        if (qs.length === 0) return;
        setSelectedCategoryIds([]);
        setSelectedSectionId(null);
        setSelectedKnowledgeId(null);
        // selectedChapterId 必须是非空值，否则会停在章列表分支
        setSelectedChapterId('全部');
        startQuiz(qs, undefined, mode);
      }}
    />
  );

  const builderSelections = useMemo(() => {
    return selectedCategoryIds.map(id => {
      const cat = categoryHierarchy.find(c => c.id === id);
      const all = getQuestionsByCategoryId(id);
      return {
        id,
        name: cat?.name || '未命名',
        level: (cat?.level || 'chapter') as 'chapter' | 'section' | 'knowledge',
        available: all.filter(q => !doneSet.has(q.id)).length,
        availableAll: all.length,
      };
    });
  }, [selectedCategoryIds, categoryHierarchy, getQuestionsByCategoryId, doneSet]);

  const builderModal = (
    <QuizBuilderModal
      key={selectedCategoryIds.join(',') || 'empty'}
      isOpen={showBuilder}
      onClose={() => setShowBuilder(false)}
      selections={builderSelections}
      onStart={handleStartPlanned}
    />
  );

  // 任意层级都可以直接刷本级：优先只刷未做，全部刷完则按"再刷一遍"处理
  const startLevelPractice = (catId: string) => {
    const { all, rest } = pickPracticePool(catId);
    if (all.length === 0) return;
    startQuiz(rest.length > 0 ? rest : all, rest.length > 0 ? undefined : lastMap[catId]);
  };

  const handleStartAllInChapter = () => {
    if (selectedChapterId) startLevelPractice(selectedChapterId);
  };

  const handleStartAllInSection = () => {
    if (selectedSectionId) startLevelPractice(selectedSectionId);
  };

  const handleSelect = useCallback((optionIndex: number) => {
    const currentQ = quizQuestions[currentIndex];
    if (showResult || !currentQ || quizMode === 'recite') return;

    // 多选题：只记录勾选，提交后再判分
    if (isMultiQuestion(currentQ)) {
      setMultiSelected(prev =>
        prev.includes(optionIndex) ? prev.filter(x => x !== optionIndex) : [...prev, optionIndex]
      );
      return;
    }

    setSelectedAnswer(optionIndex);
    setShowResult(true);

    const isCorrect = optionIndex === currentQ.answer;
    setResults(prev => [...prev, { questionId: currentQ.id, selected: optionIndex, selectedAll: [optionIndex], isCorrect }]);

    dispatch({
      type: 'RECORD_ANSWER',
      payload: { questionId: currentQ.id, isCorrect },
    });

    // 记录刷题历史
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const record: PracticeRecord = {
      id: nextPracticeId(),
      date: new Date().toISOString().split('T')[0],
      questionId: currentQ.id,
      userAnswer: optionIndex,
      correctAnswer: currentQ.answer,
      isCorrect,
      timeSpent,
      mode: 'quiz',
      category: currentQ.category,
    };
    addPracticeRecord(record);

    // 记录断点：下次进入该目录可以直接"继续上次"
    if (activeCategoryId) saveLast(activeCategoryId, currentQ.id);

    // 答错时自动加入错题本
    if (!isCorrect) {
      addWrongQuestion(currentQ.id);
    }
  }, [showResult, quizQuestions, currentIndex, dispatch, addWrongQuestion, addPracticeRecord, questionStartTime,
      activeCategoryId, saveLast]);

  // 提交多选题：选出的集合必须与正确答案完全一致才判对
  const handleSubmitMulti = useCallback(() => {
    const currentQ = quizQuestions[currentIndex];
    if (!currentQ || showResult || multiSelected.length === 0) return;
    const isCorrect = checkAnswer(currentQ, multiSelected);
    const first = multiSelected[0];
    setResults(prev => [...prev, {
      questionId: currentQ.id, selected: first, selectedAll: [...multiSelected], isCorrect,
    }]);
    setShowResult(true);

    dispatch({ type: 'RECORD_ANSWER', payload: { questionId: currentQ.id, isCorrect } });

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const record: PracticeRecord = {
      id: nextPracticeId(),
      date: new Date().toISOString().split('T')[0],
      questionId: currentQ.id,
      userAnswer: first,
      correctAnswer: currentQ.answer,
      isCorrect,
      timeSpent,
      mode: 'quiz',
      category: currentQ.category,
    };
    addPracticeRecord(record);

    if (activeCategoryId) saveLast(activeCategoryId, currentQ.id);
    if (!isCorrect) addWrongQuestion(currentQ.id);
  }, [showResult, quizQuestions, currentIndex, multiSelected, dispatch, addWrongQuestion,
      addPracticeRecord, questionStartTime, activeCategoryId, saveLast]);

  const handleConfused = useCallback(() => {
    if (!quizQuestions[currentIndex]) return;
    toggleConfused(quizQuestions[currentIndex].id);
    setConfusedAnim(true);
    setTimeout(() => setConfusedAnim(false), 600);
  }, [quizQuestions, currentIndex, toggleConfused]);

  // 跳到指定题目：若该题此前已作答则恢复作答状态，否则保持未作答（滑动不显示答案）
  const goToQuestion = useCallback((nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= quizQuestions.length) return;
    const target = quizQuestions[nextIndex];
    const prev = results.find(r => r.questionId === target.id);
    // 切题即记录断点，不必等作答（中途退出也能续刷）
    if (activeCategoryId) saveLast(activeCategoryId, target.id);
    setCurrentIndex(nextIndex);
    setQuestionStartTime(Date.now());
    if (prev) {
      setSelectedAnswer(prev.selected);
      setMultiSelected(prev.selectedAll ?? []);
      setShowResult(true);
    } else {
      setSelectedAnswer(null);
      setMultiSelected([]);
      setShowResult(false);
    }
  }, [quizQuestions, results, activeCategoryId, saveLast]);

  // 逐级回退：答题 → 当前层目录列表 → 上一级
  const handleBack = () => {
    // 从首页进入的刷题，退出直接回首页，不回到刷题模式的目录列表
    if (fromHome && quizQuestions.length > 0) {
      router.push('/');
      return;
    }
    if (quizQuestions.length > 0) {
      startQuiz([]);
      if (selectedKnowledgeId) {
        setSelectedKnowledgeId(null);
        return;
      }
      if (selectedSectionId) {
        // 本节有知识点时回到知识点列表，否则退回章
        if (getKnowledges(selectedSectionId).length > 0) return;
        setSelectedSectionId(null);
        return;
      }
      if (selectedChapterId) setSelectedChapterId(null);
      return;
    }
    if (selectedKnowledgeId) { setSelectedKnowledgeId(null); return; }
    if (selectedSectionId) { setSelectedSectionId(null); return; }
    if (selectedChapterId) { setSelectedChapterId(null); }
  };

  // 硬件返回键跟随页面层级：正在答题/已在某级目录时先退这一级，
  // 退到最外层再交给全局返回（回首页）。用 ref 保证拿到的是最新闭包。
  const backActionRef = useRef<() => boolean>(() => false);
  useEffect(() => {
    backActionRef.current = () => {
      const hasLevel =
        quizQuestions.length > 0 ||
        !!selectedChapterId ||
        !!selectedSectionId ||
        !!selectedKnowledgeId;
      if (!hasLevel) return false;
      handleBack();
      return true;
    };
  });

  useEffect(() => {
    return registerBackInterceptor(() => backActionRef.current());
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < quizQuestions.length - 1) {
      goToQuestion(currentIndex + 1);
    } else if (quizMode === 'recite') {
      // 背题模式不产生作答记录，刷完直接回目录
      clearSavedPlan();
      handleBack();
      return;
    } else {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const correct = results.filter(r => r.isCorrect).length;
      const wrong = results.filter(r => !r.isCorrect).length;
      const unansweredCount = quizQuestions.length - results.length;
      const params = new URLSearchParams({
        total: quizQuestions.length.toString(),
        correct: correct.toString(),
        wrong: wrong.toString(),
        unanswered: unansweredCount.toString(),
        time: timeSpent.toString(),
        category: selectedChapterId || '',
        categoryId: activeCategoryId || '',
        from: fromHome ? 'home' : '',
      });
      // 答题卡已完成，清掉存档
      clearSavedPlan();
      router.push(`/result?${params.toString()}`);
    }
  }, [currentIndex, quizQuestions, startTime, results, router, selectedChapterId, activeCategoryId, goToQuestion, quizMode, handleBack, fromHome, clearSavedPlan]);

  // 滑动手势：中间区左滑下一题/右滑上一题；左边距区左滑返回；右边距区右滑无效
  const swipeRef = useSwipeNav<HTMLDivElement>({
    onNext: () => goToQuestion(currentIndex + 1),
    onPrev: () => goToQuestion(currentIndex - 1),
    onLeftEdgeBack: handleBack,
  });

  // 章选择界面
  if (!selectedChapterId) {
    return (
      <>
      <div className={`px-4 pt-6 space-y-4 ${selectedCategoryIds.length > 0 ? 'pb-24' : 'pb-4'}`}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 dark:text-slate-200">⚡ 刷题模式</h1>
          <button
            onClick={() => toggleSelectAll(chapters.map(c => c.id))}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
          >
            {chapters.every(c => selectedCategoryIds.includes(c.id)) ? '取消全选' : '全选'}
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400">选择一个分类开始刷题；勾选左侧方框可批量组卷</p>

        {builderError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
            <p className="text-xs text-red-600 dark:text-red-400">{builderError}</p>
          </div>
        )}

        {savedPlan && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 space-y-2">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">有一张未完成的答题卡</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
              {savedPlan.plan.filter(p => p.actual > 0).length} 个章节 · 共 {savedPlan.questionIds.length} 题 · 已答 {savedPlan.results.length} 题
            </p>
            <div className="flex gap-2">
              <button
                onClick={resumeSavedPlan}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium"
              >
                继续答题
              </button>
              <button
                onClick={clearSavedPlan}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs"
              >
                放弃
              </button>
            </div>
          </div>
        )}
        <div className="space-y-3">
          {chapters.map((ch) => {
            const sections = getSections(ch.id);
            const stats = getCategoryStats(categoryHierarchy, allQuestions, practiceHistory, ch.id);
            return (
              <div
                key={ch.id}
                className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all card-hover"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleCategorySelect(ch.id)}
                    aria-label={selectedCategoryIds.includes(ch.id) ? '取消选择此目录' : '选择此目录'}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selectedCategoryIds.includes(ch.id)
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-gray-300 dark:border-slate-500'
                    }`}
                  >
                    {selectedCategoryIds.includes(ch.id) && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <button onClick={() => handleSelectChapter(ch.id)} className="flex-1 min-w-0 text-left">
                    <h3 className="font-semibold text-gray-800 dark:text-slate-200 truncate">{ch.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      {stats.done}/{stats.total} 题{sections.length > 0 ? ` · ${sections.length} 个节` : ''}
                    </p>
                    <MasteryDots level={getMasteryLevel(stats)} />
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    {lastMap[ch.id] && (
                      <button
                        onClick={() => resumeQuiz(ch.id)}
                        className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                      >
                        继续上次 ▶
                      </button>
                    )}
                    <button onClick={() => handleSelectChapter(ch.id)} aria-label={`进入${ch.name}`} className="w-8 h-8 flex items-center justify-center text-emerald-500 text-xl">→</button>
                  </div>
                </div>
              </div>
            );
          })}
          <button
            onClick={() => { setSelectedChapterId('全部'); startQuiz([...allQuestions].sort(() => Math.random() - 0.5)); }}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all text-left card-hover"
          >
            <h3 className="font-semibold">🎯 随机刷题</h3>
            <p className="text-xs text-emerald-100 mt-0.5">全部 {allQuestions.length} 道题随机</p>
          </button>
        </div>

        {selectionBar}
      </div>

      {customModal}
      {builderModal}
      </>
    );
  }

  const currentChapter = selectedChapterId ? categoryHierarchy.find(c => c.id === selectedChapterId) : undefined;
  const currentSection = selectedSectionId ? categoryHierarchy.find(c => c.id === selectedSectionId) : undefined;

  // 节列表（章有子级时显示）
  if (!quizQuestions.length && selectedChapterId && !selectedSectionId) {
    const sections = getSections(selectedChapterId);
    if (sections.length > 0) {
      const chapterStats = getCategoryStats(categoryHierarchy, allQuestions, practiceHistory, selectedChapterId);
      const chapterRemaining = Math.max(chapterStats.total - chapterStats.done, 0);
      return (
        <div className={`px-4 pt-6 space-y-4 ${selectedCategoryIds.length > 0 ? 'pb-24' : 'pb-4'}`}>
          <div className="flex items-center gap-3">
            <button onClick={handleBack} aria-label="返回" className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 min-w-[44px] min-h-[44px] flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="flex-1 min-w-0 truncate text-lg font-bold text-gray-800 dark:text-slate-200">{currentChapter?.name || '选择节'}</h1>
            <button
              onClick={() => toggleSelectAll(sections.map(s => s.id))}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 shrink-0"
            >
              {sections.every(s => selectedCategoryIds.includes(s.id)) ? '取消全选' : '全选'}
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400">勾选左侧方框，可为每个子目录指定题量出卷</p>
          {quizNotice && (
            <QuizNotice
              notice={quizNotice}
              onRestart={() => { startQuiz(getQuestionsByCategoryId(quizNotice.id), lastMap[quizNotice.id]); setQuizNotice(null); }}
              onDismiss={() => setQuizNotice(null)}
            />
          )}
          <div className="space-y-2.5">
            {sections.map((sec) => {
              const knowledges = getKnowledges(sec.id);
              const stats = getCategoryStats(categoryHierarchy, allQuestions, practiceHistory, sec.id);
              return (
                <div key={sec.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <SelectCheckbox
                      checked={selectedCategoryIds.includes(sec.id)}
                      onChange={() => toggleCategorySelect(sec.id)}
                      label={selectedCategoryIds.includes(sec.id) ? '取消选择此节' : '选择此节'}
                    />
                    <button
                      onClick={() => handleSelectSection(sec.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-800 dark:text-slate-200 truncate">{sec.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            {stats.done}/{stats.total} 题{knowledges.length > 0 ? ` · ${knowledges.length} 个知识点` : ''}
                          </p>
                          <MasteryDots level={getMasteryLevel(stats)} />
                        </div>
                        <span className="text-blue-500 text-xl shrink-0">→</span>
                      </div>
                    </button>
                  </div>
                  {lastMap[sec.id] && (
                    <button
                      onClick={() => resumeQuiz(sec.id)}
                      className="w-full text-left px-4 pb-3 -mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium"
                    >
                      继续上次 ▶
                    </button>
                  )}
                </div>
              );
            })}
            <button
              onClick={handleStartAllInChapter}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all text-left card-hover"
            >
              <h3 className="font-semibold">
                {chapterRemaining > 0 ? `📚 刷本章未做（${chapterRemaining} 题）` : `🔁 本章已刷完，再刷一遍（${chapterStats.total} 题）`}
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">共 {chapterStats.total} 道题 · 已做 {chapterStats.done} 道</p>
            </button>
          </div>
          {selectionBar}
          {customModal}
          {builderModal}
        </div>
      );
    }
  }

  // 知识点列表（节有子级时显示）
  if (!quizQuestions.length && selectedSectionId && !selectedKnowledgeId) {
    const knowledges = getKnowledges(selectedSectionId);
    if (knowledges.length > 0) {
      const sectionStats = getCategoryStats(categoryHierarchy, allQuestions, practiceHistory, selectedSectionId);
      const sectionRemaining = Math.max(sectionStats.total - sectionStats.done, 0);
      return (
        <div className={`px-4 pt-6 space-y-4 ${selectedCategoryIds.length > 0 ? 'pb-24' : 'pb-4'}`}>
          <div className="flex items-center gap-3">
            <button onClick={handleBack} aria-label="返回" className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 min-w-[44px] min-h-[44px] flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="flex-1 min-w-0 truncate text-lg font-bold text-gray-800 dark:text-slate-200">{currentSection?.name || '选择知识点'}</h1>
            <button
              onClick={() => toggleSelectAll(knowledges.map(k => k.id))}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 shrink-0"
            >
              {knowledges.every(k => selectedCategoryIds.includes(k.id)) ? '取消全选' : '全选'}
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400">勾选左侧方框，可为每个子目录指定题量出卷</p>
          {quizNotice && (
            <QuizNotice
              notice={quizNotice}
              onRestart={() => { startQuiz(getQuestionsByCategoryId(quizNotice.id), lastMap[quizNotice.id]); setQuizNotice(null); }}
              onDismiss={() => setQuizNotice(null)}
            />
          )}
          <div className="space-y-2.5">
            {knowledges.map((kn) => {
              const stats = getCategoryStats(categoryHierarchy, allQuestions, practiceHistory, kn.id);
              return (
                <div
                  key={kn.id}
                  className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all card-hover flex items-center gap-3"
                >
                  <SelectCheckbox
                    checked={selectedCategoryIds.includes(kn.id)}
                    onChange={() => toggleCategorySelect(kn.id)}
                    label={selectedCategoryIds.includes(kn.id) ? '取消选择此知识点' : '选择此知识点'}
                  />
                  <button
                    onClick={() => handleSelectKnowledge(kn.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-800 dark:text-slate-200 truncate">{kn.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{stats.done}/{stats.total} 题</p>
                        <MasteryDots level={getMasteryLevel(stats)} />
                      </div>
                      <span className="text-blue-500 text-xl shrink-0">→</span>
                    </div>
                  </button>
                </div>
              );
            })}
            <button
              onClick={handleStartAllInSection}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all text-left card-hover"
            >
              <h3 className="font-semibold">
                {sectionRemaining > 0 ? `📂 刷本节未做（${sectionRemaining} 题）` : `🔁 本节已刷完，再刷一遍（${sectionStats.total} 题）`}
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">共 {sectionStats.total} 道题 · 已做 {sectionStats.done} 道</p>
            </button>
          </div>
          {selectionBar}
          {customModal}
          {builderModal}
        </div>
      );
    }
  }

  if (quizQuestions.length === 0) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-gray-500">该目录暂无题目</p>
        <button onClick={handleBack} className="mt-4 text-emerald-500 text-sm">返回选择</button>
      </div>
    );
  }

  const currentQ = quizQuestions[currentIndex];
  // 兜底：题目列表被外部改动导致下标越界时不再白屏
  if (!currentQ) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-gray-500">题目已不可用</p>
        <button onClick={handleBack} className="mt-4 text-emerald-500 text-sm">返回选择</button>
      </div>
    );
  }
  const isConfused = confusedQuestions.includes(currentQ.id);

  return (
    <div ref={swipeRef} className={`px-4 pt-6 space-y-4 ${selectedCategoryIds.length > 0 ? 'pb-24' : 'pb-4'}`}>
      {/* 顶部进度条 */}
      <div className="flex items-center gap-3">
        <button onClick={handleBack} aria-label="返回" className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 dark:text-slate-400 min-w-[40px] text-right">{currentIndex + 1}/{quizQuestions.length}</span>
        <button
          onClick={() => setShowAnswerSheet(true)}
          className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 shrink-0"
        >
          答题卡
        </button>
      </div>

      {/* 多章节混合出题：当前所属章节 */}
      {currentPlanItem && (
        <div className="flex items-center justify-center gap-2 -mt-1">
          <span className="text-[11px] text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-full">
            {currentPlanItem.categoryName}
          </span>
          <span className="text-[11px] text-gray-400">本章 {currentPlanItem.actual} 题</span>
        </div>
      )}

      {/* 抽题降级提示（某章题量不足 / 无可用题） */}
      {planWarnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5 space-y-1">
          {planWarnings.slice(0, 3).map((w, i) => (
            <p key={i} className="text-xs text-amber-700 dark:text-amber-300">· {w}</p>
          ))}
          {planWarnings.length > 3 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">还有 {planWarnings.length - 3} 条…</p>
          )}
          <button onClick={() => setPlanWarnings([])} className="text-[11px] text-amber-600 dark:text-amber-400 underline">
            知道了
          </button>
        </div>
      )}

      {/* 题目卡片 + 收藏/不会按钮 */}
      <div className="relative">
        <QuestionCard question={currentQ} index={currentIndex} total={quizQuestions.length} />
        {/* 收藏按钮 - 右上角偏左 */}
        <div className="absolute top-2 right-14">
          <FavoriteButton questionId={currentQ.id} size="sm" />
        </div>
        {/* 不会按钮 - 右上角 */}
        <button
          onClick={handleConfused}
          className={`absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isConfused
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-white/80 dark:bg-slate-800/80 text-gray-400 dark:text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30'
          } ${confusedAnim ? 'animate-bounce-small' : ''}`}
          title="标记为不会"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01" />
          </svg>
        </button>
      </div>

      {/* 选项 */}
      <div className="space-y-2.5">
        {currentQ.options.map((opt, idx) => {
          const correctSet = correctIndices(currentQ);
          const isCorrect = correctSet.includes(idx);
          const reveal = quizMode === 'recite' || showResult;
          const isMulti = isMultiQuestion(currentQ);
          const picked = isMulti ? multiSelected.includes(idx) : idx === selectedAnswer;
          const isWrong = quizMode !== 'recite' && showResult && !isMulti && idx === selectedAnswer && !isCorrect;
          const isCorrectAnswer = reveal && isCorrect;
          const isPicked = !reveal && picked;

          return (
            <OptionButton
              key={idx}
              label={labels[idx]}
              text={opt}
              correct={isCorrectAnswer}
              wrong={isWrong}
              selected={isPicked}
              disabled={reveal}
              onClick={() => handleSelect(idx)}
            />
          );
        })}
      </div>

      {/* 多选题提示 + 提交按钮 */}
      {isMultiQuestion(currentQ) && quizMode !== 'recite' && !showResult && (
        <>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            本题为多选题，可选择多个选项，需全部选对方可得分。
          </p>
          <button
            onClick={handleSubmitMulti}
            disabled={multiSelected.length === 0}
            className="w-full min-h-[48px] bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            提交答案（已选 {multiSelected.length} 项）
          </button>
        </>
      )}

      {/* 解析：背题模式直接展开完整解析 */}
      {quizMode === 'recite' ? (
        <ExplanationPanel
          correct
          correctAnswer={answerText(currentQ)}
          brief={currentQ.explanation.brief}
          detailed={currentQ.explanation.detailed}
          knowledge={currentQ.explanation.knowledge}
          tips={currentQ.explanation.tips}
          mode="recite"
        />
      ) : showResult && (
        <ExplanationPanel
          correct={isMultiQuestion(currentQ)
            ? checkAnswer(currentQ, multiSelected)
            : selectedAnswer === currentQ.answer}
          correctAnswer={answerText(currentQ)}
          brief={currentQ.explanation.brief}
          mode="quiz"
        />
      )}

      {/* AI 讲解与追问（手动触发，默认不调 AI） */}
      {showResult && quizMode !== 'recite' && (
        <AiChat
          question={currentQ}
          userAnswer={selectedAnswer}
          correctAnswer={currentQ.answer}
          correctAnswerText={answerText(currentQ)}
          userAnswerText={isMultiQuestion(currentQ)
            ? (multiSelected.length
                ? multiSelected.map(i => `${labels[i]}. ${currentQ.options[i]}`).join('、')
                : '未作答')
            : (selectedAnswer !== null ? `${labels[selectedAnswer]}. ${currentQ.options[selectedAnswer]}` : '未作答')}
        />
      )}

      {/* 下一题按钮 */}
      {(showResult || quizMode === 'recite') && (
        <button
          onClick={handleNext}
          className="w-full min-h-[48px] bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors shadow-md"
        >
          {currentIndex < quizQuestions.length - 1
            ? '下一题 →'
            : quizMode === 'recite' ? '完成背题 🎉' : '查看结果 🎉'}
        </button>
      )}

      <AnswerSheet
        isOpen={showAnswerSheet}
        questionIds={quizQuestions.map(q => q.id)}
        currentIndex={currentIndex}
        results={results}
        onJump={goToQuestion}
        onClose={() => setShowAnswerSheet(false)}
        groups={answerGroups}
      />
    </div>
  );
}

/** 目录已全部刷完的提示条 */
function QuizNotice({
  notice,
  onRestart,
  onDismiss,
}: {
  notice: { id: string; name: string; total: number };
  onRestart: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 space-y-2">
      <p className="text-sm text-amber-700 dark:text-amber-300">
        「{notice.name}」的 {notice.total} 道题已经全部刷完
      </p>
      <div className="flex gap-2">
        <button onClick={onRestart} className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium">再刷一遍</button>
        <button onClick={onDismiss} className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs">知道了</button>
      </div>
    </div>
  );
}

/** 目录多选勾选框（章 / 节 / 知识点通用） */
function SelectCheckbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      aria-label={label}
      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
        checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-slate-500'
      }`}
    >
      {checked && (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

/** 掌握度 5 段点（与粉笔目录行的进度点一致） */
function MasteryDots({ level }: { level: number }) {
  return (
    <span className="flex gap-1 mt-1" aria-label={`掌握度 ${level}/5`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i <= level ? 'bg-amber-400' : 'bg-gray-200 dark:bg-slate-600'}`}
        />
      ))}
    </span>
  );
}
