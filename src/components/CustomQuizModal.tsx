'use client';

import { useMemo, useState } from 'react';
import { Question } from '@/types';

export type QuizMode = 'practice' | 'recite';

interface CustomQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 候选题目（已按勾选的目录聚合，未做任何筛选） */
  questions: Question[];
  /** 已做过的题目 id */
  doneIds: string[];
  /** 做错过的题目 id */
  wrongIds: string[];
  onStart: (questions: Question[], mode: QuizMode) => void;
}

type CountOption = 10 | 20 | 30 | 50 | 'all';
type StatusOption = 'all' | 'unseen' | 'wrong';
type DifficultyOption = 'all' | 'easy' | 'hard';

const COUNTS: { value: CountOption; label: string }[] = [
  { value: 10, label: '10 题' },
  { value: 20, label: '20 题' },
  { value: 30, label: '30 题' },
  { value: 50, label: '50 题' },
  { value: 'all', label: '全部' },
];

const STATUSES: { value: StatusOption; label: string }[] = [
  { value: 'all', label: '全部题目' },
  { value: 'unseen', label: '只刷未做' },
  { value: 'wrong', label: '只刷错题' },
];

const DIFFICULTIES: { value: DifficultyOption; label: string }[] = [
  { value: 'all', label: '不限难度' },
  { value: 'easy', label: '基础（1-2）' },
  { value: 'hard', label: '进阶（4-5）' },
];

/** Fisher-Yates，避免 sort(random) 的分布偏倚 */
function shuffle<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function CustomQuizModal({
  isOpen,
  onClose,
  questions,
  doneIds,
  wrongIds,
  onStart,
}: CustomQuizModalProps) {
  const [count, setCount] = useState<CountOption>(20);
  const [status, setStatus] = useState<StatusOption>('all');
  const [difficulty, setDifficulty] = useState<DifficultyOption>('all');
  const [mode, setMode] = useState<QuizMode>('practice');
  const [randomOrder, setRandomOrder] = useState(true);

  const doneSet = useMemo(() => new Set(doneIds), [doneIds]);
  const wrongSet = useMemo(() => new Set(wrongIds), [wrongIds]);

  const pool = useMemo(() => {
    let list = questions;
    if (status === 'unseen') list = list.filter(q => !doneSet.has(q.id));
    if (status === 'wrong') list = list.filter(q => wrongSet.has(q.id));
    if (difficulty === 'easy') list = list.filter(q => q.difficulty <= 2);
    if (difficulty === 'hard') list = list.filter(q => q.difficulty >= 4);
    return randomOrder ? shuffle(list) : list;
  }, [questions, status, difficulty, randomOrder, doneSet, wrongSet]);

  const finalCount = count === 'all' ? pool.length : Math.min(count, pool.length);

  const handleStart = () => {
    if (finalCount === 0) return;
    onStart(pool.slice(0, finalCount), mode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-[480px] bg-white dark:bg-slate-800 rounded-t-3xl p-5 space-y-5 max-h-[88vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800 dark:text-slate-200">🎛 自定义刷题</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-slate-400">
          候选 {questions.length} 题 · 本次将出 <span className="font-semibold text-emerald-600 dark:text-emerald-400">{finalCount}</span> 题
        </p>

        {/* 题量 */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-slate-400">题量</p>
          <div className="flex flex-wrap gap-2">
            {COUNTS.map(opt => (
              <button
                key={String(opt.value)}
                onClick={() => setCount(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  count === opt.value
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 模式 */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-slate-400">模式</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode('practice')}
              className={`p-3 rounded-xl border text-left transition-colors ${
                mode === 'practice'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                  : 'border-gray-200 dark:border-slate-600'
              }`}
            >
              <span className="block text-sm font-medium text-gray-800 dark:text-slate-200">做题模式</span>
              <span className="block text-xs text-gray-500 dark:text-slate-400 mt-0.5">作答后看解析</span>
            </button>
            <button
              onClick={() => setMode('recite')}
              className={`p-3 rounded-xl border text-left transition-colors ${
                mode === 'recite'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-slate-600'
              }`}
            >
              <span className="block text-sm font-medium text-gray-800 dark:text-slate-200">背题模式</span>
              <span className="block text-xs text-gray-500 dark:text-slate-400 mt-0.5">直接看答案与解析</span>
            </button>
          </div>
        </div>

        {/* 范围 */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-slate-400">范围</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  status === opt.value
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 难度 */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-slate-400">难度</p>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDifficulty(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  difficulty === opt.value
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 顺序 */}
        <button
          onClick={() => setRandomOrder(v => !v)}
          className="w-full flex items-center justify-between py-2"
        >
          <span className="text-xs font-medium text-gray-600 dark:text-slate-400">随机顺序</span>
          <span className={`w-10 h-6 rounded-full transition-colors relative ${randomOrder ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${randomOrder ? 'left-[18px]' : 'left-0.5'}`} />
          </span>
        </button>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-slate-400 font-medium"
          >
            取消
          </button>
          <button
            onClick={handleStart}
            disabled={finalCount === 0}
            className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
          >
            开始刷题
          </button>
        </div>
      </div>
    </div>
  );
}
