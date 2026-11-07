import { CategoryHierarchy, PracticeRecord, Question } from '@/types';
import { getCategoryQuestions } from '@/lib/categoryUtils';

export interface QuizSelection {
  categoryId: string;
  categoryName: string;
  /** 用户为该章设定的抽题数 */
  requested: number;
}

export interface QuizPlanItem extends QuizSelection {
  /** 该章实际抽到的题数 */
  actual: number;
  /** 该章当前可用题数（未做，或全部） */
  available: number;
}

export interface QuizBuildResult {
  questions: Question[];
  plan: QuizPlanItem[];
  warnings: string[];
}

/** Fisher-Yates */
function shuffle<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 多章节按量抽题。
 *
 * 规则：
 * 1. 按 selections 顺序逐章抽；父章/子节同时选中时，后抽的章节会跳过已被抽走的题（先到先得去重）。
 * 2. 请求数 > 可用数时，抽满可用数并记一条 warning。
 * 3. 可用数为 0 时跳过该章并记一条 warning。
 * 4. 每章内部随机排序，章节之间按选择顺序拼接 → 答题卡天然按章节分组。
 * 5. includeDone=false 时只从未做过的题里抽（与现有"跳过已做"一致）。
 */
export function buildQuizByPlan(
  categories: CategoryHierarchy[],
  allQuestions: Question[],
  history: PracticeRecord[],
  selections: QuizSelection[],
  options: { includeDone?: boolean } = {}
): QuizBuildResult {
  const includeDone = options.includeDone ?? false;
  const doneSet = new Set(history.map(h => h.questionId));
  const used = new Set<string>();
  const questions: Question[] = [];
  const plan: QuizPlanItem[] = [];
  const warnings: string[] = [];

  for (const sel of selections) {
    const all = getCategoryQuestions(categories, allQuestions, sel.categoryId);
    const pool = (includeDone ? all : all.filter(q => !doneSet.has(q.id)))
      .filter(q => !used.has(q.id));

    const requested = Math.max(0, Math.floor(sel.requested) || 0);
    const actual = Math.min(requested, pool.length);

    if (all.length === 0) {
      warnings.push(`「${sel.categoryName}」没有题目，已跳过`);
      plan.push({ ...sel, requested, actual: 0, available: 0 });
      continue;
    }
    if (pool.length === 0) {
      warnings.push(`「${sel.categoryName}」${includeDone ? '没有题目' : '的题目已全部刷完'}，已跳过`);
      plan.push({ ...sel, requested, actual: 0, available: 0 });
      continue;
    }
    if (actual < requested) {
      warnings.push(`「${sel.categoryName}」可用 ${pool.length} 题，少于设定的 ${requested} 题`);
    }

    const picked = shuffle(pool).slice(0, actual);
    picked.forEach(q => used.add(q.id));
    questions.push(...picked);
    plan.push({ ...sel, requested, actual, available: pool.length });
  }

  return { questions, plan, warnings };
}

/** 未答完的出题答题卡存档 */
export interface SavedQuizPlan {
  plan: QuizPlanItem[];
  questionIds: string[];
  currentIndex: number;
  results: { questionId: string; selected: number; isCorrect: boolean }[];
  savedAt: number;
}

export function quizPlanStorageKey(userId: string): string {
  return `${userId}_quizPlanState`;
}

/** 按 id 还原题目，自动丢弃已被删除的题 */
export function restorePlanQuestions(ids: string[], allQuestions: Question[]): Question[] {
  const map = new Map(allQuestions.map(q => [q.id, q]));
  return ids.map(id => map.get(id)).filter((q): q is Question => Boolean(q));
}
