'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

const PRESET_AVATARS = [
  { id: 'fox', emoji: '🦊', label: '小狐狸' },
  { id: 'cat', emoji: '🐱', label: '小猫咪' },
  { id: 'dog', emoji: '🐶', label: '小狗狗' },
  { id: 'rabbit', emoji: '🐰', label: '小兔子' },
  { id: 'panda', emoji: '🐼', label: '小熊猫' },
  { id: 'koala', emoji: '🐨', label: '小考拉' },
  { id: 'tiger', emoji: '🐯', label: '小老虎' },
  { id: 'penguin', emoji: '🐧', label: '小企鹅' },
];

export default function AccountPage() {
  const router = useRouter();
  const { currentUser, accounts, createAccount, switchAccount } = useStore();
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('fox');
  const [error, setError] = useState('');

  // 已有账号列表时显示切换界面
  if (currentUser) {
    return (
      <div className="px-4 pt-6 pb-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl mb-2">
            {PRESET_AVATARS.find(a => a.id === currentUser.avatar)?.emoji || '🦊'}
          </div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-slate-200">当前账号</h1>
          <p className="text-gray-500 dark:text-slate-400">{currentUser.nickname}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full min-h-[48px] bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
          >
            返回首页
          </button>
          <button
            onClick={() => router.push('/account/manage')}
            className="w-full min-h-[48px] bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold rounded-xl border-2 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            管理账号
          </button>
        </div>

        {accounts.length > 1 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400">切换到其他账号</h3>
            {accounts.filter(a => a.id !== currentUser.id).map(acct => (
              <button
                key={acct.id}
                onClick={() => { switchAccount(acct.id); router.push('/'); }}
                className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-3 hover:shadow-md transition-all card-hover"
              >
                <span className="text-3xl">{PRESET_AVATARS.find(a => a.id === acct.avatar)?.emoji || '🦊'}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{acct.nickname}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const handleCreate = () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('请输入昵称');
      return;
    }
    if (trimmed.length > 12) {
      setError('昵称不能超过12个字');
      return;
    }
    createAccount(trimmed, selectedAvatar);
    router.push('/');
  };

  return (
    <div className="px-4 pt-8 pb-4 space-y-8">
      {/* 标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-200">创建账号</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">开始你的刷题之旅吧</p>
      </div>

      {/* 头像选择 */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-600 dark:text-slate-400 block">选择头像</label>
        <div className="grid grid-cols-4 gap-3">
          {PRESET_AVATARS.map(av => (
            <button
              key={av.id}
              onClick={() => setSelectedAvatar(av.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all min-h-[72px] ${
                selectedAvatar === av.id
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-500 shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600'
              }`}
            >
              <span className="text-3xl">{av.emoji}</span>
              <span className="text-xs text-gray-500 dark:text-slate-400">{av.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 昵称输入 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-600 dark:text-slate-400 block">昵称</label>
        <input
          type="text"
          value={nickname}
          onChange={e => { setNickname(e.target.value); setError(''); }}
          placeholder="输入你的昵称（最多12字）"
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-transparent dark:bg-slate-900 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
          maxLength={12}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {/* 创建按钮 */}
      <button
        onClick={handleCreate}
        className="w-full min-h-[52px] bg-emerald-500 text-white font-bold text-base rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200"
      >
        开始刷题 🚀
      </button>

      {/* 已有账号切换 */}
      {accounts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 text-center">或切换到已有账号</h3>
          {accounts.map(acct => (
            <button
              key={acct.id}
              onClick={() => { switchAccount(acct.id); router.push('/'); }}
              className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-3 hover:shadow-md transition-all card-hover"
            >
              <span className="text-3xl">{PRESET_AVATARS.find(a => a.id === acct.avatar)?.emoji || '🦊'}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{acct.nickname}</span>
              <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
