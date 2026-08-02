'use client';

import { useMemo } from 'react';
import { PracticeRecord } from '@/types';

interface StatsChartsProps {
  records: PracticeRecord[];
  days?: number;
}

const categoryColors: Record<string, string> = {
  '常识判断': '#3B82F6',
  '逻辑推理': '#8B5CF6',
  '言语理解': '#22C55E',
  '数量关系': '#F97316',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function StatsCharts({ records, days = 7 }: StatsChartsProps) {
  const lastDays = useMemo(() => getLastNDays(days), [days]);

  // 每日刷题数和正确率
  const dailyStats = useMemo(() => {
    const stats: { date: string; count: number; correct: number }[] = [];
    for (const day of lastDays) {
      const dayRecords = records.filter(r => r.date === day);
      stats.push({
        date: day,
        count: dayRecords.length,
        correct: dayRecords.filter(r => r.isCorrect).length,
      });
    }
    return stats;
  }, [records, lastDays]);

  // 分类分布
  const categoryStats = useMemo(() => {
    const filtered = records.filter(r => lastDays.includes(r.date));
    const map: Record<string, number> = {};
    for (const r of filtered) {
      map[r.category] = (map[r.category] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [records, lastDays]);

  const maxCount = Math.max(...dailyStats.map(d => d.count), 1);
  const barWidth = 100 / days;

  // SVG bar chart
  const barChartHeight = 120;
  const barChartSvg = useMemo(() => {
    const padding = { top: 10, bottom: 20, left: 0, right: 0 };
    const chartH = barChartHeight - padding.top - padding.bottom;
    return dailyStats.map((stat, i) => {
      const x = (i / dailyStats.length) * 100 + (100 / dailyStats.length) * 0.2;
      const w = (100 / dailyStats.length) * 0.6;
      const h = stat.count > 0 ? (stat.count / maxCount) * chartH : 0;
      const y = padding.top + chartH - h;
      return { x, w, h, y, count: stat.count, date: stat.date };
    });
  }, [dailyStats, maxCount]);

  // SVG polyline for accuracy
  const accuracyPoints = useMemo(() => {
    return dailyStats.map((stat, i) => {
      const x = (i / Math.max(dailyStats.length - 1, 1)) * 100;
      const acc = stat.count > 0 ? (stat.correct / stat.count) * 100 : 0;
      const y = 100 - acc;
      return { x, y, acc, date: stat.date, count: stat.count };
    });
  }, [dailyStats]);

  const polylineStr = accuracyPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Pie chart data
  const totalCategory = categoryStats.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-4">
      {/* 刷题趋势图 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">📊 刷题趋势（近{days}天）</h3>
        <div className="relative" style={{ height: barChartHeight }}>
          <svg viewBox={`0 0 100 ${barChartHeight}`} preserveAspectRatio="none" className="w-full h-full">
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map(pct => (
              <line
                key={pct}
                x1="0" y1={10 + (barChartHeight - 30) * (1 - pct)}
                x2="100" y2={10 + (barChartHeight - 30) * (1 - pct)}
                stroke="#f3f4f6" className="dark:stroke-slate-700" strokeWidth="0.3"
              />
            ))}
            {/* Bars */}
            {barChartSvg.map((bar, i) => (
              <g key={i}>
                <rect
                  x={`${bar.x}%`}
                  y={bar.y}
                  width={`${bar.w}%`}
                  height={Math.max(bar.h, 0.5)}
                  rx="1"
                  fill="#10B981"
                  opacity={bar.count > 0 ? 0.8 : 0.1}
                />
                {bar.count > 0 && (
                  <text
                    x={`${bar.x + bar.w / 2}%`}
                    y={bar.y - 2}
                    textAnchor="middle"
                    fontSize="3"
                    fill="#6b7280" className="dark:fill-slate-400"
                  >
                    {bar.count}
                  </text>
                )}
              </g>
            ))}
            {/* Date labels */}
            {barChartSvg.filter((_, i) => i % Math.ceil(days / 7) === 0 || i === barChartSvg.length - 1).map((bar, i) => (
              <text
                key={`label-${i}`}
                x={`${bar.x + bar.w / 2}%`}
                y={barChartHeight - 3}
                textAnchor="middle"
                fontSize="3"
                fill="#9ca3af" className="dark:fill-slate-500"
              >
                {formatDate(bar.date)}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* 正确率趋势 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">📈 正确率趋势</h3>
        <div className="relative" style={{ height: 100 }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            {/* Grid */}
            {[25, 50, 75, 100].map(v => (
              <line key={v} x1="0" y1={100 - v} x2="100" y2={100 - v} stroke="#f3f4f6" className="dark:stroke-slate-700" strokeWidth="0.3" />
            ))}
            {/* Area fill */}
            <polygon
              points={`0,100 ${polylineStr} 100,100`}
              fill="url(#accGrad)"
              opacity="0.15"
            />
            <defs>
              <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Line */}
            {dailyStats.some(d => d.count > 0) && (
              <polyline
                points={polylineStr}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {/* Points */}
            {accuracyPoints.filter(p => p.count > 0).map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="2" fill="#3B82F6" />
            ))}
          </svg>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[8px] text-gray-400 dark:text-slate-500 pointer-events-none">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>
        </div>
      </div>

      {/* 分类分布饼图 */}
      {categoryStats.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">🎯 分类分布</h3>
          <div className="flex items-center gap-4">
            <div
              className="w-24 h-24 rounded-full flex-shrink-0 dark:ring-1 dark:ring-slate-600"
              style={{
                background: totalCategory > 0
                  ? `conic-gradient(${(() => {
                      let offset = 0;
                      return categoryStats.map(c => {
                        const start = (offset / totalCategory) * 360;
                        offset += c.value;
                        const end = (offset / totalCategory) * 360;
                        return `${categoryColors[c.name] || '#94a3b8'} ${start}deg ${end}deg`;
                      }).join(', ');
                    })()})`
                  : '#f3f4f6'
              }}
            />
            <div className="flex-1 space-y-1.5">
              {categoryStats.map(c => (
                <div key={c.name} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: categoryColors[c.name] || '#94a3b8' }}
                  />
                  <span className="text-xs text-gray-600 dark:text-slate-400 flex-1">{c.name}</span>
                  <span className="text-xs font-medium text-gray-800 dark:text-slate-200">{c.value}题</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">{totalCategory > 0 ? Math.round((c.value / totalCategory) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 无数据提示 */}
      {records.length === 0 && (
        <div className="text-center py-6">
          <p className="text-gray-400 dark:text-slate-500 text-sm">暂无刷题记录，开始刷题后将在这里显示统计图表</p>
        </div>
      )}
    </div>
  );
}
