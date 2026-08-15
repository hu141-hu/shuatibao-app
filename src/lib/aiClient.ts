'use client';

/**
 * AI 能力封装（deepseek-v4-flash）
 *
 * 两种调用方式，按优先级：
 *   1. 直连：用户在 App 内填写的 DeepSeek API Key（localStorage，键名 ai_api_key）。
 *      DeepSeek 官方 API 已开启 CORS，浏览器/WebView 可直接调用，无需任何后端。
 *   2. 后端：NEXT_PUBLIC_AI_API_URL 指向的 Cloudflare Worker（Key 放服务端，适合分发场景）。
 *
 * 模型固定 deepseek-v4-flash，并关闭思考模式（thinking disabled），回答直接、快速、省 token。
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const AI_API_URL = (process.env.NEXT_PUBLIC_AI_API_URL || '').trim();
const API_KEY_STORAGE = 'ai_api_key';
const MODEL = 'deepseek-v4-flash';
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

// === API Key 管理（localStorage） ===
export function getApiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setApiKey(key: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(API_KEY_STORAGE, key.trim());
  } catch {}
}

export function clearApiKey() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(API_KEY_STORAGE);
  } catch {}
}

export function isAiConfigured(): boolean {
  return getApiKey().length > 0 || AI_API_URL.length > 0;
}

// === 直连 DeepSeek ===
async function callDeepSeekDirect(key: string, messages: ChatMessage[], maxTokens = 3000): Promise<string> {
  let res: Response;
  try {
    res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.3,
        max_tokens: maxTokens,
        stream: false,
        thinking: { type: 'disabled' },
      }),
    });
  } catch {
    throw new Error('无法连接 DeepSeek，请检查网络');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data as { error?: { message?: string } | string }).error);
    throw new Error(typeof msg === 'string' ? msg : msg && (msg as { message?: string }).message || `DeepSeek 错误 (${res.status})`);
  }
  const content = (data as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content) {
    throw new Error('AI 返回为空');
  }
  return content;
}

// === 调用 Worker（可选后端） ===
async function callWorker(path: string, body?: unknown): Promise<string> {
  if (!AI_API_URL) throw new Error('未配置 AI 后端');
  let res: Response;
  try {
    res = await fetch(`${AI_API_URL.replace(/\/+$/, '')}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('无法连接 AI 服务，请检查后端是否已部署');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `AI 请求失败 (${res.status})`);
  }
  if (typeof data.content !== 'string') throw new Error('AI 返回格式异常');
  return data.content;
}

export async function aiChat(messages: ChatMessage[]): Promise<string> {
  const key = getApiKey();
  if (key) return callDeepSeekDirect(key, messages, 3000);
  if (AI_API_URL) return callWorker('/chat', { messages });
  throw new Error('请先填写 DeepSeek API Key');
}

const SHIZHENG_SYSTEM = '你是备考公务员/事业编考试的时政辅导专家，服务对象是公考、事业编考生。';

export async function aiShizheng(): Promise<string> {
  const key = getApiKey();
  if (key) {
    return callDeepSeekDirect(
      key,
      [
        { role: 'system', content: SHIZHENG_SYSTEM },
        {
          role: 'user',
          content:
            '请按【年份】→【分类：重要会议与政策文件 / 科技成就 / 经济 / 外交 / 法治 / 民生 / 文化体育 / 生态文明】组织，输出一份"近三年公考时政精华"。每条要点格式：日期 + 事件 + 一句话考点提示。只写你确信真实发生过的重大事件，不要编造日期和数字；不确定的宁可不写。',
        },
      ],
      4000,
    );
  }
  if (AI_API_URL) return callWorker('/shizheng');
  throw new Error('请先填写 DeepSeek API Key');
}

// === 会话持久化（按题目 ID） ===
const SESSION_PREFIX = 'ai-chat-';

export function loadAiSession(questionId: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSION_PREFIX + questionId);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function saveAiSession(questionId: string, messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_PREFIX + questionId, JSON.stringify(messages));
  } catch {}
}

export function clearAiSession(questionId: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_PREFIX + questionId);
  } catch {}
}
