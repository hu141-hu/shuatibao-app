'use client';

import { useMemo, useState } from 'react';
import type { QuizMode } from '@/components/CustomQuizModal';
import { allocateByRatio } from '@/lib/allocate';

export interface BuilderSelection {
  id: string;
  name: string;
  /** 当前可用题数（未做） */
  available: number;
  /** 全部题数（含已做） */
  availableAll: number;
  level: 'chapter' | 'section' | 'knowledge';
}

interface QuizBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selections: BuilderSelection[];
  onStart: (items: { categoryId: string; count: number }[], mode: QuizMode, includeDone: boolean) => void;
}

export default function QuizBuilderModal({ isOpen, onClose, selections, onStart }: QuizBuilderModalProps) {
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    selections.forEach(s => { init[s.id] = Math.min(10, s.available); });
    return init;
  });
  const [mode, setMode] = useState<QuizMode>('practice');
  const [includeDone, setIncludeDone] = useState(false);
  // 分配方式：手动逐章设题量 / 按各章题量比例自动分配
  const [allocateMode, setAllocateMode] = useState<'manual' | 'ratio'>('manual');
  const [ratioTotal, setRatioTotal] = useState<number>(() => {
    const cap = selections.reduce((sum, s) => sum + s.available, 0);
    return Math.min(50, cap);
  });

  const capOf = (s: BuilderSelection) => (includeDone ? s.availableAll : s.available);
  const totalAvailable = selections.reduce((sum, s) => sum + capOf(s), 0);

  const ratioAlloc = useMemo(
    () => allocateByRatio(selections.map(s => capOf(s)), ratioTotal),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- capOf 只依赖 includeDone
    [selections, includeDone, ratioTotal]
  );

  const planned = useMemo(
    () => (allocateMode === 'ratio'
      ? ratioAlloc.reduce((sum, n) => sum + n, 0)
      : selections.reduce((sum, s) => sum + Math.min(counts[s.id] ?? 0, capOf(s)), 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- capOf 只依赖 includeDone
    [allocateMode, ratioAlloc, selections, counts, includeDone]
  );

  const setCount = (id: string, value: number, max: number) => {
    setCounts(prev => ({ ...prev, [id]: Math.max(0, Math.min(value, Math.max(max, 0))) }));
  };
  // 手输允许超过可用数，由“超额按可用数计”的规则兜底
  const setCountRaw = (id: string, value: number) => {
    setCounts(prev => ({ ...prev, [id]: Math.max(0, Math.min(Math.floor(value) || 0, 999)) }));
  };

  const toggleIncludeDone = () => {
    const next = !includeDone;
    setIncludeDone(next);
    setCounts(prev => {
      const updated = { ...prev };
      selections.forEach(s => {
        const cap = next ? s.availableAll : s.available;
        updated[s.id] = Math.min(updated[s.id] ?? 0, cap);
      });
      return updated;
    });
  };

  const handleStart = () => {
    const items = selections
      .map((s, idx) => ({
        categoryId: s.id,
        count: allocateMode === 'ratio'
          ? ratioAlloc[idx] ?? 0
          : Math.min(counts[s.id] ?? 0, capOf(s)),
      }))
      .filter(i => i.count > 0);
    if (items.length === 0) return;
    onStart(items, mode, includeDone);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-[480px] bg-white dark:bg-slate-800 rounded-t-3xl p-5 space-y-4 max-h-[88vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-800 dark:text-slate-200">🧩 组一张答题卡</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              已选 {selections.length} 个目录 · 可用 {totalAvailable} 题
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 分配方式 */}
        <div className="shrink-0 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setAllocateMode('manual')}
              className={`py-2 rounded-xl border text-xs font-medium ${allocateMode === 'manual' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300'}`}
            >
              按章手动
            </button>
            <button
              onClick={() => setAllocateMode('ratio')}
              className={`py-2 rounded-xl border text-xs font-medium ${allocateMode === 'ratio' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300'}`}
            >
              按题量占比
            </button>
          </div>

          {allocateMode === 'ratio' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-slate-400 shrink-0">总题量</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={totalAvailable}
                value={ratioTotal}
                onChange={(e) => {
                  const v = Math.floor(Number(e.target.value)) || 0;
                  setRatioTotal(Math.max(0, Math.min(v, Math.max(totalAvailable, 0))));
                }}
                className="w-16 h-8 text-center rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-1.5 ml-auto">
                {[20, 50, 100].map(n => (
                  <button
                    key={n}
                    onClick={() => setRatioTotal(Math.min(n, totalAvailable))}
                    className="px-2 py-1 rounded-lg text-[11px] text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setRatioTotal(totalAvailable)}
                  className="px-2 py-1 rounded-lg text-[11px] text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700"
                >
                  全部
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 每章题量 */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-[120px]">
          {selections.map((s, idx) => {
            const cap = capOf(s);
            const auto = ratioAlloc[idx] ?? 0;
            const count = allocateMode === 'ratio' ? auto : (counts[s.id] ?? 0);
            const empty = cap === 0;
            const over = allocateMode === 'manual' && count > cap;
            const locked = allocateMode === 'ratio';
            return (
              <div
                key={s.id}
                className={`rounded-xl p-3 border ${empty ? 'border-gray-100 dark:border-slate-700 opacity-60' : 'border-gray-200 dark:border-slate-600'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 dark:text-slate-200 truncate">{s.name}</p>
                    <p className={`text-xs mt-0.5 ${empty ? 'text-red-500' : 'text-gray-400'}`}>
                      {empty
                        ? '暂无可用题目'
                        : locked
                          ? `可用 ${cap} 题 · 按比例分到 ${auto} 题`
                          : `可用 ${cap} 题`}
                      {over && !empty && <span className="text-amber-500 ml-1">（超出，按 {cap} 计）</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setCount(s.id, count - 1, cap)}
                      disabled={empty || locked || count <= 0}
                      className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 disabled:opacity-40"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={cap}
                      value={count}
                      disabled={empty || locked}
                      onChange={(e) => setCountRaw(s.id, Number(e.target.value))}
                      className="w-12 h-8 text-center rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                    />
                    <button
                      onClick={() => setCount(s.id, count + 1, cap)}
                      disabled={empty || locked || count >= cap}
                      className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 模式与选项 */}
        <div className="shrink-0 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode('practice')}
              className={`py-2 rounded-xl border text-xs font-medium ${mode === 'practice' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300'}`}
            >
              做题模式
            </button>
            <button
              onClick={() => setMode('recite')}
              className={`py-2 rounded-xl border text-xs font-medium ${mode === 'recite' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300'}`}
            >
              背题模式
            </button>
          </div>

          <button onClick={toggleIncludeDone} className="w-full flex items-center justify-between py-1">
            <span className="text-xs text-gray-500 dark:text-slate-400">包含已刷过的题（全量抽题）</span>
            <span className={`w-10 h-6 rounded-full relative transition-colors ${includeDone ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${includeDone ? 'left-[18px]' : 'left-0.5'}`} />
            </span>
          </button>

          <button
            onClick={handleStart}
            disabled={planned === 0}
            className="w-full py-3.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50"
          >
            生成答题卡 · {planned} 题
          </button>
          <p className="text-[11px] text-gray-400 text-center">
            按章节顺序排列，章内随机；同名题目只出一次
          </p>
        </div>
      </div>
    </div>
  );
}
