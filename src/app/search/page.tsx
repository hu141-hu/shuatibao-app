'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { categories } from '@/data/questions';
import { Question } from '@/types';

const HISTORY_KEY = 'search_history';
const MAX_HISTORY = 5;

function loadHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(h: string[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch {}
}

function highlightText(text: string, keyword: string) {
  if (!keyword.trim()) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase()
      ? `<mark style="background:#FEF08A;padding:0 1px;border-radius:2px;">${part}</mark>`
      : part
  ).join('');
}

interface SearchResult {
  question: Question;
  matchLocations: string[];
}

export default function SearchPage() {
  const router = useRouter();
  const { allQuestions } = useStore();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHistory(loadHistory());
    inputRef.current?.focus();
  }, []);

  // 防抖
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const addToHistory = useCallback((keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    setHistory(prev => {
      const next = [trimmed, ...prev.filter(h => h !== trimmed)].slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q && !activeCategory) return [];

    let filtered = allQuestions;
    if (activeCategory) {
      filtered = filtered.filter(item => item.category === activeCategory);
    }
    if (!q) {
      return filtered.map(item => ({ question: item, matchLocations: ['分类'] }));
    }

    return filtered.reduce<SearchResult[]>((acc, item) => {
      const locations: string[] = [];

      if (item.question.toLowerCase().includes(q)) locations.push('题目');
      if (item.options.some(opt => opt.toLowerCase().includes(q))) locations.push('选项');
      const expFields = [
        item.explanation.brief,
        item.explanation.detailed,
        item.explanation.knowledge,
        item.explanation.tips,
      ];
      if (expFields.some(f => f.toLowerCase().includes(q))) locations.push('解析');

      if (locations.length > 0) {
        acc.push({ question: item, matchLocations: locations });
      }
      return acc;
    }, []);
  }, [debouncedQuery, activeCategory, allQuestions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      addToHistory(query);
    }
  };

  const handleHistoryClick = (keyword: string) => {
    setQuery(keyword);
    addToHistory(keyword);
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(activeCategory === cat ? null : cat);
  };

  const difficultyStars = (d: number) => '⭐'.repeat(d) + '☆'.repeat(5 - d);

  const showHistory = !query && !activeCategory;

  return (
    <div className="px-4 pt-4 pb-4 space-y-4 min-h-screen">
      {/* 搜索栏 */}
      <div className="sticky top-0 z-10 bg-[#F0FDF4] dark:bg-[#0F172A] pt-2 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索题目、选项、解析..."
              className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 shadow-sm"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setDebouncedQuery(''); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs hover:bg-gray-300"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* 热门分类快捷标签 */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索历史 */}
      {showHistory && history.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-medium text-gray-500">搜索历史</h3>
            <button
              onClick={clearHistory}
              className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              清空
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => handleHistoryClick(h)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-xs text-gray-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {(debouncedQuery || activeCategory) && (
        <div className="space-y-2.5">
          {results.length > 0 && (
            <p className="text-xs text-gray-400 px-1">
              找到 {results.length} 个结果
              {activeCategory && ` · ${activeCategory}`}
            </p>
          )}
          {results.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-400 text-sm">
                {activeCategory && !debouncedQuery
                  ? `${activeCategory} 分类暂无更多题目`
                  : '未找到相关题目，换个关键词试试'}
              </p>
            </div>
          ) : (
            results.map(({ question: q, matchLocations }) => (
              <div
                key={q.id}
                onClick={() => router.push(`/study?category=${encodeURIComponent(q.category)}&questionId=${q.id}`)}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer"
              >
                <p
                  className="text-sm text-gray-800 dark:text-slate-200 font-medium leading-relaxed line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: highlightText(q.question, debouncedQuery) }}
                />
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-full">
                    {q.category}
                  </span>
                  <span className="text-xs text-yellow-500">{difficultyStars(q.difficulty)}</span>
                  <div className="flex gap-1 ml-auto">
                    {matchLocations.map(loc => (
                      <span key={loc} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 text-[10px] rounded">
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
                {/* 选项预览（高亮） */}
                <div className="mt-2 space-y-1">
                  {q.options.slice(0, 2).map((opt, idx) => (
                    <p
                      key={idx}
                      className="text-xs text-gray-500 line-clamp-1"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(`${String.fromCharCode(65 + idx)}. ${opt}`, debouncedQuery)
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 初始状态提示 */}
      {showHistory && history.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-gray-400 text-sm">输入关键词搜索题目</p>
          <p className="text-gray-300 text-xs mt-1">支持搜索题目内容、选项和解析</p>
        </div>
      )}
    </div>
  );
}
