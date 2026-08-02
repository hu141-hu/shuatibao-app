'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { loadUserProgress } from '@/lib/store';

const PRESET_AVATARS: Record<string, string> = {
  fox: '🦊', cat: '🐱', dog: '🐶', rabbit: '🐰',
  panda: '🐼', koala: '🐨', tiger: '🐯', penguin: '🐧',
};

const GRADIENTS = [
  'from-emerald-400 to-teal-500',
  'from-blue-400 to-indigo-500',
  'from-purple-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-red-500',
  'from-cyan-400 to-blue-500',
];

function getGradient(index: number) {
  return GRADIENTS[index % GRADIENTS.length];
}

export default function ManageAccountsPage() {
  const router = useRouter();
  const { currentUser, accounts, switchAccount, deleteAccount } = useStore();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);

  const handleSwitch = (userId: string) => {
    setSwitching(userId);
    setTimeout(() => {
      switchAccount(userId);
      setSwitching(null);
      router.push('/');
    }, 400);
  };

  const handleDelete = (userId: string) => {
    deleteAccount(userId);
    setConfirmDelete(null);
    if (accounts.length <= 1) {
      router.push('/account');
    }
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* 顶部 */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-200">账号管理</h1>
      </div>

      {/* 账号列表 */}
      <div className="space-y-3">
        {accounts.map((acct, idx) => {
          const isCurrent = currentUser?.id === acct.id;
          const isSwitching = switching === acct.id;
          const progress = loadUserProgress(acct.id);
          const accuracy = progress.totalCount > 0
            ? Math.round((progress.totalCorrect / progress.totalCount) * 100)
            : 0;

          return (
            <div
              key={acct.id}
              className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                isSwitching ? 'scale-95 opacity-70' : ''
              } ${isCurrent ? 'ring-2 ring-emerald-500 shadow-lg' : 'shadow-sm'}`}
            >
              {/* 渐变背景 */}
              <div className={`bg-gradient-to-r ${getGradient(idx)} p-4`}>
                <div className="flex items-center gap-4">
                  {/* 头像 */}
                  <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-3xl shadow-inner">
                    {PRESET_AVATARS[acct.avatar] || '🦊'}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 text-white">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{acct.nickname}</h3>
                      {isCurrent && (
                        <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full backdrop-blur-sm">当前</span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-1 text-sm text-white/80">
                      <span>刷题 {progress.totalCount}</span>
                      <span>正确率 {accuracy}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 操作区 */}
              <div className="bg-white dark:bg-slate-800 p-3 flex gap-2">
                {!isCurrent && (
                  <button
                    onClick={() => handleSwitch(acct.id)}
                    className="flex-1 min-h-[44px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium text-sm rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                  >
                    切换到此账号
                  </button>
                )}
                {isCurrent && (
                  <div className="flex-1 min-h-[44px] flex items-center justify-center text-sm text-gray-400 dark:text-slate-500">
                    正在使用中
                  </div>
                )}
                <button
                  onClick={() => setConfirmDelete(acct.id)}
                  className="w-[44px] h-[44px] flex items-center justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 dark:text-slate-500 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* 删除确认弹窗 */}
              {confirmDelete === acct.id && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-10">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 w-full max-w-[280px] space-y-4 shadow-xl animate-fade-in">
                    <h3 className="font-bold text-gray-800 dark:text-slate-200 text-center">确认删除？</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 text-center">
                      删除「{acct.nickname}」后，该账号的所有刷题数据将永久丢失。
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="flex-1 min-h-[44px] bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 font-medium text-sm rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleDelete(acct.id)}
                        className="flex-1 min-h-[44px] bg-red-500 text-white font-medium text-sm rounded-xl hover:bg-red-600 transition-colors"
                      >
                        确认删除
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 添加新账号 */}
      <button
        onClick={() => router.push('/account')}
        className="w-full min-h-[52px] bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 text-gray-500 dark:text-slate-400 font-medium text-sm hover:border-emerald-400 hover:text-emerald-600 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        添加新账号
      </button>
    </div>
  );
}
