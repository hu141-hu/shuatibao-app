import { Question } from '@/types';
import { parseMDContent, ParseWarning } from '@/lib/mdParser';

/**
 * OCR 本地化开关：
 * - 默认（false）：worker/语言包从 jsDelivr CDN 在线加载（国内可能慢/被墙）
 * - 开启（true）：从 /ocr 加载本地资源，需先运行 node scripts/download-ocr-assets.mjs
 */
const OCR_LOCAL = process.env.NEXT_PUBLIC_OCR_LOCAL === 'true';
const OCR_BASE = '/ocr';

/**
 * 将 OCR 识别的原始文本转换为应用可导入的标准 Markdown 题目格式。
 *
 * 目标格式（与 mdParser 的导入格式一致，参考 输出/背诵手册选择题/*.md）：
 *   ## 题目1：题干
 *   - A. 选项A
 *   - B. 选项B
 *   - C. 选项C
 *   - D. 选项D
 *   **答案**：B
 *   **解析**：解析内容
 *
 * 兼容的真实 OCR 形态：
 *   - 题号：1. / 1、 / 1) / 1） / 第1题 / 孤行题号（"1." 单独一行，题干在下一行）
 *   - 选项：A. / A、 / A) / A． / A 空格 甚至无分隔符
 *   - 答案：答案： / 正确答案： / 参考答案： / 【答案】 / 答案A / 正确答案为B
 *   - 解析：解析： / 【解析】 / 解题思路： / 答案解析：
 *   - 汇总答案块：答案：1.A 2.B 3.C（按题号回填到各题）
 *   - 带编号解析：【解析】1.xxx 2.xxx（按题号回填到各题）
 */
