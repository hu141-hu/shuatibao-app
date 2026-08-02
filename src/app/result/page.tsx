'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-6 text-center text-gray-500">加载中...</div>}>
      <ResultContent />
    </Suspense>
  );
}

function ResultContent() {
  const searchParams = useSearchParams();
  const [shareState, setShareState] = useState<'idle' | 'done' | 'error'>('idle');

  const total = parseInt(searchParams.get('total') || '0');
  const correct = parseInt(searchParams.get('correct') || '0');
  const wrong = parseInt(searchParams.get('wrong') || '0');
  const unanswered = parseInt(searchParams.get('unanswered') || '0');
  const timeSpent = parseInt(searchParams.get('time') || '0');
  const category = searchParams.get('category') || '';

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;

  const getMessage = () => {
    if (accuracy >= 90) return { text: '太棒了！优秀！🏆', color: 'text-emerald-600' };
    if (accuracy >= 70) return { text: '不错，继续加油！💪', color: 'text-blue-600' };
    if (accuracy >= 50) return { text: '还需努力哦！📚', color: 'text-amber-600' };
    return { text: '别灰心，再来一次！🔥', color: 'text-red-600' };
  };

  const msg = getMessage();

  const timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;

  // 分享成绩（原生分享，不支持时复制到剪贴板）
  const handleShare = useCallback(async () => {
    const text = `【刷题宝】本次成绩：答对 ${correct}/${total}（正确率 ${accuracy}%），用时 ${timeText}${category ? `，分类：${category}` : ''}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: '我的刷题成绩', text });
        setShareState('done');
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShareState('done');
      } else {
        setShareState('error');
      }
    } catch {
      // 用户取消分享，不做处理
    }
  }, [correct, total, accuracy, timeText, category]);

  return (
    <div className="px-4 pt-8 pb-4 space-y-6">
      {/* 正确率大圆圈 */}
      <div className="text-center">
        <div className="relative inline-flex items-center justify-center">
          <svg width={160} height={160} className="-rotate-90">
            <circle cx={80} cy={80} r={70} className="stroke-gray-200 dark:stroke-slate-700" strokeWidth={10} fill="none" />
            <circle
              cx={80} cy={80} r={70}
              stroke={accuracy >= 70 ? '#10B981' : accuracy >= 50 ? '#F59E0B' : '#EF4444'}
              strokeWidth={10}
              fill="none"
              strokeDasharray={2 * Math.PI * 70}
              strokeDashoffset={2 * Math.PI * 70 * (1 - accuracy / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-gray-800 dark:text-slate-200">{accuracy}%</span>
            <span className="text-xs text-gray-500 dark:text-slate-400">正确率</span>
          </div>
        </div>
        <p className={`mt-3 text-lg font-semibold ${msg.color}`}>{msg.text}</p>
        {category && (
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">分类：{category}</p>
        )}
      </div>

      {/* 用时 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 text-center">
        <p className="text-sm text-gray-500 dark:text-slate-400">答题用时</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-slate-200 mt-1">
          {timeText}
        </p>
        {shareState === 'done' && (
          <p className="text-xs text-emerald-500 mt-1">✅ 已复制到剪贴板，去粘贴分享吧</p>
        )}
      </div>

      {/* 统计数据 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl p-4 text-center border border-emerald-100 dark:border-emerald-800">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{correct}</p>
          <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-0.5">答对</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 rounded-2xl p-4 text-center border border-red-100 dark:border-red-800">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{wrong}</p>
          <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">答错</p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 text-center border border-gray-200 dark:border-slate-700">
          <p className="text-2xl font-bold text-gray-600 dark:text-slate-300">{unanswered}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">未答</p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="space-y-3">
        <Link
          href={`/quiz${category ? `?category=${encodeURIComponent(category)}` : ''}`}
          className="block w-full min-h-[52px] bg-emerald-500 text-white font-semibold rounded-xl text-center leading-[52px] hover:bg-emerald-600 transition-colors shadow-md"
        >
          🔄 再来一轮
        </Link>

        <button
          onClick={handleShare}
          className="block w-full min-h-[52px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold rounded-xl text-center leading-[52px] border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
        >
          📤 分享成绩
        </button>

        <Link
          href="/wrong-questions"
          className="block w-full min-h-[52px] bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 font-semibold rounded-xl text-center leading-[52px] border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        >
          📕 查看错题
        </Link>

        <Link
          href="/"
          className="block w-full min-h-[52px] bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-semibold rounded-xl text-center leading-[52px] hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
        >
          🏠 返回首页
        </Link>
      </div>
    </div>
  );
}
