'use client';

import { useState, useRef, useMemo } from 'react';
import { parseMDContent, extractBankName } from '@/lib/mdParser';
import { useStore } from '@/lib/store';
import { Question } from '@/types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (bankName: string, questions: Question[], categoryId?: string, chapterId?: string, sectionId?: string, bankId?: string) => void;
}

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const { categoryHierarchy, addCategory } = useStore();
  const [step, setStep] = useState<'select' | 'preview' | 'result'>('select');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [currentBankId, setCurrentBankId] = useState('');
  const [bankName, setBankName] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [resultType, setResultType] = useState<'success' | 'error'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 分类选择状态
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [showNewSection, setShowNewSection] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');
  const [newSectionName, setNewSectionName] = useState('');

  // 章列表
  const chapters = useMemo(() => {
    return categoryHierarchy
      .filter(c => c.level === 'chapter' && c.parentId === null)
      .sort((a, b) => a.order - b.order);
  }, [categoryHierarchy]);

  // 当前章下的节列表
  const sections = useMemo(() => {
    if (!selectedChapterId) return [];
    return categoryHierarchy
      .filter(c => c.level === 'section' && c.parentId === selectedChapterId)
      .sort((a, b) => a.order - b.order);
  }, [categoryHierarchy, selectedChapterId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const name = extractBankName(file.name);
    setBankName(name);

    try {
      const text = await file.text();
      setFileContent(text);

      const bankId = `bank-${Date.now()}`;
      setCurrentBankId(bankId);
      const { questions } = parseMDContent(text, bankId);

      if (questions.length === 0) {
        setResultMsg('未能从文件中解析出题目，请检查文件格式');
        setResultType('error');
        setStep('result');
        return;
      }

      setParsedQuestions(questions);
      setStep('preview');
    } catch {
      setResultMsg('文件读取失败，请重试');
      setResultType('error');
      setStep('result');
    }

    // 重置 input 以便同文件再次选择
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = () => {
    // 处理新建章
    let finalChapterId_raw = selectedChapterId;
    if (showNewChapter && newChapterName.trim()) {
      const newCh = addCategory(newChapterName.trim(), null, 'chapter');
      finalChapterId_raw = newCh.id;
    }

    // 处理新建节
    let finalSectionId_raw = selectedSectionId;
    if (showNewSection && newSectionName.trim() && finalChapterId_raw) {
      const newSec = addCategory(newSectionName.trim(), finalChapterId_raw, 'section');
      finalSectionId_raw = newSec.id;
    }

    // 确定最终的 categoryId
    let finalChapterId = finalChapterId_raw;
    let finalSectionId = finalSectionId_raw;

    // Bug 6 修复：如果没有选择章，自动创建以题库名称命名的章
    if (!finalChapterId) {
      const autoChapter = addCategory(bankName || fileName, null, 'chapter');
      finalChapterId = autoChapter.id;
    }

    const categoryId = finalSectionId || finalChapterId || '';

    // 复用 handleFileSelect 生成的 bankId 和 parsedQuestions（Bug 2 修复）
    const questions = parsedQuestions;

    if (questions.length === 0) {
      setResultMsg('导入失败，未找到有效题目');
      setResultType('error');
      setStep('result');
      return;
    }

    onImport(bankName || fileName, questions, categoryId, finalChapterId, finalSectionId, currentBankId);
    setResultMsg(`成功导入 ${questions.length} 道题目！`);
    setResultType('success');
    setStep('result');
  };

  const handleClose = () => {
    setStep('select');
    setFileName('');
    setFileContent('');
    setParsedQuestions([]);
    setCurrentBankId('');
    setBankName('');
    setResultMsg('');
    setSelectedChapterId('');
    setSelectedSectionId('');
    setShowNewChapter(false);
    setShowNewSection(false);
    setNewChapterName('');
    setNewSectionName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200">导入 MD 题库</h3>
          <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 'select' && (
          <>
            {/* 文件选择区 */}
            <div
              className="border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-2xl p-8 text-center cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-4xl mb-3">📂</div>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">点击选择 MD 题库文件</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">支持 .md / .markdown / .txt 格式</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* 格式说明 */}
            <div className="bg-gray-50 dark:bg-slate-700 rounded-2xl p-4">
              <p className="text-xs font-medium text-gray-600 dark:text-slate-300 mb-2">支持的格式：</p>
              <pre className="text-xs text-gray-500 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
{`## 题目1：题目内容
- A. 选项A
- B. 选项B
- C. 选项C
- D. 选项D

**答案**：B
**解析**：解析内容

---`}
              </pre>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            {/* 文件信息 */}
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl p-4">
              <p className="text-sm text-gray-700 dark:text-slate-300">
                <span className="font-medium">文件：</span>{fileName}
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                解析出 {parsedQuestions.length} 道题目
              </p>
            </div>

            {/* 题库名称编辑 */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 block">📝 题库名称</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                placeholder="输入题库名称"
              />
            </div>

            {/* 分类选择 */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block">📁 所属分类</label>

              {/* 章选择 */}
              <div>
                <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">所属章（可选）</label>
                <select
                  value={showNewChapter ? '__new__' : selectedChapterId}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '__new__') {
                      setShowNewChapter(true);
                      setSelectedChapterId('');
                      setSelectedSectionId('');
                      setShowNewSection(false);
                    } else {
                      setShowNewChapter(false);
                      setNewChapterName('');
                      setSelectedChapterId(v);
                      setSelectedSectionId('');
                      setShowNewSection(false);
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">跳过（归入默认分类）</option>
                  {chapters.map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                  <option value="__new__">＋ 新建章...</option>
                </select>
              </div>

              {/* 新建章输入 */}
              {showNewChapter && (
                <div className="ml-4 pl-3 border-l-2 border-emerald-300 dark:border-emerald-700">
                  <input
                    type="text"
                    value={newChapterName}
                    onChange={(e) => setNewChapterName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                    placeholder={'输入新章名称，如“第一章 中国古代史”'}
                    autoFocus
                  />
                </div>
              )}

              {/* 节选择 - 仅在选了章后显示 */}
              {(selectedChapterId || showNewChapter) && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-slate-400 mb-1 block">所属节（可选）</label>
                  <select
                    value={showNewSection ? '__new__' : selectedSectionId}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '__new__') {
                        setShowNewSection(true);
                        setSelectedSectionId('');
                      } else {
                        setShowNewSection(false);
                        setNewSectionName('');
                        setSelectedSectionId(v);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">跳过（直接归入章）</option>
                    {sections.map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ))}
                    <option value="__new__">＋ 新建节...</option>
                  </select>
                </div>
              )}

              {/* 新建节输入 */}
              {showNewSection && (
                <div className="ml-4 pl-3 border-l-2 border-blue-300 dark:border-blue-700">
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder={'输入新节名称，如“第1节 先秦时期”'}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* 题目预览 */}
            <div>
              <label className="text-xs text-gray-500 dark:text-slate-400 mb-1.5 block">题目预览</label>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {parsedQuestions.slice(0, 5).map((q, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-slate-700 rounded-xl p-3 text-xs text-gray-600 dark:text-slate-400">
                    <span className="font-medium">{i + 1}. </span>
                    {q.question.slice(0, 50)}{q.question.length > 50 ? '...' : ''}
                  </div>
                ))}
                {parsedQuestions.length > 5 && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 text-center">还有 {parsedQuestions.length - 5} 题...</p>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('select')}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium"
              >
                重新选择
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 shadow-sm"
              >
                确认导入
              </button>
            </div>
          </>
        )}

        {step === 'result' && (
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
        )}
      </div>
    </div>
  );
}
