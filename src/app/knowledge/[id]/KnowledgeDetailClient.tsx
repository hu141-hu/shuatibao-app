'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { getQuestionById } from '@/data/questions';

const categoryColors: Record<string, { bg: string; text: string }> = {
  '常识判断': { bg: 'bg-blue-50', text: 'text-blue-600' },
  '逻辑推理': { bg: 'bg-purple-50', text: 'text-purple-600' },
  '言语理解': { bg: 'bg-green-50', text: 'text-green-600' },
  '数量关系': { bg: 'bg-orange-50', text: 'text-orange-600' },
};

function renderMarkdown(text: string): string {
  let html = text
    // h2
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-gray-800 mt-4 mb-2">$1</h2>')
    // h3
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-gray-700 mt-3 mb-1.5">$1</h3>')
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
    // unordered list items
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm text-gray-600 leading-relaxed list-disc">$1</li>')
    // ordered list items
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-sm text-gray-600 leading-relaxed list-decimal">$1</li>')
    // table rows (basic)
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(Boolean).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) return '';
      const isHeader = cells.some(c => c.includes('朝代') || c.includes('成语'));
      const tag = isHeader ? 'th' : 'td';
      const cls = isHeader ? 'px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 text-left' : 'px-3 py-1.5 text-xs text-gray-600 border-t border-gray-100';
      return `<tr>${cells.map(c => `<${tag} class="${cls}">${c}</${tag}>`).join('')}</tr>`;
    })
    // paragraphs
    .replace(/\n\n/g, '</p><p class="text-sm text-gray-600 leading-relaxed mt-2">')
    // line breaks
    .replace(/\n/g, '<br/>');
  
  // Wrap tables
  html = html.replace(/(<tr>.*?<\/tr>(\s*<br\/>)?)+/g, (match) => {
    const cleaned = match.replace(/<br\/>/g, '');
    return `<div class="overflow-x-auto my-2"><table class="w-full border-collapse border border-gray-200 rounded-lg">${cleaned}</table></div>`;
  });

  return html;
}

export default function KnowledgeDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { allKnowledgePoints, knowledgeFavorites, toggleKnowledgeFavorite, removeCustomKnowledge } = useStore();

  const knowledge = useMemo(
    () => allKnowledgePoints.find(kp => kp.id === id),
    [allKnowledgePoints, id]
  );

  const isFavorite = knowledgeFavorites.includes(id);

  const relatedQuestions = useMemo(() => {
    if (!knowledge) return [];
    return knowledge.relatedQuestionIds
      .map(qid => getQuestionById(qid))
      .filter(Boolean);
  }, [knowledge]);

  const handleDelete = () => {
    if (knowledge && knowledge.isCustom) {
      if (confirm(`确定删除知识点"${knowledge.title}"吗？`)) {
        removeCustomKnowledge(knowledge.id);
        router.push('/knowledge');
      }
    }
  };

  if (!knowledge) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-gray-500">知识点不存在</p>
        <button
          onClick={() => router.push('/knowledge')}
          className="mt-4 text-sm text-emerald-600 hover:underline"
        >
          返回知识点库
        </button>
      </div>
    );
  }

  const colors = categoryColors[knowledge.category] || categoryColors['常识判断'];

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/knowledge')} className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-800 dark:text-slate-200 flex-1 truncate">知识点详情</h1>
        <button
          onClick={() => toggleKnowledgeFavorite(knowledge.id)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <svg className={`w-6 h-6 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-300'}`} viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        </button>
      </div>

      {/* 知识点卡片 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-start gap-2">
            <h2 className="text-base font-bold text-gray-800 dark:text-slate-200 flex-1">{knowledge.title}</h2>
            {knowledge.isCustom && (
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-medium flex-shrink-0">
                自定义
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium`}>
              {knowledge.category}
            </span>
            <div className="text-sm flex items-center gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={i < knowledge.importance ? (knowledge.importance >= 4 ? 'text-amber-400' : 'text-gray-400') : 'text-gray-200'}>
                  ★
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">{knowledge.summary}</p>
        </div>

        {/* 内容 */}
        <div
          className="p-4 prose-sm"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(knowledge.content) }}
        />
      </div>

      {/* 关联题目 */}
      {relatedQuestions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 px-1">📝 关联题目</h3>
          <div className="space-y-2">
            {relatedQuestions.map((q) => {
              if (!q) return null;
              return (
                <button
                  key={q.id}
                  onClick={() => router.push(`/study?category=${encodeURIComponent(q.category)}`)}
                  className="w-full bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-slate-700 text-left hover:shadow-md transition-all card-hover"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-700 dark:text-slate-300 line-clamp-2 flex-1">{q.question}</p>
                    <span className="text-emerald-500 text-xs flex-shrink-0">去做 →</span>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">{q.category} · 难度 {q.difficulty}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
        {knowledge.isCustom && (
          <>
            <button
              onClick={() => router.push('/knowledge')}
              className="flex-1 min-h-[48px] bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              编辑
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 min-h-[48px] bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
            >
              删除
            </button>
          </>
        )}
        <button
          onClick={() => toggleKnowledgeFavorite(knowledge.id)}
          className={`flex-1 min-h-[48px] font-semibold rounded-xl transition-colors ${
            isFavorite
              ? 'bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          {isFavorite ? '取消收藏' : '❤️ 收藏'}
        </button>
      </div>
    </div>
  );
}
