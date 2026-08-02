'use client';

import { useState, useEffect } from 'react';
import { discussions as initialDiscussions, publicNotes } from '@/data/community';
import { Discussion } from '@/types';

const STORAGE_KEY = 'quiz-app-discussions';

function loadDiscussions(): Discussion[] {
  if (typeof window === 'undefined') return initialDiscussions;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const userDiscussions = JSON.parse(stored) as Discussion[];
      return [...userDiscussions, ...initialDiscussions];
    }
  } catch {}
  return initialDiscussions;
}

function saveDiscussions(discussions: Discussion[]) {
  if (typeof window === 'undefined') return;
  const userOnly = discussions.filter(d => !initialDiscussions.find(id => id.id === d.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly));
}

export default function CommunityPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>(initialDiscussions);
  const [showInput, setShowInput] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [activeTab, setActiveTab] = useState<'discussions' | 'notes'>('discussions');

  useEffect(() => {
    setDiscussions(loadDiscussions());
  }, []);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const newDiscussion: Discussion = {
      id: `d-user-${Date.now()}`,
      title: newTitle,
      content: newContent || '（无内容）',
      author: '我',
      replies: [],
      likes: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newDiscussion, ...discussions];
    setDiscussions(updated);
    saveDiscussions(updated);
    setNewTitle('');
    setNewContent('');
    setShowInput(false);
  };

  const handleLike = (id: string) => {
    const updated = discussions.map(d =>
      d.id === id ? { ...d, likes: d.likes + 1 } : d
    );
    setDiscussions(updated);
    saveDiscussions(updated);
  };

  // 讨论详情
  if (selectedDiscussion) {
    return (
      <div className="px-4 pt-6 pb-4 space-y-4">
        <button onClick={() => setSelectedDiscussion(null)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 min-h-[44px]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          <span className="text-sm">返回</span>
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="font-bold text-gray-800 dark:text-slate-200 text-lg">{selectedDiscussion.title}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-400">{selectedDiscussion.author}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">{selectedDiscussion.createdAt}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-slate-300 mt-3 leading-relaxed">{selectedDiscussion.content}</p>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
            <span className="text-xs text-gray-400">👍 {selectedDiscussion.likes}</span>
            <span className="text-xs text-gray-400">💬 {selectedDiscussion.replies.length} 回复</span>
          </div>
        </div>

        {/* 回复列表 */}
        <h3 className="font-semibold text-gray-800 dark:text-slate-200 text-sm">回复 ({selectedDiscussion.replies.length})</h3>
        {selectedDiscussion.replies.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">暂无回复，来抢沙发吧！</p>
        ) : (
          <div className="space-y-2.5">
            {selectedDiscussion.replies.map((reply) => (
              <div key={reply.id} className="bg-white dark:bg-slate-800 rounded-xl p-3.5 shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-medium text-emerald-600">{reply.author}</span>
                  <span className="text-xs text-gray-300">{reply.createdAt}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-300">{reply.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800 dark:text-slate-200">🏫 社区</h1>

      {/* Tab 切换 */}
      <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('discussions')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'discussions' ? 'bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 shadow-sm' : 'text-gray-500 dark:text-slate-400'
          }`}
        >
          问题广场
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'notes' ? 'bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 shadow-sm' : 'text-gray-500 dark:text-slate-400'
          }`}
        >
          精选笔记
        </button>
      </div>

      {/* 讨论列表 */}
      {activeTab === 'discussions' && (
        <div className="space-y-2.5">
          {discussions.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDiscussion(d)}
              className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all text-left card-hover"
            >
              <h3 className="font-semibold text-gray-800 dark:text-slate-200 text-sm">{d.title}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 line-clamp-2">{d.content}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-xs text-gray-400">{d.author}</span>
                <span className="text-xs text-gray-400">💬 {d.replies.length}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleLike(d.id); }}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  👍 {d.likes}
                </button>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 精选笔记 */}
      {activeTab === 'notes' && (
        <div className="space-y-2.5">
          {publicNotes.map((note) => (
            <div key={note.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg">{note.author}</span>
                <span className="text-xs text-gray-400">{note.createdAt}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{note.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* 发起讨论 */}
      {activeTab === 'discussions' && (
        <>
          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className="w-full min-h-[48px] bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors shadow-md"
            >
              ✏️ 发起讨论
            </button>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="讨论标题"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent dark:bg-slate-900 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="说点什么..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent dark:bg-slate-900 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowInput(false)}
                  className="flex-1 min-h-[44px] rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-sm font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 min-h-[44px] rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600"
                >
                  发布
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
