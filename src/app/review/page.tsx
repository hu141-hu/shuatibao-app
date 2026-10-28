'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Question } from '@/types';
import QuestionCard from '@/components/QuestionCard';
import OptionButton from '@/components/OptionButton';
import ExplanationPanel from '@/components/ExplanationPanel';
import { useSwipeNav } from '@/lib/useSwipeNav';

import {
  OPTION_LABELS as labels,
  isMultiQuestion,
  checkAnswer,
  correctIndices,
  answerText,
} from '@/lib/answerUtils';

export default function ReviewPage() {
  const router = useRouter();
  const {
    wrongQuestions, confusedQuestions, allQuestions,
    addReviewRecord, retryWrongQuestion, removeWrongQuestion,
    removeConfusedQuestion,
  } = useStore();

  // 收集需要复习的题目：错题 + 不会的题（去重）
  const reviewPool = useMemo(() => {
    const wrongIds = wrongQuestions.map(w => w.questionId);
    const allIds = [...new Set([...wrongIds, ...confusedQuestions])];
    return allIds
      .map(id => allQuestions.find(q => q.id === id))
      .filter((q): q is Question => q !== undefined);
  }, [wrongQuestions, confusedQuestions, allQuestions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  // 多选题勾选项
  const [multiSelected, setMultiSelected] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  // 记录每题所选答案，用于滑动返回时恢复状态（滑动本身不显示答案）
  const [answerMap, setAnswerMap] = useState<Record<string, number>>({});

  // "已掌握"会同时移出错题和不会的题，复习池会变短；
  // 此时 currentIndex 可能已经越界，reviewPool[currentIndex] 为 undefined 会直接白屏
  const safeIndex = Math.min(currentIndex, Math.max(reviewPool.length - 1, 0));
  useEffect(() => {
    if (currentIndex !== safeIndex) setCurrentIndex(safeIndex);
  }, [currentIndex, safeIndex]);

  const handleSelect = useCallback((idx: number) => {
    const q = reviewPool[safeIndex];
    if (showResult || !q) return;

    // 多选题：先勾选，提交后判分
    if (isMultiQuestion(q)) {
      setMultiSelected(prev =>
        prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]
      );
      return;
    }

    setSelectedAnswer(idx);
    setShowResult(true);

    const isCorrect = idx === q.answer;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      // 错题答对：更新重试计数
      retryWrongQuestion(q.id, true);
    }
    setAnswerMap(prev => ({ ...prev, [q.id]: idx }));
    setReviewedIds(prev => (prev.includes(q.id) ? prev : [...prev, q.id]));
  }, [showResult, reviewPool, safeIndex, retryWrongQuestion]);

  // 提交多选题
  const handleSubmitMulti = useCallback(() => {
    const q = reviewPool[safeIndex];
    if (!q || showResult || multiSelected.length === 0) return;
    const isCorrect = checkAnswer(q, multiSelected);
    setShowResult(true);
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      retryWrongQuestion(q.id, true);
    }
    setAnswerMap(prev => ({ ...prev, [q.id]: multiSelected[0] }));
    setReviewedIds(prev => (prev.includes(q.id) ? prev : [...prev, q.id]));
  }, [showResult, reviewPool, safeIndex, multiSelected, retryWrongQuestion]);

  // 跳到指定题目：已作答的恢复状态，未作答保持未作答
  const goToQuestion = useCallback((nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= reviewPool.length) return;
    const target = reviewPool[nextIndex];
    const prevAnswer = answerMap[target.id];
    setCurrentIndex(nextIndex);
    if (prevAnswer !== undefined) {
      setSelectedAnswer(prevAnswer);
      setShowResult(true);
    } else {
      setSelectedAnswer(null);
      setShowResult(false);
    }
  }, [reviewPool, answerMap]);

  const handleNext = useCallback(() => {
    if (safeIndex < reviewPool.length - 1) {
      goToQuestion(safeIndex + 1);
    } else {
      // 完成复习
      const today = new Date().toISOString().split('T')[0];
      addReviewRecord({
        date: today,
        reviewedIds,
        totalCount: reviewedIds.length,
      });
      setCompleted(true);
    }
  }, [safeIndex, reviewPool.length, reviewedIds, addReviewRecord, goToQuestion]);

  const handleMastered = useCallback((questionId: string) => {
    removeWrongQuestion(questionId);
    removeConfusedQuestion(questionId);
  }, [removeWrongQuestion, removeConfusedQuestion]);

  // 滑动手势：中间区左滑下一题/右滑上一题；左边距区左滑返回；右边距区右滑无效
  const swipeRef = useSwipeNav<HTMLDivElement>({
    onNext: () => goToQuestion(safeIndex + 1),
    onPrev: () => goToQuestion(safeIndex - 1),
    onLeftEdgeBack: () => router.back(),
  });

  // 空状态
  if (reviewPool.length === 0) {
    return (
      <div className="px-4 pt-6 pb-4 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-slate-200">📅 每日复习</h1>
        </div>
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🎉</p>
          <p className="text-lg font-semibold text-gray-700 dark:text-slate-200">暂无需要复习的题目</p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">继续刷题，错题和不会的题会自动加入复习</p>
          <button
            onClick={() => router.push('/quiz')}
            className="mt-6 px-6 py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors"
          >
            去刷题 →
          </button>
        </div>
      </div>
    );
  }

  // 完成状态
  if (completed) {
    const accuracy = reviewedIds.length > 0
      ? Math.round((correctCount / reviewedIds.length) * 100)
      : 0;
    return (
      <div className="px-4 pt-6 pb-4 space-y-6">
        <div className="text-center py-10 space-y-4">
          <p className="text-5xl">🏆</p>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-200">复习完成！</h2>
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{reviewedIds.length}</p>
              <p className="text-xs text-gray-500">复习题数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{accuracy}%</p>
              <p className="text-xs text-gray-500">正确率</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{correctCount}</p>
              <p className="text-xs text-gray-500">答对</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full min-h-[48px] bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
          >
            返回首页
          </button>
          <button
            onClick={() => router.push('/quiz')}
            className="w-full min-h-[48px] bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold rounded-xl border-2 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            继续刷题
          </button>
        </div>
      </div>
    );
  }

  const currentQ = reviewPool[safeIndex];
  // 兜底：复习池已空或下标越界时不再白屏
  if (!currentQ) {
    return (
      <div className="px-4 pt-6 pb-4 text-center">
        <p className="text-gray-500">没有可复习的题目了</p>
        <button onClick={() => router.push('/')} className="mt-4 text-emerald-500 text-sm">返回首页</button>
      </div>
    );
  }
  const isWrong = wrongQuestions.some(w => w.questionId === currentQ.id);
  const isConfused = confusedQuestions.includes(currentQ.id);

  return (
    <div ref={swipeRef} className="px-4 pt-6 pb-4 space-y-4">
      {/* 顶部 */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-800 dark:text-slate-200">📅 每日复习</h1>
        <span className="text-xs text-gray-400 ml-auto">{safeIndex + 1}/{reviewPool.length}</span>
      </div>

      {/* 进度条 */}
      <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${((safeIndex + 1) / reviewPool.length) * 100}%` }}
        />
      </div>

      {/* 题目标签 */}
      <div className="flex gap-2">
        {isWrong && <span className="text-xs bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 px-2 py-0.5 rounded-lg">错题</span>}
        {isConfused && <span className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg">不会的题</span>}
      </div>

      {/* 题目 */}
      <QuestionCard question={currentQ} index={safeIndex} total={reviewPool.length} />

      {/* 选项 */}
      <div className="space-y-2.5">
        {currentQ.options.map((opt, idx) => {
          const isMulti = isMultiQuestion(currentQ);
          const correctSet = correctIndices(currentQ);
          const isCorrectOpt = correctSet.includes(idx);
          const picked = isMulti ? multiSelected.includes(idx) : idx === selectedAnswer;
          return (
            <OptionButton
              key={idx}
              label={labels[idx]}
              text={opt}
              correct={showResult && isCorrectOpt}
              wrong={showResult && !isMulti && idx === selectedAnswer && !isCorrectOpt}
              selected={!showResult && picked}
              disabled={showResult}
              onClick={() => handleSelect(idx)}
            />
          );
        })}
      </div>

      {/* 多选题提交 */}
      {isMultiQuestion(currentQ) && !showResult && (
        <button
          onClick={handleSubmitMulti}
          disabled={multiSelected.length === 0}
          className="w-full min-h-[48px] bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors shadow-md disabled:opacity-40"
        >
          提交答案（已选 {multiSelected.length} 项）
        </button>
      )}

      {/* 解析 */}
      {showResult && (
        <ExplanationPanel
          correct={isMultiQuestion(currentQ)
            ? checkAnswer(currentQ, multiSelected)
            : selectedAnswer === currentQ.answer}
          correctAnswer={answerText(currentQ)}
          brief={currentQ.explanation.brief}
          detailed={currentQ.explanation.detailed}
          mode="quiz"
        />
      )}

      {/* 操作按钮 */}
      {showResult && (
        <div className="space-y-2">
          <button
            onClick={() => handleMastered(currentQ.id)}
            className="w-full min-h-[44px] bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium text-sm rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
          >
            ✅ 已掌握，不再出现
          </button>
          <button
            onClick={handleNext}
            className="w-full min-h-[48px] bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
          >
            {safeIndex < reviewPool.length - 1 ? '下一题 →' : '完成复习 🎉'}
          </button>
        </div>
      )}
    </div>
  );
}
