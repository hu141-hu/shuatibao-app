'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { knowledgeCategories } from '@/data/knowledge';
import AddKnowledgeModal from '@/components/AddKnowledgeModal';
import { KnowledgePoint } from '@/types';

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  '常识判断': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  '逻辑推理': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  '言语理解': { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  '数量关系': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
};

const categoryBarColors: Record<string, string> = {
  '常识判断': 'bg-blue-500',
  '逻辑推理': 'bg-purple-500',
  '言语理解': 'bg-green-500',
  '数量关系': 'bg-orange-500',
};

export default function KnowledgePage() {
  const router = useRouter();
  const { allKnowledgePoints, knowledgeFavorites } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('全部');
  const [showAddModal, setShowAddModal] = useState(false);
  const { addCustomKnowledge } = useStore();

  const filteredPoints = useMemo(() => {
    let result = allKnowledgePoints;
    if (activeCategory !== '全部') {
      result = result.filter(kp => kp.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(kp =>
        kp.title.toLowerCase().includes(q) ||
        kp.summary.toLowerCase().includes(q) ||
        kp.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allKnowledgePoints, activeCategory, searchQuery]);

  const renderStars = (importance: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < importance ? (importance >= 4 ? 'text-amber-400' : 'text-gray-400') : 'text-gray-200'}>
        ★
      </span>
    ));
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-200">📚 知识点库</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
        >
          + 添加
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索知识点..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* 分类标签栏 */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {['全部', ...knowledgeCategories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 统计信息 */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>共 {filteredPoints.length} 个知识点</span>
        <span>·</span>
        <span>已收藏 {knowledgeFavorites.length} 个</span>
      </div>

      {/* 知识点卡片列表 */}
      <div className="space-y-3">
        {filteredPoints.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">暂无匹配的知识点</p>
          </div>
        ) : (
          filteredPoints.map((kp) => {
            const colors = categoryColors[kp.category] || categoryColors['常识判断'];
            const barColor = categoryBarColors[kp.category] || 'bg-blue-500';
            const isFav = knowledgeFavorites.includes(kp.id);

            return (
              <button
                key={kp.id}
                onClick={() => router.push(`/knowledge/${kp.id}`)}
                className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all text-left overflow-hidden flex card-hover"
              >
                {/* 左侧分类色条 */}
                <div className={`w-1 ${barColor} flex-shrink-0`} />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 dark:text-slate-200 text-sm leading-tight">
                        {kp.title}
                        {kp.isCustom && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-medium">
                            自定义
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">{kp.summary}</p>
                    </div>
                    {isFav && (
                      <span className="text-red-400 flex-shrink-0 text-sm">❤️</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} ${colors.border} border font-medium`}>
                      {kp.category}
                    </span>
                    <div className="text-xs flex items-center gap-0.5">
                      {renderStars(kp.importance)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* 添加知识点弹窗 */}
      <AddKnowledgeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addCustomKnowledge}
      />
    </div>
  );
}
