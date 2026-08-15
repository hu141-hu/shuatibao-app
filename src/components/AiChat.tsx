'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Question } from '@/types';
import {
  ChatMessage,
  aiChat,
  clearAiSession,
  isAiConfigured,
  loadAiSession,
  saveAiSession,
  setApiKey,
} from '@/lib/aiClient';

const labels = ['A', 'B', 'C', 'D'];

interface AiChatProps {
  question: Question;
  userAnswer: number | null;
  correctAnswer: number;
}

function buildSystemPrompt(): ChatMessage {
  return {
    role: 'system',
    content:
      '你是"刷题宝"的备考 AI 助教，服务对象是备考公务员/事业编的考生。请用简洁、准确、口语化的中文讲解题目。\n' +
      '规则：\n' +
      '1. 只依据题目、选项和提供的【正确答案】讲解，绝不擅自更改答案，也不编造题目之外的事实。\n' +
      '2. 用 Markdown 组织，包含三部分：**正确答案**、**解析**（为什么对、各错项陷阱在哪）、**知识点扩展**（可选）。\n' +
      '3. 控制在 200~400 字，易理解。\n' +
      '4. 用户追问时，结合上下文继续解答，可举例、对比、给记忆口诀。',
  };
}

function buildFirstUserMessage(q: Question, userAnswer: number | null, correctAnswer: number): ChatMessage {
  const lines: string[] = [];
  lines.push(`【题目】${q.question}`);
  lines.push('【选项】');
  q.options.forEach((opt, i) => lines.push(`${labels[i]}. ${opt}`));
  lines.push(`【正确答案】${labels[correctAnswer]}. ${q.options[correctAnswer]}`);
  if (userAnswer !== null && userAnswer !== correctAnswer) {
    lines.push(`【我的作答】${labels[userAnswer]}. ${q.options[userAnswer]}（答错了）`);
  }
  lines.push('请讲解这道题。');
  return { role: 'user', content: lines.join('\n') };
}

// === 极简 Markdown 渲染（加粗 / 标题 / 列表） ===
function renderInline(text: string, keyPrefix: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{p}</span>
    ),
  );
}

function renderMarkdown(md: string): ReactNode {
  const lines = md.split('\n');
  const nodes: ReactNode[] = [];
  let listItems: { text: string; ordered: boolean }[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    const ordered = listItems[0].ordered;
    const items = listItems.map((it, i) => (
      <li key={i} className="text-sm leading-relaxed">
        {renderInline(it.text, `li-${listKey}-${i}`)}
      </li>
    ));
    if (ordered) {
      nodes.push(
        <ol key={`list-${listKey}`} className="list-decimal ml-4 space-y-1 my-1">
          {items}
        </ol>,
      );
    } else {
      nodes.push(
        <ul key={`list-${listKey}`} className="list-disc ml-4 space-y-1 my-1">
          {items}
        </ul>,
      );
    }
    listItems = [];
    listKey += 1;
  };

  lines.forEach((raw, idx) => {
    const trimmed = raw.trimEnd().trim();
    if (!trimmed) {
      flushList();
      return;
    }
    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    const bullet = trimmed.match(/^[-*]\s+(.*)$/);
    const numbered = trimmed.match(/^(\d+)[.、)]\s+(.*)$/);

    if (heading) {
      flushList();
      const level = heading[1].length;
      const cls = level <= 1 ? 'text-base font-bold' : level === 2 ? 'text-sm font-bold' : 'text-sm font-semibold';
      nodes.push(
        <div key={`h-${idx}`} className={`${cls} mt-2 mb-1`}>
          {renderInline(heading[2], `h-${idx}`)}
        </div>,
      );
    } else if (bullet) {
      listItems.push({ text: bullet[1], ordered: false });
    } else if (numbered) {
      listItems.push({ text: numbered[2], ordered: true });
    } else {
      flushList();
      nodes.push(
        <p key={`p-${idx}`} className="text-sm leading-relaxed my-1">
          {renderInline(trimmed, `p-${idx}`)}
        </p>,
      );
    }
  });
  flushList();

  return <div className="text-gray-700 dark:text-slate-300">{nodes}</div>;
}

