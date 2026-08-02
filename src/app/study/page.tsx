'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import Link from 'next/link';
import { Question, PracticeRecord } from '@/types';
import QuestionCard from '@/components/QuestionCard';
import OptionButton from '@/components/OptionButton';
import ExplanationPanel from '@/components/ExplanationPanel';
import FavoriteButton from '@/components/FavoriteButton';

const labels = ['A', 'B', 'C', 'D'];

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-6 text-center text-gray-500">加载中...</div>}>
      <StudyContent />
    </Suspense>
  );
}

function StudyContent() {
  const searchParams = useSearchParams();
  const { progress, recordAnswer, toggleFavorite, addWrongQuestion, toggleConfused, confusedQuestions, addPracticeRecord, allQuestions, categoryHierarchy } = useStore();

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
    if (cat.level === 'chapter') {
      const sections = getSections(catId);
      sections.forEach(s => s.questionIds.forEach(id => ids.add(id)));
    }
    return allQuestions.filter(q => ids.has(q.id));
  }, [categoryHierarchy, allQuestions, getSections]);

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [studyQuestions, setStudyQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [confusedAnim, setConfusedAnim] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // URL参数支持
  useEffect(() => {
    const chId = searchParams.get('chapterId');
    const secId = searchParams.get('sectionId');
    const oldCategory = searchParams.get('category');

    if (secId) {
      const sec = categoryHierarchy.find(c => c.id === secId);
      if (sec && sec.parentId) setSelectedChapterId(sec.parentId);
      setSelectedSectionId(secId);
      const qs = getQuestionsByCategoryId(secId);
      setStudyQuestions(qs.length > 0 ? qs : []);
    } else if (chId) {
      setSelectedChapterId(chId);
      const qs = getQuestionsByCategoryId(chId);
      setStudyQuestions(qs.length > 0 ? qs : []);
    } else if (oldCategory) {
      const ch = chapters.find(c => c.name === oldCategory);
      if (ch) {
        setSelectedChapterId(ch.id);
        const qs = getQuestionsByCategoryId(ch.id);
        setStudyQuestions(qs.length > 0 ? qs : []);
      }
    }
  }, [searchParams, categoryHierarchy, chapters, getQuestionsByCategoryId]);

  const handleSelectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setSelectedSectionId(null);
    const sections = getSections(chapterId);
    if (sections.length === 0) {
      const qs = getQuestionsByCategoryId(chapterId);
      setStudyQuestions(qs.length > 0 ? qs : []);
    }
  };

  const handleSelectSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    const qs = getQuestionsByCategoryId(sectionId);
    setStudyQuestions(qs.length > 0 ? qs : []);
  };

  const handleStartAllInChapter = () => {
    if (!selectedChapterId) return;
    setSelectedSectionId(null);
    const qs = getQuestionsByCategoryId(selectedChapterId);
    setStudyQuestions(qs.length > 0 ? qs : []);
  };

  const handleSelect = (optionIndex: number) => {
    if (answered) return;
    setSelectedAnswer(optionIndex);
    setAnswered(true);
    setShowExplanation(true);
    const currentQ = studyQuestions[currentIndex];
    const isCorrect = optionIndex === currentQ.answer;
    recordAnswer(currentQ.id, isCorrect);

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
      mode: 'study',
      category: currentQ.category,
    };
    addPracticeRecord(record);

    if (!isCorrect) {
      addWrongQuestion(currentQ.id);
    }
  };

  const handleShowExplanation = () => {
    setShowExplanation(true);
    if (!answered) {
      setAnswered(true);
    }
  };

  const handleConfused = useCallback(() => {
    if (!studyQuestions[currentIndex]) return;
    toggleConfused(studyQuestions[currentIndex].id);
    setConfusedAnim(true);
    setTimeout(() => setConfusedAnim(false), 600);
  }, [studyQuestions, currentIndex, toggleConfused]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setAnswered(false);
      setQuestionStartTime(Date.now());
    }
  };

  const handleNext = () => {
    if (currentIndex < studyQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setAnswered(false);
      setQuestionStartTime(Date.now());
    }
  };

  const handleBack = () => {
    if (studyQuestions.length > 0) {
      setStudyQuestions([]);
      setSelectedSectionId(null);
      setSelectedChapterId(null);
    } else if (selectedSectionId) {
      setSelectedSectionId(null);
    } else if (selectedChapterId) {
      setSelectedChapterId(null);
    }
  };

  // 章选择
  if (!selectedChapterId) {
    return (
      <div className="px-4 pt-6 pb-4 space-y-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-200">📖 学习模式</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">选择一个分类开始深度学习</p>

        {/* 知识点库入口 */}
        <Link
          href="/knowledge"
          className="block bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 shadow-lg shadow-indigo-200 hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div className="flex-1 text-white">
              <h3 className="font-bold text-base">知识点库</h3>
              <p className="text-sm text-white/80 mt-0.5">核心知识点汇总，随时查阅复习</p>
            </div>
            <span className="text-white/60 text-xl">→</span>
          </div>
        </Link>

        <div className="space-y-3">
          {chapters.map((ch) => {
            const sections = getSections(ch.id);
            const totalQ = ch.questionIds.length + sections.reduce((s, sec) => s + sec.questionIds.length, 0);
            return (
              <button
                key={ch.id}
                onClick={() => handleSelectChapter(ch.id)}
                className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all text-left card-hover"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-slate-200">{ch.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      {totalQ} 道题 · 含详细解析{sections.length > 0 ? ` · ${sections.length} 个节` : ''}
                    </p>
                  </div>
                  <span className="text-blue-500 text-xl">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 节选择
  if (!studyQuestions.length && !selectedSectionId) {
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
          <p className="text-sm text-gray-500 dark:text-slate-400">选择一个节开始学习</p>
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
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{sec.questionIds.length} 道题 · 含详细解析</p>
                  </div>
                  <span className="text-blue-500 text-xl">→</span>
                </div>
              </button>
            ))}
            <button
              onClick={handleStartAllInChapter}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all text-left card-hover"
            >
              <h3 className="font-semibold">📚 学习本章全部题目</h3>
              <p className="text-xs text-blue-100 mt-0.5">共 {getQuestionsByCategoryId(selectedChapterId).length} 道题</p>
            </button>
          </div>
        </div>
      );
    }
  }

  if (studyQuestions.length === 0) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-gray-500">该分类暂无题目</p>
        <button onClick={handleBack} className="mt-4 text-blue-500 text-sm">返回选择</button>
      </div>
    );
  }

  const currentQ = studyQuestions[currentIndex];
  const isFavorite = progress.favoriteIds.includes(currentQ.id);
  const isConfused = confusedQuestions.includes(currentQ.id);

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* 顶部栏 */}
      <div className="flex items-center gap-3">
        <button onClick={handleBack} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / studyQuestions.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 dark:text-slate-400 min-w-[40px] text-right">{currentIndex + 1}/{studyQuestions.length}</span>
        <FavoriteButton questionId={currentQ.id} />
      </div>

      {/* 题目 + 不会按钮 */}
      <div className="relative">
        <QuestionCard question={currentQ} index={currentIndex} total={studyQuestions.length} />
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
          const isCorrect = answered && idx === currentQ.answer;
          const isWrong = answered && idx === selectedAnswer && idx !== currentQ.answer;

          return (
            <OptionButton
              key={idx}
              label={labels[idx]}
              text={opt}
              correct={isCorrect}
              wrong={isWrong}
              selected={selectedAnswer === idx && !answered}
              disabled={answered}
              onClick={() => handleSelect(idx)}
            />
          );
        })}
      </div>

      {/* 查看解析按钮 */}
      {!showExplanation && (
        <button
          onClick={handleShowExplanation}
          className="w-full min-h-[48px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
        >
          👀 查看解析
        </button>
      )}

      {/* 解析面板 */}
      {showExplanation && (
        <ExplanationPanel
          correct={selectedAnswer !== null && selectedAnswer === currentQ.answer}
          correctAnswer={`${labels[currentQ.answer]}. ${currentQ.options[currentQ.answer]}`}
          detailed={currentQ.explanation.detailed}
          knowledge={currentQ.explanation.knowledge}
          tips={currentQ.explanation.tips}
          mode="study"
        />
      )}

      {/* 导航按钮 */}
      <div className="flex gap-3">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`flex-1 min-h-[48px] rounded-xl font-semibold transition-colors ${
            currentIndex === 0
              ? 'bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-slate-600 cursor-not-allowed'
              : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-2 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          ← 上一题
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === studyQuestions.length - 1}
          className={`flex-1 min-h-[48px] rounded-xl font-semibold transition-colors ${
            currentIndex === studyQuestions.length - 1
              ? 'bg-gray-100 dark:bg-slate-800 text-gray-300 dark:text-slate-600 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          下一题 →
        </button>
      </div>

      {/* 完成提示 */}
      {currentIndex === studyQuestions.length - 1 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-slate-400">🎉 已到最后一题！</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">今日学习进度已更新</p>
        </div>
      )}
    </div>
  );
}
