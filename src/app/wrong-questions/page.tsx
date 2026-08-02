'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Question } from '@/types';
import QuestionCard from '@/components/QuestionCard';
import OptionButton from '@/components/OptionButton';
import ExplanationPanel from '@/components/ExplanationPanel';

const labels = ['A', 'B', 'C', 'D'];
const CATEGORIES = ['全部', '常识判断', '逻辑推理', '言语理解', '数量关系'];

export default function WrongQuestionsPage() {
  const router = useRouter();
  const { wrongQuestions, allQuestions, removeWrongQuestion, retryWrongQuestion } = useStore();
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const wrongWithDetails = useMemo(() => {
    return wrongQuestions
      .map(w => {
        const q = allQuestions.find(aq => aq.id === w.questionId);
        return q ? { ...w, question: q } : null;
      })
      .filter((item): item is NonNullable<typeof item> & { question: Question } => item !== null);
  }, [wrongQuestions, allQuestions]);

  const filtered = useMemo(() => {
    if (selectedCategory === '全部') return wrongWithDetails;
    return wrongWithDetails.filter(w => w.question.category === selectedCategory);
  }, [wrongWithDetails, selectedCategory]);

  // 重做模式
  if (retryingId) {
    const item = wrongWithDetails.find(w => w.questionId === retryingId);
    if (!item) { setRetryingId(null); return null; }
    const q = item.question;

    const handleRetrySelect = (idx: number) => {
      if (showResult) return;
      setSelectedAnswer(idx);
      setShowResult(true);
      const isCorrect = idx === q.answer;
      retryWrongQuestion(q.id, isCorrect);
    };

    return (
      <div className="px-4 pt-6 pb-4 space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setRetryingId(null); setSelectedAnswer(null); setShowResult(false); }}
            className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-gray-800 dark:text-slate-200">重新作答</h2>
          <span className="text-xs text-red-400 ml-auto">已错 {item.wrongCount} 次</span>
        </div>

        <QuestionCard question={q} index={0} total={1} />

        <div className="space-y-2.5">
          {q.options.map((opt, idx) => (
            <OptionButton
              key={idx}
              label={labels[idx]}
              text={opt}
              correct={showResult && idx === q.answer}
              wrong={showResult && idx === selectedAnswer && idx !== q.answer}
              disabled={showResult}
              onClick={() => handleRetrySelect(idx)}
            />
          ))}
        </div>

        {showResult && (
          <ExplanationPanel
            correct={selectedAnswer === q.answer}
            correctAnswer={`${labels[q.answer]}. ${q.options[q.answer]}`}
            brief={q.explanation.brief}
            detailed={q.explanation.detailed}
            mode="quiz"
          />
        )}

        {showResult && (
          <button
            onClick={() => { setRetryingId(null); setSelectedAnswer(null); setShowResult(false); }}
            className="w-full min-h-[48px] bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
          >
            返回错题列表
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-200">📕 错题本</h1>
        <span className="text-sm text-red-400 ml-auto">{wrongQuestions.length} 题</span>
      </div>

      {/* 分类筛选 */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[32px] ${
              selectedCategory === cat
                ? 'bg-red-500 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-sm text-gray-400">暂无错题，继续保持！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const q = item.question;
            const timeAgo = getTimeAgo(item.lastWrongAt);
            return (
              <div key={q.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-red-100 dark:border-red-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 px-2 py-0.5 rounded-lg">{q.category}</span>
                  <span className="text-xs text-gray-400">错 {item.wrongCount} 次</span>
                  <span className="text-xs text-gray-300 ml-auto">{timeAgo}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed line-clamp-2">{q.question}</p>
                <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                  正确答案：{labels[q.answer]}. {q.options[q.answer]}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => { setRetryingId(q.id); setSelectedAnswer(null); setShowResult(false); }}
                    className="flex-1 min-h-[40px] bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium text-sm rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                  >
                    重新作答
                  </button>
                  <button
                    onClick={() => removeWrongQuestion(q.id)}
                    className="flex-1 min-h-[40px] bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-300 font-medium text-sm rounded-xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    已掌握，移出
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}
