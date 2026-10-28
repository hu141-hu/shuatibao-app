import { Question } from '@/types';

/** 选项字母 */
export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/** 是否多选题 */
export function isMultiQuestion(q: Question): boolean {
  return q.type === 'multi' || (Array.isArray(q.answers) && q.answers.length > 1);
}

/** 是否判断题 */
export function isJudgeQuestion(q: Question): boolean {
  return q.type === 'judge';
}

/** 全部正确选项下标（升序） */
export function correctIndices(q: Question): number[] {
  if (Array.isArray(q.answers) && q.answers.length) {
    return [...q.answers].sort((a, b) => a - b);
  }
  return [q.answer];
}

/**
 * 判分：单选/判断比对单个下标；多选要求选出的集合与正确答案完全一致
 * （少选、多选、错选均判错，与粉笔等题库一致）
 */
export function checkAnswer(q: Question, selected: number[]): boolean {
  const chosen = [...new Set(selected)].sort((a, b) => a - b);
  if (!chosen.length) return false;
  const correct = correctIndices(q);
  if (correct.length === 1) return chosen.length === 1 && chosen[0] === correct[0];
  return correct.length === chosen.length && correct.every((v, i) => v === chosen[i]);
}

/** 正确答案字母，如 "ACD" */
export function answerLetters(q: Question): string {
  return correctIndices(q).map((i) => OPTION_LABELS[i] ?? '?').join('');
}

/** 正确答案文字，如 "A. 甲｜C. 丙" */
export function answerText(q: Question): string {
  return correctIndices(q)
    .map((i) => `${OPTION_LABELS[i] ?? '?'}. ${q.options[i] ?? ''}`)
    .join('｜');
}

/** 用户所选文字，如 "A. 甲｜C. 丙" */
export function selectedText(q: Question, selected: number[]): string {
  if (!selected.length) return '未作答';
  return selected
    .map((i) => `${OPTION_LABELS[i] ?? '?'}. ${q.options[i] ?? ''}`)
    .join('｜');
}

/** 题型中文名 */
export function questionTypeLabel(q: Question): string {
  if (isJudgeQuestion(q)) return '判断题';
  if (isMultiQuestion(q)) return '多选题';
  return '单选题';
}
