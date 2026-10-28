'use client';

interface AnswerSheetProps {
  isOpen: boolean;
  questionIds: string[];
  currentIndex: number;
  results: { questionId: string; selected: number; isCorrect: boolean }[];
  onJump: (index: number) => void;
  onClose: () => void;
}

/**
 * 答题卡：题号网格，区分「当前 / 答对 / 答错 / 未答」，点击跳题。
 * 对应粉笔答题页的答题卡入口。
 */
export default function AnswerSheet({
  isOpen,
  questionIds,
  currentIndex,
  results,
  onJump,
  onClose,
}: AnswerSheetProps) {
  if (!isOpen) return null;

  const resultMap = new Map(results.map(r => [r.questionId, r]));
  const answered = results.length;
  const correct = results.filter(r => r.isCorrect).length;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-[480px] bg-white dark:bg-slate-800 rounded-t-3xl p-5 space-y-4 max-h-[80vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800 dark:text-slate-200">答题卡</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-4 text-xs text-gray-500 dark:text-slate-400">
          <span>已答 {answered}/{questionIds.length}</span>
          <span className="text-emerald-600 dark:text-emerald-400">答对 {correct}</span>
          <span className="text-red-500 dark:text-red-400">答错 {answered - correct}</span>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {questionIds.map((qid, idx) => {
            const r = resultMap.get(qid);
            const isCurrent = idx === currentIndex;
            const cls = r
              ? r.isCorrect
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-red-500 text-white border-red-500'
              : 'bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-300 border-gray-200 dark:border-slate-600';
            return (
              <button
                key={qid}
                onClick={() => { onJump(idx); onClose(); }}
                className={`h-10 rounded-lg border text-sm font-medium transition-all ${cls} ${
                  isCurrent ? 'ring-2 ring-offset-1 ring-emerald-400 dark:ring-offset-slate-800' : ''
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 text-[11px] text-gray-400 dark:text-slate-500 pt-1">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" />答对</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" />答错</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 dark:bg-slate-600" />未答</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded ring-2 ring-emerald-400" />当前</span>
        </div>
      </div>
    </div>
  );
}
