import { Question } from '@/types';
import { eduQuestions } from '@/data/eduQuestions';

/**
 * 兼容层：早期版本内置的常识判断/逻辑推理/言语理解/数量关系演示题库已清空，
 * 统一改为《3500题》上册教育学题库（1083 题：单选 650 / 多选 237 / 判断 196）。
 * 保留原有导出名，避免各页面引用大面积改动。
 */
export const questions: Question[] = eduQuestions;

export const categories = ['教育学'] as const;

export function getQuestionsByCategory(category: string): Question[] {
  return questions.filter(q => q.category === category);
}

export function getQuestionById(id: string): Question | undefined {
  return questions.find(q => q.id === id);
}

export function getRandomQuestions(category: string, count: number): Question[] {
  const filtered = getQuestionsByCategory(category);
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
