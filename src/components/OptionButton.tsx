'use client';

interface OptionButtonProps {
  label: string;
  text: string;
  selected?: boolean;
  correct?: boolean;
  wrong?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export default function OptionButton({ label, text, selected, correct, wrong, disabled, onClick }: OptionButtonProps) {
  let bgClass = 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 active:bg-gray-50 dark:active:bg-slate-700';
  if (correct) bgClass = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-400';
  else if (wrong) bgClass = 'bg-red-50 dark:bg-red-900/30 border-red-500 dark:border-red-400';
  else if (selected) bgClass = 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full min-h-[52px] flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 ${bgClass} ${
        disabled ? 'cursor-default' : 'cursor-pointer hover:shadow-md'
      }`}
    >
      <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        correct ? 'bg-emerald-500 text-white' :
        wrong ? 'bg-red-500 text-white' :
        selected ? 'bg-blue-500 text-white' :
        'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
      }`}>
        {correct ? '✓' : wrong ? '✗' : label}
      </span>
      <span className={`text-sm ${correct ? 'text-emerald-700 dark:text-emerald-300' : wrong ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-slate-200'}`}>
        {text}
      </span>
    </button>
  );
}
