'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { getCategoryQuestions } from '@/lib/categoryUtils';

interface CategoryQuestionPickerProps {
  isOpen: boolean;
  categoryId: string;
  categoryName: string;
  onClose: () => void;
}

/**
 * 把题目批量归入指定目录。
 * 只做"移入"：已在本目录的题目不展示，避免误把已有题目移出。
 */
export default function CategoryQuestionPicker({ isOpen, categoryId, categoryName, onClose }: CategoryQuestionPickerProps) {
  const { allQuestions, categoryHierarchy, moveQuestionsToCategory } = useStore();
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const inCategory = useMemo(() => {
    return new Set(getCategoryQuestions(categoryHierarchy, allQuestions, categoryId).map(q => q.id));
  }, [categoryHierarchy, allQuestions, categoryId]);

  const candidates = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return allQuestions
      .filter(q => !inCategory.has(q.id))
      .filter(q => !kw || q.question.toLowerCase().includes(kw) || q.category.toLowerCase().includes(kw))
      .slice(0, 200);
  }, [allQuestions, inCategory, keyword]);

  const toggle = (id: string) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;
    moveQuestionsToCategory(selected, categoryId);
    setSelected([]);
    setKeyword('');
    onClose();
  };

  const handleClose = () => {
    setSelected([]);
    setKeyword('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-800 dark:text-slate-200">添加题目到目录</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">{categoryName}</p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索题干或分类..."
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
        />

        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[120px]">
          {candidates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">没有可添加的题目</p>
          ) : (
            candidates.map(q => {
              const checked = selected.includes(q.id);
              return (
                <button
                  key={q.id}
                  onClick={() => toggle(q.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${
                    checked ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                    checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-slate-500'
                  }`}>
                    {checked && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-gray-700 dark:text-slate-300 line-clamp-2">{q.question}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">{q.category}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-slate-400 font-medium"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected.length === 0}
            className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
          >
            移入 {selected.length > 0 ? `(${selected.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
