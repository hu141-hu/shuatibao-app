import { CategoryHierarchy, PracticeRecord, Question } from '@/types';

/**
 * 目录树工具：所有层级（章 / 节 / 知识点）统一按 parentId 递归处理。
 * 原来的实现只聚合一层子级，加了知识点层级后会漏题。
 */

/** 某个目录及其全部后代的 id 集合 */
export function collectCategoryIds(categories: CategoryHierarchy[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of categories) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        changed = true;
      }
    }
  }
  return ids;
}

/** 直接子级（按 order 排序） */
export function getChildren(categories: CategoryHierarchy[], parentId: string): CategoryHierarchy[] {
  return categories
    .filter(c => c.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

/** Fisher-Yates 洗牌：比 sort(() => Math.random()-0.5) 分布均匀 */
export function shuffleQuestions<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 目录路径（从根到当前，用于面包屑） */
export function getCategoryPath(categories: CategoryHierarchy[], id: string): CategoryHierarchy[] {
  const path: CategoryHierarchy[] = [];
  const seen = new Set<string>();
  let current = categories.find(c => c.id === id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current);
    current = current.parentId ? categories.find(c => c.id === current!.parentId) : undefined;
  }
  return path;
}

/** 聚合目录及其所有后代的题目（顶级目录直接刷题 = 递归全部后代） */
export function getCategoryQuestions(
  categories: CategoryHierarchy[],
  questions: Question[],
  categoryId: string
): Question[] {
  if (!categories.some(c => c.id === categoryId)) return [];
  const ids = collectCategoryIds(categories, categoryId);
  const questionIds = new Set<string>();
  for (const c of categories) {
    if (!ids.has(c.id)) continue;
    for (const qid of c.questionIds) questionIds.add(qid);
  }
  return questions.filter(q => questionIds.has(q.id));
}

export interface CategoryStats {
  total: number;
  done: number;
  correct: number;
  accuracy: number;
}

/**
 * 目录级统计：按练习记录取每道题的最后一次作答，
 * 避免同一题刷多次把做题量累加（粉笔的"已做/总量"也是按题去重）。
 */
export function getCategoryStats(
  categories: CategoryHierarchy[],
  questions: Question[],
  history: PracticeRecord[],
  categoryId: string
): CategoryStats {
  const qs = getCategoryQuestions(categories, questions, categoryId);
  if (qs.length === 0) return { total: 0, done: 0, correct: 0, accuracy: 0 };

  const idSet = new Set(qs.map(q => q.id));
  const lastResult = new Map<string, boolean>();
  for (const h of history) {
    if (idSet.has(h.questionId)) lastResult.set(h.questionId, h.isCorrect);
  }

  let correct = 0;
  lastResult.forEach(isCorrect => { if (isCorrect) correct += 1; });
  const done = lastResult.size;

  return {
    total: qs.length,
    done,
    correct,
    accuracy: done > 0 ? Math.round((correct / done) * 100) : 0,
  };
}

/** 掌握度 0-5：按已做覆盖率分档（0 题时不显示） */
export function getMasteryLevel(stats: CategoryStats): number {
  if (stats.total === 0 || stats.done === 0) return 0;
  return Math.min(5, Math.max(1, Math.ceil((stats.done / stats.total) * 5)));
}
