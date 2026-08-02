export interface Question {
  id: string;
  category: string;
  difficulty: number;
  question: string;
  options: string[];
  answer: number;
  explanation: {
    brief: string;
    detailed: string;
    knowledge: string;
    tips: string;
  };
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  author: string;
  replies: Reply[];
  likes: number;
  createdAt: string;
}

export interface Reply {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface Note {
  id: string;
  questionId: string;
  content: string;
  author: string;
  isPublic: boolean;
  createdAt: string;
}

export interface UserProgress {
  dailyGoal: number;
  todayCount: number;
  todayCorrect: number;
  totalCount: number;
  totalCorrect: number;
  streak: number;
  lastStudyDate: string;
  wrongQuestionIds: string[];
  favoriteIds: string[];
  notes: Note[];
  nickname: string;
  dailyStats: Record<string, { count: number; correct: number }>;
}

export interface QuizResult {
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
  timeSpent: number;
  questionResults: { questionId: string; selected: number; isCorrect: boolean }[];
}

export type Category = '常识判断' | '逻辑推理' | '言语理解' | '数量关系';

// 题库分类层级
export interface CategoryHierarchy {
  id: string;
  name: string;           // 如"第一章 中国古代史"
  parentId: string | null; // null 表示顶级（章）
  level: 'chapter' | 'section' | 'knowledge'; // 章、节、知识点
  order: number;          // 排序
  questionIds: string[];  // 该分类下的题目ID
}

export interface ImportedBank {
  id: string;
  name: string;           // 用户自定义名称
  fileName: string;       // 原始文件名
  categoryId: string;     // 关联的分类ID
  chapterId: string;      // 所属章
  sectionId?: string;     // 所属节
  questionCount: number;
  importedAt: string;
}

export interface CustomQuestion {
  id: string;
  question: Question;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  nickname: string;
  avatar: string;  // 预设头像标识
  createdAt: string;
}

export interface WrongQuestion {
  questionId: string;
  wrongCount: number;
  lastWrongAt: string;
  correctOnRetry: number; // 重做答对次数
}

export interface ReviewRecord {
  date: string;
  reviewedIds: string[];
  totalCount: number;
}

export interface KnowledgePoint {
  id: string;
  category: string;      // 分类
  title: string;         // 标题
  content: string;       // 详细内容
  summary: string;       // 摘要
  relatedQuestionIds: string[]; // 关联题目ID
  importance: number;    // 重要程度 1-5
  isCustom: boolean;     // 是否用户自定义
  createdAt: string;
}

export interface PracticeRecord {
  id: string;
  date: string;           // YYYY-MM-DD
  questionId: string;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  timeSpent: number;      // 秒
  mode: 'quiz' | 'study' | 'review';
  category: string;
}
