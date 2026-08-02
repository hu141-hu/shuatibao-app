'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

const labels = ['A', 'B', 'C', 'D'];
const CATEGORIES = ['全部', '常识判断', '逻辑推理', '言语理解', '数量关系'];

export default function ConfusedPage() {
  const router = useRouter();
  const { confusedQuestions, allQuestions, removeConfusedQuestion } = useStore();
  const [selectedCategory, setSelectedCategory] = useState('全部');

  const confusedWithDetails = useMemo(() => {
    return confusedQuestions
      .map(id => allQuestions.find(q => q.id === id))
      .filter((q): q is NonNullable<typeof q> => q !== undefined);
  }, [confusedQuestions, allQuestions]);

  const filtered = useMemo(() => {
    if (selectedCategory === '全部') return confusedWithDetails;
    return confusedWithDetails.filter(q => q.category === selectedCategory);
  }, [confusedWithDetails, selectedCategory]);

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-200">🤔 不会的题</h1>
        <span className="text-sm text-amber-500 ml-auto">{confusedQuestions.length} 题</span>
      </div>

      {/* 分类筛选 */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[32px] ${
              selectedCategory === cat
                ? 'bg-amber-500 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">👏</p>
          <p className="text-sm text-gray-400">没有不会的题，太棒了！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => (
            <div key={q.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-amber-100 dark:border-amber-900/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-lg">{q.category}</span>
                <span className="text-xs text-gray-400">难度 {'★'.repeat(q.difficulty)}{'☆'.repeat(5 - q.difficulty)}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed line-clamp-2">{q.question}</p>
              <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                正确答案：{labels[q.answer]}. {q.options[q.answer]}
              </div>
              <button
                onClick={() => removeConfusedQuestion(q.id)}
                className="mt-3 w-full min-h-[40px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium text-sm rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                ✅ 已掌握，移出
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
