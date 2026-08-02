'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Question, PracticeRecord } from '@/types';
import QuestionCard from '@/components/QuestionCard';
import OptionButton from '@/components/OptionButton';
import ExplanationPanel from '@/components/ExplanationPanel';
import FavoriteButton from '@/components/FavoriteButton';

const labels = ['A', 'B', 'C', 'D'];

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
  const { dispatch, addWrongQuestion, toggleConfused, confusedQuestions, addPracticeRecord, allQuestions, categoryHierarchy } = useStore();

  // 章列表
  const chapters = useMemo(() => {
    return categoryHierarchy
      .filter(c => c.level === 'chapter' && c.parentId === null)
      .sort((a, b) => a.order - b.order);
  }, [categoryHierarchy]);

  // 获取章下的节
  const getSections = useCallback((chapterId: string) => {
    return categoryHierarchy
      .filter(c => c.level === 'section' && c.parentId === chapterId)
      .sort((a, b) => a.order - b.order);
  }, [categoryHierarchy]);

  // 根据分类ID获取题目
  const getQuestionsByCategoryId = useCallback((catId: string) => {
    const cat = categoryHierarchy.find(c => c.id === catId);
    if (!cat) return [];
    const ids = new Set(cat.questionIds);
    // 如果是章，也包含所有节的题目
    if (cat.level === 'chapter') {
      const sections = getSections(catId);
      sections.forEach(s => s.questionIds.forEach(id => ids.add(id)));
    }
    return allQuestions.filter(q => ids.has(q.id));
  }, [categoryHierarchy, allQuestions, getSections]);

  // 选中状态: null=未选, chapterId=选了章, sectionId=选了节
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<{ questionId: string; selected: number; isCorrect: boolean }[]>([]);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [confusedAnim, setConfusedAnim] = useState(false);

  // 支持 URL 参数直接跳转
  useEffect(() => {
    const chId = searchParams.get('chapterId');
    const secId = searchParams.get('sectionId');
    const oldCategory = searchParams.get('category');

    if (secId) {
      // 从节ID找到章ID
      const sec = categoryHierarchy.find(c => c.id === secId);
      if (sec && sec.parentId) {
        setSelectedChapterId(sec.parentId);
      }
      setSelectedSectionId(secId);
      const qs = getQuestionsByCategoryId(secId);
      setQuizQuestions(qs.length > 0 ? qs : []);
    } else if (chId) {
      setSelectedChapterId(chId);
      const qs = getQuestionsByCategoryId(chId);
      setQuizQuestions(qs.length > 0 ? qs : []);
    } else if (oldCategory) {
      // 向后兼容旧分类名
      const ch = chapters.find(c => c.name === oldCategory);
      if (ch) {
        setSelectedChapterId(ch.id);
        const qs = getQuestionsByCategoryId(ch.id);
        setQuizQuestions(qs.length > 0 ? qs : []);
      }
    }
  }, [searchParams, categoryHierarchy, chapters, getQuestionsByCategoryId]);

  const handleSelectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setSelectedSectionId(null);
    const sections = getSections(chapterId);
    if (sections.length === 0) {
      // 没有节，直接开始
      const qs = getQuestionsByCategoryId(chapterId);
      setQuizQuestions(qs.length > 0 ? qs : []);
    }
  };

  const handleSelectSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    const qs = getQuestionsByCategoryId(sectionId);
    setQuizQuestions(qs.length > 0 ? qs : []);
  };

  const handleStartAllInChapter = () => {
    if (!selectedChapterId) return;
    setSelectedSectionId(null);
    const qs = getQuestionsByCategoryId(selectedChapterId);
    setQuizQuestions(qs.length > 0 ? [...qs].sort(() => Math.random() - 0.5) : []);
  };

  const handleSelect = useCallback((optionIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(optionIndex);
    setShowResult(true);

    const currentQ = quizQuestions[currentIndex];
    const isCorrect = optionIndex === currentQ.answer;
    setResults(prev => [...prev, { questionId: currentQ.id, selected: optionIndex, isCorrect }]);

    dispatch({
      type: 'RECORD_ANSWER',
      payload: { questionId: currentQ.id, isCorrect },
    });

    // 记录刷题历史
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const record: PracticeRecord = {
      id: `pr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

    // 答错时自动加入错题本
    if (!isCorrect) {
      addWrongQuestion(currentQ.id);
    }
  }, [showResult, quizQuestions, currentIndex, dispatch, addWrongQuestion, addPracticeRecord, questionStartTime]);

  const handleConfused = useCallback(() => {
    if (!quizQuestions[currentIndex]) return;
    toggleConfused(quizQuestions[currentIndex].id);
    setConfusedAnim(true);
    setTimeout(() => setConfusedAnim(false), 600);
  }, [quizQuestions, currentIndex, toggleConfused]);

  const handleNext = useCallback(() => {
    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setQuestionStartTime(Date.now());
    } else {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const correct = results.filter(r => r.isCorrect).length;
      const wrong = results.filter(r => !r.isCorrect).length;
      const params = new URLSearchParams({
        total: quizQuestions.length.toString(),
        correct: correct.toString(),
        wrong: wrong.toString(),
        unanswered: '0',
        time: timeSpent.toString(),
        category: selectedChapterId || '',
      });
      router.push(`/result?${params.toString()}`);
    }
  }, [currentIndex, quizQuestions.length, startTime, results, router, selectedChapterId]);

  const handleBack = () => {
    if (quizQuestions.length > 0) {
      setQuizQuestions([]);
      setSelectedSectionId(null);
      setSelectedChapterId(null);
    } else if (selectedSectionId) {
      setSelectedSectionId(null);
    } else if (selectedChapterId) {
      setSelectedChapterId(null);
    }
  };

  // 章选择界面
  if (!selectedChapterId) {
    return (
      <div className="px-4 pt-6 pb-4 space-y-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-200">⚡ 刷题模式</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">选择一个分类开始刷题</p>
        <div className="space-y-3">
          {chapters.map((ch) => {
            const sections = getSections(ch.id);
            const totalQ = ch.questionIds.length + sections.reduce((s, sec) => s + sec.questionIds.length, 0);
            return (
              <button
                key={ch.id}
                onClick={() => handleSelectChapter(ch.id)}
                className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all text-left card-hover"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-slate-200">{ch.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      {totalQ} 道题{sections.length > 0 ? ` · ${sections.length} 个节` : ''}
                    </p>
                  </div>
                  <span className="text-emerald-500 text-xl">→</span>
                </div>
              </button>
            );
          })}
          <button
            onClick={() => { setSelectedChapterId('全部'); setQuizQuestions([...allQuestions].sort(() => Math.random() - 0.5)); }}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all text-left card-hover"
          >
            <h3 className="font-semibold">🎯 随机刷题</h3>
            <p className="text-xs text-emerald-100 mt-0.5">全部 {allQuestions.length} 道题随机</p>
          </button>
        </div>
      </div>
    );
  }

  // 节选择界面（章有节时显示）
  if (!quizQuestions.length && !selectedSectionId) {
    const sections = getSections(selectedChapterId);
    const chapter = categoryHierarchy.find(c => c.id === selectedChapterId);
    if (sections.length > 0) {
      return (
        <div className="px-4 pt-6 pb-4 space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 min-w-[44px] min-h-[44px] flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-lg font-bold text-gray-800 dark:text-slate-200">{chapter?.name || '选择节'}</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400">选择一个节开始刷题</p>
          <div className="space-y-2.5">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => handleSelectSection(sec.id)}
                className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all text-left card-hover"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-slate-200">{sec.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{sec.questionIds.length} 道题</p>
                  </div>
                  <span className="text-blue-500 text-xl">→</span>
                </div>
              </button>
            ))}
            <button
              onClick={handleStartAllInChapter}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all text-left card-hover"
            >
              <h3 className="font-semibold">📚 刷本章全部题目</h3>
              <p className="text-xs text-emerald-100 mt-0.5">共 {getQuestionsByCategoryId(selectedChapterId).length} 道题</p>
            </button>
          </div>
        </div>
      );
    }
  }

  if (quizQuestions.length === 0) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-gray-500">该分类暂无题目</p>
        <button onClick={handleBack} className="mt-4 text-emerald-500 text-sm">返回选择</button>
      </div>
    );
  }

  const currentQ = quizQuestions[currentIndex];
  const isConfused = confusedQuestions.includes(currentQ.id);

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* 顶部进度条 */}
      <div className="flex items-center gap-3">
        <button onClick={handleBack} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 dark:text-slate-400 min-w-[40px] text-right">{currentIndex + 1}/{quizQuestions.length}</span>
      </div>

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
          const isCorrect = idx === currentQ.answer;
          const isWrong = showResult && idx === selectedAnswer && !isCorrect;
          const isCorrectAnswer = showResult && isCorrect;

          return (
            <OptionButton
              key={idx}
              label={labels[idx]}
              text={opt}
              correct={isCorrectAnswer}
              wrong={isWrong}
              disabled={showResult}
              onClick={() => handleSelect(idx)}
            />
          );
        })}
      </div>

      {/* 解析 */}
      {showResult && (
        <ExplanationPanel
          correct={selectedAnswer === currentQ.answer}
          correctAnswer={`${labels[currentQ.answer]}. ${currentQ.options[currentQ.answer]}`}
          brief={currentQ.explanation.brief}
          mode="quiz"
        />
      )}

      {/* 下一题按钮 */}
      {showResult && (
        <button
          onClick={handleNext}
          className="w-full min-h-[48px] bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors shadow-md"
        >
          {currentIndex < quizQuestions.length - 1 ? '下一题 →' : '查看结果 🎉'}
        </button>
      )}
    </div>
  );
}