export function ocrToMarkdown(raw: string): string {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n');
  const out: string[] = [];

  interface QPos {
    num: number;
    titleIdx: number;
    lastOptionIdx: number;
    hasAnswer: boolean;
    hasExplanation: boolean;
  }
  const positions: QPos[] = [];
  let current: QPos | null = null;
  let pendingNum: number | null = null; // 孤行题号，等下一行题干
  let inExplanation = false;            // 是否处于当前题解析的续行状态

  // 汇总块（答案/解析集中在页面底部）按题号暂存，最后回填
  const answerMap = new Map<number, string>();
  const explanationMap = new Map<number, string>();

  const beginQuestion = (num: number, text: string): QPos => {
    if (out.length > 0 && out[out.length - 1] !== '') out.push('');
    const titleIdx = out.length;
    out.push(`## 题目${num}：${text}`);
    const q: QPos = { num, titleIdx, lastOptionIdx: -1, hasAnswer: false, hasExplanation: false };
    positions.push(q);
    inExplanation = false;
    return q;
  };

  const handleAnswer = (rest: string, cur: QPos | null): QPos | null => {
    const t = rest.trim();
    if (!t) return cur;
    // 单项答案：A / 答案B / 正确答案为B
    const single = t.match(/^(?:为|是)?\s*([A-Da-d])\s*$/);
    if (single) {
      if (cur) {
        out.push(`**答案**：${single[1].toUpperCase()}`);
        cur.hasAnswer = true;
        inExplanation = false;
      }
      return cur;
    }
    // 汇总答案块：1.A 2.B 3.C ...
    const pairRe = /(\d{1,3})\s*[.、．)\uff09）]?\s*([A-Da-d])(?![A-Za-z])/g;
    const pairs: { num: number; letter: string }[] = [];
    let pm: RegExpExecArray | null;
    while ((pm = pairRe.exec(t)) !== null) {
      pairs.push({ num: Number(pm[1]), letter: pm[2].toUpperCase() });
    }
    if (pairs.length === 0) return cur; // 无法识别，忽略
    for (const p of pairs) answerMap.set(p.num, p.letter);
    // 只有一对且等于当前题号：直接内联到当前题
    if (pairs.length === 1 && cur && pairs[0].num === cur.num) {
      out.push(`**答案**：${pairs[0].letter}`);
      cur.hasAnswer = true;
      answerMap.delete(pairs[0].num);
    }
    return cur;
  };

  const handleExplanation = (rest: string, cur: QPos | null): QPos | null => {
    const t = rest.trim();
    if (!t) return cur;
    // 带编号解析：1.xxx 2.xxx → 按题号回填
    const segRe = /(\d{1,3})\s*[.、．)\uff09）:：]\s*/g;
    const segs: { num: number; text: string }[] = [];
    let sm: RegExpExecArray | null;
    let lastIdx = 0;
    while ((sm = segRe.exec(t)) !== null) {
      const start = sm.index + sm[0].length;
      if (segs.length > 0) segs[segs.length - 1].text = t.slice(lastIdx, sm.index).trim();
      segs.push({ num: Number(sm[1]), text: '' });
      lastIdx = start;
    }
    if (segs.length > 0) {
      segs[segs.length - 1].text = t.slice(lastIdx).trim();
      for (const s of segs) {
        if (s.text && !explanationMap.has(s.num)) explanationMap.set(s.num, s.text);
      }
    } else if (cur) {
      // 无编号：属于当前题
      out.push(`**解析**：${t}`);
      cur.hasExplanation = true;
      inExplanation = true;
    }
    return cur;
  };

  // —— 行级匹配规则 ——
  const QUESTION_RE = /^(\d{1,3})\s*[.、．)\uff09）]\s*(.*)$/;        // 1. / 1、 / 1) / 1） / 1．
  const QUESTION_CN_RE = /^第\s*(\d{1,3})\s*题\s*[：:、.．]?\s*(.*)$/; // 第1题
  const OPTION_RE = /^[-*\s]*([A-Da-d])\s*[.、．)\uff09）:：]?\s*(.+)$/; // A. / A、 / A) / A 空格 / 无分隔符
  const EXPLANATION_RE = /^(?:【\s*)?(?:答案)?\s*(?:解析|解题思路|思路分析)\s*(?:\s*】)?\s*[：:]?\s*(.*)$/;
  const ANSWER_RE = /^(?:【\s*)?(?:(?:参考|正确)\s*)?答案\s*(?:\s*】)?\s*[：:]?\s*(.*)$/;
  // 噪音行：页码、纯数字、分隔线、URL
  const NOISE_RE = /^(?:第\s*\d+\s*页|共\s*\d+\s*页|\d+\s*\/\s*\d+|\d+|[-—~=*_#]{3,}|https?:\/\/\S+|.{0,2}[-—~=*_#]{3,}.{0,2})$/;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      inExplanation = false;
      continue;
    }

    // 噪音行
    if (NOISE_RE.test(line)) continue;

    // 解析行（必须先于答案判断，避免「答案解析」被误判为答案）
    let m = line.match(EXPLANATION_RE);
    if (m) {
      current = handleExplanation(m[1], current);
      continue;
    }

    // 答案行
    m = line.match(ANSWER_RE);
    if (m) {
      current = handleAnswer(m[1], current);
      continue;
    }

    // 题目标题
    m = line.match(QUESTION_CN_RE);
    if (m) {
      const text = m[2].trim();
      if (text) current = beginQuestion(Number(m[1]), text);
      else pendingNum = Number(m[1]);
      continue;
    }

    m = line.match(QUESTION_RE);
    if (m) {
      const text = m[2].trim();
      if (text) current = beginQuestion(Number(m[1]), text);
      else pendingNum = Number(m[1]);
      continue;
    }

    // 选项行
    m = line.match(OPTION_RE);
    if (m && current) {
      const text = m[2].trim();
      const idx = out.length;
      out.push(`- ${m[1].toUpperCase()}. ${text}`);
      current.lastOptionIdx = idx;
      inExplanation = false;
      continue;
    }

    // 其余普通行：优先处理待定题号（孤行题号的题干到了），再做题干/选项/解析的续行
    if (pendingNum !== null) {
      current = beginQuestion(pendingNum, line);
      pendingNum = null;
    } else if (current) {
      if (inExplanation) {
        out.push(line); // 解析续行（mdParser 会并入当前解析）
      } else if (current.lastOptionIdx >= 0) {
        out[current.lastOptionIdx] += line; // 选项换行续行
      } else {
        out[current.titleIdx] += line; // 题干续行
      }
    }
    // 无当前题且无 pendingNum 的行：跳过（页面噪声）
  }

  // 回填汇总答案块/解析块（倒序处理，保持前面的索引有效）
  for (let i = positions.length - 1; i >= 0; i--) {
    const p = positions[i];
    if (p.lastOptionIdx < 0) continue; // 没有选项的题无法导入，跳过
    let insertAt = p.lastOptionIdx;
    const ans = p.hasAnswer ? '' : answerMap.get(p.num) || '';
    const exp = p.hasExplanation ? '' : explanationMap.get(p.num) || '';
    if (ans) {
      out.splice(insertAt + 1, 0, `**答案**：${ans}`);
      insertAt += 1;
    }
    if (exp) {
      out.splice(insertAt + 1, 0, `**解析**：${exp}`);
    }
  }

  return out.join('\n').trim();
}

/**
 * 使用 Tesseract.js 对图片进行 OCR 识别，并把识别文本自动转换为
 * 可导入的 Markdown 题目格式。
 */
export async function recognizeImage(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<{ text: string; markdown: string; questions: Question[]; warnings: ParseWarning[] }> {
  // 动态导入 tesseract.js（避免 SSR 问题）
  const Tesseract = await import('tesseract.js');

  // 本地模式：指定 worker/核心/语言包路径；否则使用 tesseract 默认 CDN
  const workerOptions = OCR_LOCAL
    ? {
        workerPath: `${OCR_BASE}/worker.min.js`,
        corePath: OCR_BASE,
        langPath: `${OCR_BASE}/lang`,
      }
    : {};

  const worker = await Tesseract.createWorker('chi_sim+eng', 1, {
    ...workerOptions,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });
  const result = await worker.recognize(imageFile);
  await worker.terminate();

  const rawText = result.data.text;
  const markdown = ocrToMarkdown(rawText);

  // 用转换后的 Markdown 解析题目
  const bankId = `ocr-${Date.now()}`;
  const { questions, warnings } = parseMDContent(markdown, bankId);

  return {
    text: rawText,
    markdown,
    questions,
    warnings,
  };
}

/**
 * 将用户编辑后的 Markdown 文本重新解析为题目
 */
export function reparseText(
  text: string,
  bankId?: string
): { questions: Question[]; warnings: ParseWarning[] } {
  const id = bankId || `ocr-${Date.now()}`;
  const { questions, warnings } = parseMDContent(text, id);
  return { questions, warnings };
}
