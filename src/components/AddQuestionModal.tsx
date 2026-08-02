'use client';

import { useState } from 'react';
import { Question } from '@/types';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (question: Question) => void;
}

const CATEGORIES = ['常识判断', '逻辑推理', '言语理解', '数量关系'];

export default function AddQuestionModal({ isOpen, onClose, onAdd }: AddQuestionModalProps) {
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [answer, setAnswer] = useState('0');
  const [explanation, setExplanation] = useState('');
  const [category, setCategory] = useState('常识判断');
  const [difficulty, setDifficulty] = useState(2);
  const [resultMsg, setResultMsg] = useState('');
  const [resultType, setResultType] = useState<'success' | 'error'>('success');
  const [showResult, setShowResult] = useState(false);

  const resetForm = () => {
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setAnswer('0');
    setExplanation('');
    setCategory('常识判断');
    setDifficulty(2);
    setShowResult(false);
    setResultMsg('');
  };

  const handleSubmit = () => {
    if (!questionText.trim()) {
      setResultMsg('请输入题目内容');
      setResultType('error');
      setShowResult(true);
      return;
    }
    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      setResultMsg('请填写所有选项');
      setResultType('error');
      setShowResult(true);
      return;
    }

    const newQuestion: Question = {
      id: `custom-${Date.now()}`,
      category,
      difficulty,
      question: questionText.trim(),
      options: [optionA.trim(), optionB.trim(), optionC.trim(), optionD.trim()],
      answer: parseInt(answer),
      explanation: {
        brief: explanation.trim(),
        detailed: '',
        knowledge: '',
        tips: '',
      },
    };

    onAdd(newQuestion);
    setResultMsg('题目添加成功！');
    setResultType('success');
    setShowResult(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200">添加自定义题目</h3>
          <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {showResult ? (
          <>
            <div className={`rounded-2xl p-6 text-center ${resultType === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
              <div className="text-4xl mb-3">{resultType === 'success' ? '✅' : '❌'}</div>
              <p className={`text-sm font-medium ${resultType === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {resultMsg}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600"
            >
              完成
            </button>
          </>
        ) : (
          <>
            {/* 分类和难度 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 dark:text-slate-400 mb-1 block">分类</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-slate-400 mb-1 block">难度</label>
                <div className="flex items-center gap-1 h-[42px]">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setDifficulty(n)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                        n <= difficulty
                          ? 'bg-amber-400 text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 题目内容 */}
            <div>
              <label className="text-xs text-gray-600 dark:text-slate-400 mb-1 block">题目内容 *</label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                rows={3}
                placeholder="输入题目内容"
              />
            </div>

            {/* 选项 */}
            {['A', 'B', 'C', 'D'].map((letter, index) => (
              <div key={letter}>
                <label className="text-xs text-gray-600 dark:text-slate-400 mb-1 block">选项 {letter} *</label>
                <input
                  type="text"
                  value={[optionA, optionB, optionC, optionD][index]}
                  onChange={(e) => {
                    const setters = [setOptionA, setOptionB, setOptionC, setOptionD];
                    setters[index](e.target.value);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  placeholder={`输入选项 ${letter}`}
                />
              </div>
            ))}

            {/* 正确答案 */}
            <div>
              <label className="text-xs text-gray-600 dark:text-slate-400 mb-1 block">正确答案</label>
              <select
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {['A', 'B', 'C', 'D'].map((letter, index) => (
                  <option key={letter} value={index}>{letter}</option>
                ))}
              </select>
            </div>

            {/* 解析 */}
            <div>
              <label className="text-xs text-gray-600 dark:text-slate-400 mb-1 block">解析（可选）</label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                rows={2}
                placeholder="输入题目解析"
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 shadow-sm"
              >
                添加题目
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
