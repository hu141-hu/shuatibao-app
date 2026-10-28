import { KnowledgePoint } from '@/types';
import { eduKnowledgePoints } from '@/data/eduKnowledge';

/**
 * 兼容层：旧版演示知识点（常识/逻辑/言语/数量）已清空，
 * 改为《3500题》上册每节一份考点清单（共 17 份）。
 */
export const builtinKnowledgePoints: KnowledgePoint[] = eduKnowledgePoints;

export const knowledgeCategories = ['教育学'] as const;

export function getKnowledgeById(id: string): KnowledgePoint | undefined {
  return builtinKnowledgePoints.find(kp => kp.id === id);
}

export function getKnowledgeByCategory(category: string): KnowledgePoint[] {
  return builtinKnowledgePoints.filter(kp => kp.category === category);
}
