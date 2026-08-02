'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { categories } from '@/data/questions';
import FavoriteButton from '@/components/FavoriteButton';

export default function FavoritesPage() {
  const router = useRouter();
  const { progress, allQuestions, toggleFavorite } = useStore();
  const [activeCategory, setActiveCategory] = useState<string>('全部');

  const favoriteQuestions = useMemo(() => {
    return allQuestions.filter(q => progress.favoriteIds.includes(q.id));
  }, [allQuestions, progress.favoriteIds]);

  const filteredQuestions = useMemo(() => {
    if (activeCategory === '全部') return favoriteQuestions;
    return favoriteQuestions.filter(q => q.category === activeCategory);
  }, [favoriteQuestions, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { '全部': favoriteQuestions.length };
    favoriteQuestions.forEach(q => {
      counts[q.category] = (counts[q.category] || 0) + 1;
    });
    return counts;
  }, [favoriteQuestions]);

  const difficultyStars = (d: number) => '⭐'.repeat(d) + '☆'.repeat(5 - d);

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* 顶部标题栏 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-200">⭐ 我的收藏</h1>
        <span className="text-sm text-gray-400">({favoriteQuestions.length})</span>
      </div>

      {/* 分类筛选标签 */}
      {favoriteQuestions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {['全部', ...categories].map(cat => {
            const count = categoryCounts[cat] || 0;
            if (cat !== '全部' && count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-yellow-400 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-yellow-300 dark:hover:border-yellow-600'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* 空状态 */}
      {favoriteQuestions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">⭐</div>
          <p className="text-gray-400 text-sm">暂无收藏</p>
          <p className="text-gray-300 text-xs mt-2">
            去刷题时点击 ⭐ 收藏感兴趣的题目吧
          </p>
          <button
            onClick={() => router.push('/quiz')}
            className="mt-6 px-6 py-2.5 bg-yellow-400 text-white text-sm font-medium rounded-full hover:bg-yellow-500 transition-colors shadow-sm"
          >
            去刷题 →
          </button>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">该分类暂无收藏题目</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredQuestions.map(q => (
            <div
              key={q.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0" onClick={() => router.push(`/study?category=${encodeURIComponent(q.category)}&questionId=${q.id}`)}>
                  <p className="text-sm text-gray-800 dark:text-slate-200 font-medium leading-relaxed line-clamp-2">
                    {q.question}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-full">
                      {q.category}
                    </span>
                    <span className="text-xs text-yellow-500">{difficultyStars(q.difficulty)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <FavoriteButton questionId={q.id} size="sm" />
                  <button
                    onClick={() => {
                      if (confirm('确定取消收藏？')) toggleFavorite(q.id);
                    }}
                    className="text-xs text-gray-300 hover:text-red-400 transition-colors px-2 py-1"
                  >
                    移除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
