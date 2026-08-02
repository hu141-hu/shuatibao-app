'use client';

import { Question } from '@/types';

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
}

export default function QuestionCard({ question, index, total }: QuestionCardProps) {
  const stars = Array.from({ length: 5 }, (_, i) => i < question.difficulty ? '★' : '☆').join('');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors duration-300">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
          第 {index + 1}/{total} 题
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-amber-500">{stars}</span>
          <span className="text-xs text-gray-400 dark:text-slate-500 ml-1">{question.category || '未分类'}</span>
        </div>
      </div>
      <h2 className="text-base font-medium text-gray-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
        {question.question}
      </h2>
    </div>
  );
}