export default function AiChat({ question, userAnswer, correctAnswer }: AiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [configured, setConfigured] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  useEffect(() => {
    setConfigured(isAiConfigured());
  }, []);

  useEffect(() => {
    const hist = loadAiSession(question.id);
    if (hist.length > 0) {
      setMessages(hist);
      setStarted(true);
    } else {
      setMessages([]);
      setStarted(false);
    }
    setError('');
    setInput('');
  }, [question.id]);

  const persist = useCallback(
    (msgs: ChatMessage[]) => {
      setMessages(msgs);
      saveAiSession(question.id, msgs);
    },
    [question.id],
  );

  const startExplain = async () => {
    setLoading(true);
    setError('');
    const base: ChatMessage[] = [buildSystemPrompt(), buildFirstUserMessage(question, userAnswer, correctAnswer)];
    try {
      const reply = await aiChat(base);
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply };
      persist([...base, assistantMsg]);
      setStarted(true);
    } catch (e) {
      setError(String((e && (e as Error).message) || e));
    } finally {
      setLoading(false);
    }
  };

  const sendFollowup = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setLoading(true);
    setError('');
    const userMsg: ChatMessage = { role: 'user', content: text };
    const next: ChatMessage[] = [...messages, userMsg];
    persist(next);
    try {
      const reply = await aiChat(next);
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply };
      persist([...next, assistantMsg]);
    } catch (e) {
      setError(String((e && (e as Error).message) || e));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    clearAiSession(question.id);
    setMessages([]);
    setStarted(false);
    setError('');
    setInput('');
  };

  if (!configured) {
    const saveKey = () => {
      const k = keyInput.trim();
      if (!k) return;
      setApiKey(k);
      setKeyInput('');
      setConfigured(true);
    };
    return (
      <div className="mt-4 p-4 rounded-2xl border border-violet-100 dark:border-violet-900/40 bg-violet-50/60 dark:bg-violet-900/10 space-y-3">
        <p className="text-sm font-medium text-violet-700 dark:text-violet-300">✨ AI 讲解</p>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          首次使用请填写 DeepSeek API Key（保存在本机，模型 deepseek-v4-flash）。
        </p>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder="sk-..."
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:border-violet-500"
        />
        <button
          onClick={saveKey}
          disabled={!keyInput.trim()}
          className="w-full min-h-[44px] rounded-xl bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors disabled:opacity-50"
        >
          保存并启用
        </button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mt-4">
        <button
          onClick={startExplain}
          disabled={loading}
          className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-semibold hover:from-violet-600 hover:to-indigo-600 transition-colors shadow-md disabled:opacity-60"
        >
          {loading ? 'AI 正在讲解…' : '✨ AI 讲解（可追问）'}
        </button>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  // 隐藏前两条（system + 首次用户提问，题目本身已展示），只渲染对话
  const visible = messages.slice(2);

  return (
    <div className="mt-4 rounded-2xl border border-violet-100 dark:border-violet-900/40 bg-violet-50/60 dark:bg-violet-900/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">🤖 AI 讲解</span>
        <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 min-h-[32px] px-2">
          清空对话
        </button>
      </div>

      <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
        {visible.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'assistant'
                ? 'bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-slate-700'
                : 'bg-violet-100 dark:bg-violet-900/30 rounded-xl p-3 ml-6'
            }
          >
            {m.role === 'assistant' ? renderMarkdown(m.content) : (
              <p className="text-sm text-gray-800 dark:text-slate-200 leading-relaxed">{m.content}</p>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-xs text-violet-500 dark:text-violet-400 animate-pulse">AI 正在思考…</div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              sendFollowup();
            }
          }}
          placeholder="追问：这个知识点没懂，再举个例子？"
          className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:border-violet-500"
        />
        <button
          onClick={sendFollowup}
          disabled={loading || !input.trim()}
          className="px-4 min-h-[44px] rounded-xl bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors disabled:opacity-50"
        >
          发送
        </button>
      </div>
    </div>
  );
}
