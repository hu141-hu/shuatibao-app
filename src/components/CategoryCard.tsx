'use client';

interface CategoryCardProps {
  name: string;
  total: number;
  completed: number;
  icon: string;
  onClick?: () => void;
}

const iconMap: Record<string, string> = {
  '常识判断': '🌍',
  '逻辑推理': '🧩',
  '言语理解': '📝',
  '数量关系': '🔢',
};

export default function CategoryCard({ name, total, completed, icon, onClick }: CategoryCardProps) {
  const progress = total > 0 ? completed / total : 0;
  const emoji = icon || iconMap[name] || '📋';

  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all duration-200 text-left"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-slate-200 text-sm">{name}</h3>
            <span className="text-xs text-gray-400 dark:text-slate-500">{completed}/{total}</span>
          </div>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
