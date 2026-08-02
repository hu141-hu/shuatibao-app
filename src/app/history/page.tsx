'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { getQuestionById } from '@/data/questions';
import StatsCharts from '@/components/StatsCharts';
import { PracticeRecord } from '@/types';

const categoryOptions = ['全部', '常识判断', '逻辑推理', '言语理解', '数量关系'] as const;
const timeRanges = [
  { label: '7天', days: 7 },
  { label: '30天', days: 30 },
  { label: '全部', days: 0 },
] as const;
const resultOptions = ['全部', '答对的', '答错的'] as const;

export default function HistoryPage() {
  const router = useRouter();
  const { practiceHistory } = useStore();
  const [timeRange, setTimeRange] = useState<number>(30);
  const [category, setCategory] = useState<string>('全部');
  const [resultFilter, setResultFilter] = useState<string>('全部');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    let records = practiceHistory;

    if (timeRange > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - timeRange);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      records = records.filter(r => r.date >= cutoffStr);
    }

    if (category !== '全部') {
      records = records.filter(r => r.category === category);
    }

    if (resultFilter === '答对的') {
      records = records.filter(r => r.isCorrect);
    } else if (resultFilter === '答错的') {
      records = records.filter(r => !r.isCorrect);
    }

    return records;
  }, [practiceHistory, timeRange, category, resultFilter]);

  // 按日期分组
  const groupedByDate = useMemo(() => {
    const map = new Map<string, PracticeRecord[]>();
    for (const r of filteredRecords) {
      const existing = map.get(r.date) || [];
      existing.push(r);
      map.set(r.date, existing);
    }
    // 按日期倒序
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredRecords]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}分${s}秒` : `${m}分`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return '今天';
    if (dateStr === yesterday) return '昨天';
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* 顶部标题 */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/profile')} className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-200">📊 刷题记录</h1>
      </div>

      {/* 统计图表 */}
      <StatsCharts records={practiceHistory} days={timeRange === 0 ? 30 : timeRange} />

      {/* 筛选器 */}
      <div className="space-y-2">
        {/* 时间范围 */}
        <div className="flex gap-2">
          {timeRanges.map(tr => (
            <button
              key={tr.days}
              onClick={() => setTimeRange(tr.days)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                timeRange === tr.days
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>

        {/* 分类 */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {categoryOptions.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 结果筛选 */}
        <div className="flex gap-2">
          {resultOptions.map(opt => (
            <button
              key={opt}
              onClick={() => setResultFilter(opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                resultFilter === opt
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* 总览统计 */}
      {filteredRecords.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-2.5 text-center shadow-sm border border-gray-100 dark:border-slate-700">
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{filteredRecords.length}</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400">总刷题</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-2.5 text-center shadow-sm border border-gray-100 dark:border-slate-700">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {filteredRecords.length > 0
                ? Math.round((filteredRecords.filter(r => r.isCorrect).length / filteredRecords.length) * 100)
                : 0}%
            </p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400">正确率</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-2.5 text-center shadow-sm border border-gray-100 dark:border-slate-700">
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatTime(filteredRecords.reduce((s, r) => s + r.timeSpent, 0))}</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400">总用时</p>
          </div>
        </div>
      )}

      {/* 时间线 */}
      <div className="space-y-0">
        {groupedByDate.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">暂无刷题记录</p>
          </div>
        ) : (
          groupedByDate.map(([date, records], idx) => {
            const correct = records.filter(r => r.isCorrect).length;
            const accuracy = Math.round((correct / records.length) * 100);
            const totalTime = records.reduce((s, r) => s + r.timeSpent, 0);
            const isExpanded = expandedDate === date;

            return (
              <div key={date} className="relative flex gap-3">
                {/* 时间线竖线 */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${idx === 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  {idx < groupedByDate.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                  )}
                </div>

                {/* 内容 */}
                <div className="flex-1 pb-4">
                  <button
                    onClick={() => setExpandedDate(isExpanded ? null : date)}
                    className="w-full bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-slate-700 text-left hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{formatDate(date)}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          {records.length}题 · 正确率{accuracy}% · {formatTime(totalTime)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${accuracy >= 80 ? 'text-emerald-600' : accuracy >= 60 ? 'text-blue-600' : 'text-red-500'}`}>
                          {correct}/{records.length}
                        </span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* 展开详细记录 */}
                  {isExpanded && (
                    <div className="mt-2 space-y-1.5">
                      {records.map((record) => {
                        const q = getQuestionById(record.questionId);
                        return (
                          <div
                            key={record.id}
                            className="bg-white dark:bg-slate-800 rounded-lg p-2.5 shadow-sm border border-gray-50 dark:border-slate-700 flex items-center gap-2"
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                              record.isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
                            }`}>
                              {record.isCorrect ? '✓' : '✗'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700 dark:text-slate-300 truncate">
                                {q ? q.question.slice(0, 30) : record.questionId}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {record.category} · {formatTime(record.timeSpent)} · {record.mode === 'quiz' ? '刷题' : record.mode === 'study' ? '学习' : '复习'}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-[10px] text-gray-500">
                                你选{record.userAnswer + 1} / 答案{record.correctAnswer + 1}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
