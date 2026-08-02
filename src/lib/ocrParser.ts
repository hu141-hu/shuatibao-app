import { Question } from '@/types';
import { parseMDContent } from '@/lib/mdParser';

/**
 * 将 OCR 识别出的原始文本预处理为标准 MD 格式，
 * 以便复用 mdParser 的解析逻辑。
 */
function normalizeOcrText(raw: string): string {
  let text = raw;

  // 常见 OCR 噪音清理
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/[ \t]+/g, ' '); // 合并多余空白
  text = text.replace(/^\s+$/gm, ''); // 清除纯空白行中的空白字符

  // 统一选项标记：
  //   "A." "A、" "A)" "A．" 都保留，mdParser 已支持
  //   但 OCR 常把 "A." 识别为 "A ." 或 "A。"
  text = text.replace(/([A-Da-d])\s*[。.、．)\uff09]\s*/g, (match, letter) => {
    return `${letter.toUpperCase()}. `;
  });

  // 尝试将没有 ## 标记的题目行加上 ## 前缀
  // 策略：如果一个数字+点/、后面跟着文字，且下一行是选项，就认为是题目
  const lines = text.split('\n');
  const result: string[] = [];
  let inQuestion = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      result.push('');
      continue;
    }

    // 已有 ## 标记
    if (/^##\s*(?:题目)?\d+\s*[：:、.]/.test(line)) {
      result.push(line);
      inQuestion = true;
      continue;
    }

    // 检测题目编号行：数字+点/、/：
    const questionMatch = line.match(/^(\d+)\s*[.、：:)\uff09]\s*(.+)/);
    if (questionMatch && !inQuestion) {
      const num = questionMatch[1];
      const content = questionMatch[2];
      result.push(`## 题目${num}：${content}`);
      inQuestion = true;
      continue;
    }

    // 检测选项行
    const optionMatch = line.match(/^[-\s]*([A-Da-d])[.、．)\uff09]\s*(.+)/);
    if (optionMatch) {
      result.push(`- ${optionMatch[1].toUpperCase()}. ${optionMatch[2].trim()}`);
      continue;
    }

    // 答案行
    const answerMatch = line.match(/(?:答案|正确答案)\s*[：:]\s*([A-Da-d])/);
    if (answerMatch) {
      result.push(`**答案**：${answerMatch[1].toUpperCase()}`);
      inQuestion = false;
      continue;
    }

    // 解析行
    const explainMatch = line.match(/(?:解析|解析[：:]|解题思路|思路分析)\s*[：:]\s*(.*)/);
    if (explainMatch) {
      result.push(`**解析**：${explainMatch[1].trim()}`);
      continue;
    }

    // 分隔符
    if (/^[-—*]{3,}\s*$/.test(line)) {
      result.push('---');
      inQuestion = false;
      continue;
    }

    // 其他行作为续行
    result.push(line);
  }

  return result.join('\n');
}

/**
 * 使用 Tesseract.js 对图片进行 OCR 识别
 */
export async function recognizeImage(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<{ text: string; questions: Question[] }> {
  // 动态导入 tesseract.js（避免 SSR 问题）
  const Tesseract = await import('tesseract.js');

  const result = await Tesseract.recognize(imageFile, 'chi_sim+eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const rawText = result.data.text;
  const normalizedText = normalizeOcrText(rawText);

  // 尝试解析为题目
  const bankId = `ocr-${Date.now()}`;
  const { questions } = parseMDContent(normalizedText, bankId);

  return {
    text: rawText,
    questions,
  };
}

/**
 * 将用户编辑后的文本重新解析为题目
 */
export function reparseText(text: string, bankId?: string): Question[] {
  const id = bankId || `ocr-${Date.now()}`;
  const { questions } = parseMDContent(text, id);
  return questions;
}
