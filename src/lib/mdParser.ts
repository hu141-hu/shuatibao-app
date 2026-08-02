import { Question } from '@/types';

/**
 * 将解析后的文本智能拆分为 explanation 的四个字段
 */
function splitExplanation(text: string): { brief: string; detailed: string; knowledge: string; tips: string } {
  const trimmed = text.trim();

  if (!trimmed) {
    return { brief: '', detailed: '', knowledge: '', tips: '' };
  }

  // 关键词分割模式
  const sectionPatterns = [
    { regex: /(?:解题思路|思路分析)[：:]\s*/i, key: 'detailed' },
    { regex: /(?:知识点|相关知识)[：:]\s*/i, key: 'knowledge' },
    { regex: /(?:易错点|易混淆|注意事项|陷阱)[：:]\s*/i, key: 'tips' },
    { regex: /(?:简要|概述|答案)[：:]\s*/i, key: 'brief' },
  ];

  let hasKeyword = false;
  const sections: Record<string, string[]> = { brief: [], detailed: [], knowledge: [], tips: [] };
  let currentKey = 'brief';
  const lines = trimmed.split('\n');

  for (const line of lines) {
    let matched = false;
    for (const { regex, key } of sectionPatterns) {
      if (regex.test(line)) {
        hasKeyword = true;
        currentKey = key;
        const afterColon = line.replace(regex, '').trim();
        if (afterColon) sections[currentKey].push(afterColon);
        matched = true;
        break;
      }
    }
    if (!matched) {
      sections[currentKey].push(line);
    }
  }

  if (!hasKeyword) {
    // 没有关键词，整段作为 brief
    return {
      brief: trimmed,
      detailed: '',
      knowledge: '',
      tips: '',
    };
  }

  return {
    brief: sections.brief.join('\n').trim(),
    detailed: sections.detailed.join('\n').trim(),
    knowledge: sections.knowledge.join('\n').trim(),
    tips: sections.tips.join('\n').trim(),
  };
}

/**
 * 将答案字母转为索引
 */
function answerToIndex(answer: string): number {
  const map: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
  const upper = answer.trim().toUpperCase();
  return map[upper] ?? 0;
}

/**
 * 从题目标题中提取题号
 */
function extractQuestionNumber(title: string): string {
  // ## 题目1：... / ## 题目2：... / ## 1. ... / ## 1、...
  const match = title.match(/^##\s*(?:题目)?(\d+)\s*[：:、.]/);
  if (match) return match[1];
  return '';
}

/**
 * 从题目标题中提取题目文本
 */
function extractQuestionText(title: string): string {
  // ## 题目X：内容 / ## X. 内容 / ## X、内容
  const match = title.match(/^##\s*(?:题目)?\d+\s*[：:、]\s*(.+)/);
  if (match) return match[1].trim();
  return '';
}

interface RawQuestion {
  title: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

/**
 * 将 MD 文本解析为 RawQuestion 数组
 */
function parseRawQuestions(content: string): RawQuestion[] {
  const lines = content.split('\n');
  const rawQuestions: RawQuestion[] = [];
  let current: RawQuestion | null = null;
  let parsingExplanation = false;

  const flushCurrent = () => {
    if (current && current.question && current.options.length >= 2 && current.answer) {
      rawQuestions.push({ ...current });
    }
    current = null;
    parsingExplanation = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // 分隔符
    if (/^-{3,}\s*$/.test(line) || /^\*{3,}\s*$/.test(line)) {
      flushCurrent();
      continue;
    }

    // 题目标题
    if (/^##\s*(?:题目)?\d+\s*[：:、.]/.test(line)) {
      flushCurrent();
      const questionText = extractQuestionText(line);
      current = {
        title: line,
        question: questionText || line.replace(/^##\s*/, ''),
        options: [],
        answer: '',
        explanation: '',
      };
      continue;
    }

    if (!current) continue;

    // 选项行：- A. xxx / - A、xxx / A. xxx / A、xxx
    const optionMatch = line.match(/^-?\s*([A-Da-d])[.、．)\uff09]\s*(.+)/);
    if (optionMatch && !parsingExplanation) {
      const optionText = optionMatch[2].trim();
      current.options.push(optionText);
      continue;
    }

    // 答案行
    const answerMatch = line.match(/\*{1,2}答案\*{1,2}\s*[：:]\s*([A-Da-d])/);
    if (answerMatch) {
      current.answer = answerMatch[1].toUpperCase();
      parsingExplanation = false;
      continue;
    }

    // 解析行
    const explanationMatch = line.match(/\*{1,2}解析\*{1,2}\s*[：:]\s*(.*)/);
    if (explanationMatch) {
      parsingExplanation = true;
      const firstLine = explanationMatch[1].trim();
      if (firstLine) current.explanation = firstLine;
      continue;
    }

    // 解析续行
    if (parsingExplanation && line) {
      if (current.explanation) {
        current.explanation += '\n' + line;
      } else {
        current.explanation = line;
      }
      continue;
    }

    // 题目文本续行（如果没有选项和答案，可能是多行题目）
    if (!current.answer && current.options.length === 0 && !parsingExplanation && line) {
      current.question += '\n' + line;
    }
  }

  // 处理最后一个题目
  flushCurrent();

  return rawQuestions;
}

/**
 * 从文件名提取题库名称
 */
export function extractBankName(filename: string): string {
  return filename.replace(/\.(md|markdown|txt)$/i, '').trim();
}

/**
 * 解析 MD 文件内容为 Question 数组
 */
export function parseMDFile(content: string, bankId: string): Question[] {
  const rawQuestions = parseRawQuestions(content);

  return rawQuestions.map((raw, index) => {
    const num = extractQuestionNumber(raw.title) || String(index + 1);
    return {
      id: `imported-${bankId}-${num}`,
      category: '常识判断',
      difficulty: 2,
      question: raw.question,
      options: raw.options.slice(0, 4),
      answer: answerToIndex(raw.answer),
      explanation: splitExplanation(raw.explanation),
    };
  });
}

/**
 * 解析 MD 文件并返回题目数量和题目数组
 */
export function parseMDContent(content: string, bankId: string): { questions: Question[]; count: number } {
  const questions = parseMDFile(content, bankId);
  return { questions, count: questions.length };
}
