'use client';

import { useState } from 'react';
import { KnowledgePoint } from '@/types';
import { knowledgeCategories } from '@/data/knowledge';

interface AddKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (kp: KnowledgePoint) => void;
}

export default function AddKnowledgeModal({ isOpen, onClose, onAdd }: AddKnowledgeModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(knowledgeCategories[0]);
  const [content, setContent] = useState('');
  const [importance, setImportance] = useState(3);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    const kp: KnowledgePoint = {
      id: `kp-custom-${Date.now()}`,
      category,
      title: title.trim(),
      content: content.trim(),
      summary: content.trim().slice(0, 50) + (content.trim().length > 50 ? '...' : ''),
      relatedQuestionIds: [],
      importance,
      isCustom: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAdd(kp);
    setTitle('');
    setContent('');
    setCategory(knowledgeCategories[0]);
    setImportance(3);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-[480px] bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-t-3xl border-b border-gray-100 dark:border-slate-700 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-800 dark:text-slate-200">添加知识点</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入知识点标题"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">分类</label>
            <div className="flex gap-2 flex-wrap">
              {knowledgeCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    category === cat
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 重要程度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">重要程度</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setImportance(star)}
                  className={`text-2xl transition-colors ${
                    star <= importance ? 'text-amber-400' : 'text-gray-200'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* 内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">内容 *（支持 Markdown 格式）</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入知识点详细内容..."
              rows={10}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim()}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-colors ${
              title.trim() && content.trim()
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            添加知识点
          </button>
        </div>
      </div>
    </div>
  );
}
