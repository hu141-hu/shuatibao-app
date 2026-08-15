'use client';

import { useState, useEffect } from 'react';
import { discussions as initialDiscussions, publicNotes } from '@/data/community';
import { Discussion } from '@/types';
import { shizhengItems, ShizhengItem } from '@/data/shizheng';
import { aiShizheng, isAiConfigured } from '@/lib/aiClient';

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

function groupShizheng(items: ShizhengItem[]) {
  const byYear = new Map<number, Map<string, ShizhengItem[]>>();
  const sorted = [...items].sort((a, b) => b.year - a.year || a.date.localeCompare(b.date));
  for (const it of sorted) {
    if (!byYear.has(it.year)) byYear.set(it.year, new Map());
    const ym = byYear.get(it.year)!;
    if (!ym.has(it.category)) ym.set(it.category, []);
    ym.get(it.category)!.push(it);
  }
  return byYear;
}

export default function CommunityPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>(initialDiscussions);
  const [showInput, setShowInput] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [activeTab, setActiveTab] = useState<'discussions' | 'notes' | 'shizheng'>('discussions');
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

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

  const handleAiShizheng = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const content = await aiShizheng();
      setAiSummary(content);
    } catch (e) {
      setAiError(String((e && (e as Error).message) || e));
    } finally {
      setAiLoading(false);
    }
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
        <button
          onClick={() => setActiveTab('shizheng')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'shizheng' ? 'bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 shadow-sm' : 'text-gray-500 dark:text-slate-400'
          }`}
        >
          时政
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

      {/* 时政总结 */}
      {activeTab === 'shizheng' && (
        <div className="space-y-4">
          {isAiConfigured() && (
            <button
              onClick={handleAiShizheng}
              disabled={aiLoading}
              className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-semibold hover:from-indigo-600 hover:to-blue-600 transition-colors shadow-md disabled:opacity-60"
            >
              {aiLoading ? 'AI 正在总结…' : '✨ AI 重新总结（在线）'}
            </button>
          )}
          {aiError && <p className="text-xs text-red-500">{aiError}</p>}
          {aiSummary && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
              <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{aiSummary}</p>
            </div>
          )}
          {aiSummary && <div className="text-center text-xs text-gray-400">— 本地内置精华 —</div>}

          {shizhengItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">时政精华整理中，敬请期待。</p>
          ) : (
            [...groupShizheng(shizhengItems).entries()].map(([year, catMap]) => (
              <div key={year}>
                <h2 className="text-base font-bold text-gray-800 dark:text-slate-200 mb-2">{year} 年</h2>
                {[...catMap.entries()].map(([category, items]) => (
                  <div key={category} className="mb-3">
                    <h3 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5">{category}</h3>
                    <div className="space-y-2">
                      {items.map((it, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-slate-700">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-gray-400 shrink-0">{it.date}</span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">{it.title}</span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 leading-relaxed">{it.detail}</p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">🎯 {it.examPoint}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
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
