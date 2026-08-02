'use client';

interface ExplanationPanelProps {
  correct: boolean;
  correctAnswer: string;
  brief?: string;
  detailed?: string;
  knowledge?: string;
  tips?: string;
  mode?: 'quiz' | 'study';
}

export default function ExplanationPanel({
  correct,
  correctAnswer,
  brief,
  detailed,
  knowledge,
  tips,
  mode = 'quiz',
}: ExplanationPanelProps) {
  return (
    <div className="mt-4 space-y-3 animate-in fade-in duration-300">
      {/* 结果提示 */}
      <div className={`p-3 rounded-xl ${correct ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'}`}>
        <div className="flex items-center gap-2">
          <span className={`text-lg ${correct ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {correct ? '✓' : '✗'}
          </span>
          <span className={`font-semibold text-sm ${correct ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
            {correct ? '回答正确！' : '回答错误'}
          </span>
        </div>
        {!correct && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">正确答案：{correctAnswer}</p>
        )}
      </div>

      {/* 简要解析（刷题模式） */}
      {mode === 'quiz' && brief && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">💡 解析</p>
          <p className="text-sm text-blue-800 dark:text-blue-200">{brief}</p>
        </div>
      )}

      {/* 详细解析（学习模式） */}
      {mode === 'study' && (
        <>
          {detailed && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">📖 解题思路</p>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{detailed}</p>
            </div>
          )}

          {knowledge && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl border border-amber-100 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">📚 知识点扩展</p>
              <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{knowledge}</p>
            </div>
          )}

          {tips && (
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-100 dark:border-purple-800">
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">⚠️ 易错点提醒</p>
              <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">{tips}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
