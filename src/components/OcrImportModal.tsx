'use client';

import { useState, useRef, useCallback } from 'react';
import { recognizeImage, reparseText } from '@/lib/ocrParser';
import { Question } from '@/types';

interface OcrImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (bankName: string, questions: Question[], categoryId?: string, chapterId?: string, sectionId?: string) => void;
}

type Step = 'select' | 'recognizing' | 'result';

export default function OcrImportModal({ isOpen, onClose, onImport }: OcrImportModalProps) {
  const [step, setStep] = useState<Step>('select');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [rawTexts, setRawTexts] = useState<string[]>([]);
  const [editText, setEditText] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [bankName, setBankName] = useState('');
  const [resultMsg, setResultMsg] = useState('');
  const [resultType, setResultType] = useState<'success' | 'error'>('success');
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoomedPreview, setZoomedPreview] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const addImages = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setImages(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleStartRecognition = async () => {
    if (images.length === 0) return;
    setStep('recognizing');
    setIsProcessing(true);
    setCurrentIndex(0);
    setProgress(0);

    const allTexts: string[] = [];

    for (let i = 0; i < images.length; i++) {
      setCurrentIndex(i);
      setProgress(0);
      try {
        const result = await recognizeImage(images[i], (p) => {
          setProgress(p);
        });
        allTexts.push(result.text);
      } catch {
        allTexts.push(`[第 ${i + 1} 张图片识别失败]`);
      }
    }

    setRawTexts(allTexts);
    const combined = allTexts.join('\n\n');
    setEditText(combined);

    // 尝试自动解析
    const parsed = reparseText(combined);
    setQuestions(parsed);
    setIsProcessing(false);
  };

  const handleReparse = () => {
    const parsed = reparseText(editText);
    setQuestions(parsed);
  };

  const handleConfirmImport = () => {
    if (questions.length === 0) {
      setResultMsg('未解析出有效题目，请编辑文本后重试');
      setResultType('error');
      setStep('result');
      return;
    }
    const name = bankName.trim() || `图片导入-${new Date().toLocaleDateString('zh-CN')}`;
    onImport(name, questions);
    setResultMsg(`成功导入 ${questions.length} 道题目！`);
    setResultType('success');
    setStep('result');
  };

  const handleClose = () => {
    // 清理预览 URL
    previews.forEach(url => URL.revokeObjectURL(url));
    setStep('select');
    setImages([]);
    setPreviews([]);
    setCurrentIndex(0);
    setProgress(0);
    setRawTexts([]);
    setEditText('');
    setQuestions([]);
    setBankName('');
    setResultMsg('');
    setIsProcessing(false);
    setZoomedPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
        <div
          className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 标题 */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200">📷 图片导入题目</h3>
            <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step 1: 选择图片 */}
          {step === 'select' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {/* 拍照按钮 */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors min-h-[100px]"
                >
                  <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">拍照</span>
                </button>

                {/* 相册选择按钮 */}
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors min-h-[100px]"
                >
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v12a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">从相册选择</span>
                </button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  addImages(e.target.files);
                  if (cameraInputRef.current) cameraInputRef.current.value = '';
                }}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addImages(e.target.files);
                  if (galleryInputRef.current) galleryInputRef.current.value = '';
                }}
              />

              {/* 图片预览 */}
              {previews.length > 0 && (
                <>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">已选择 {images.length} 张图片</p>
                    <div className="flex gap-2 flex-wrap">
                      {previews.map((url, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={url}
                            alt={`预览 ${i + 1}`}
                            className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-slate-600 cursor-pointer"
                            onClick={() => setZoomedPreview(url)}
                          />
                          <button
                            onClick={() => removeImage(i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleStartRecognition}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 shadow-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    开始识别
                  </button>
                </>
              )}

              {/* 格式提示 */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-2xl p-4">
                <p className="text-xs font-medium text-gray-600 dark:text-slate-300 mb-1">提示：</p>
                <ul className="text-xs text-gray-500 dark:text-slate-400 space-y-0.5 list-disc list-inside">
                  <li>支持拍照或从相册选择题目图片</li>
                  <li>确保题目文字清晰可见</li>
                  <li>识别后可手动编辑修正文字</li>
                </ul>
              </div>
            </>
          )}

          {/* Step 2: OCR 识别中 */}
          {step === 'recognizing' && (
            <>
              {/* 当前处理图片 */}
              {previews[currentIndex] && (
                <div className="flex justify-center">
                  <img
                    src={previews[currentIndex]}
                    alt="正在识别"
                    className="max-h-40 rounded-xl border border-gray-200 dark:border-slate-600 object-contain"
                  />
                </div>
              )}

              {/* 进度信息 */}
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  {images.length > 1 ? `处理第 ${currentIndex + 1}/${images.length} 张` : '正在识别文字...'}
                </p>

                {/* 圆形进度条 */}
                <div className="flex justify-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50" cy="50" r="42"
                        fill="none" className="stroke-gray-200 dark:stroke-slate-600" strokeWidth="8"
                      />
                      <circle
                        cx="50" cy="50" r="42"
                        fill="none" strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
                        className="stroke-emerald-500 dark:stroke-emerald-400 transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{progress}%</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 dark:text-slate-500">
                  首次使用需下载语言包，请耐心等待
                </p>
              </div>

              {/* 识别完成后显示文本预览 */}
              {!isProcessing && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-600 dark:text-slate-400 font-medium">识别文本（可编辑）</label>
                      <button
                        onClick={handleReparse}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50"
                      >
                        重新解析
                      </button>
                    </div>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full h-48 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs text-gray-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 resize-y font-mono leading-relaxed"
                      placeholder="识别出的文字..."
                    />
                  </div>

                  {/* 解析结果 */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl p-4">
                    <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                      解析出 {questions.length} 道题目
                    </p>
                    {questions.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                        {questions.slice(0, 5).map((q, i) => (
                          <p key={i} className="text-xs text-gray-600 dark:text-slate-400 truncate">
                            {i + 1}. {q.question.slice(0, 40)}
                          </p>
                        ))}
                        {questions.length > 5 && (
                          <p className="text-xs text-gray-400 dark:text-slate-500 text-center">还有 {questions.length - 5} 题...</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 题库名称 */}
                  <div>
                    <label className="text-sm text-gray-600 dark:text-slate-400 mb-1.5 block">题库名称</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      placeholder="输入题库名称（可选）"
                    />
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        previews.forEach(url => URL.revokeObjectURL(url));
                        setStep('select');
                        setImages([]);
                        setPreviews([]);
                        setRawTexts([]);
                        setEditText('');
                        setQuestions([]);
                        setProgress(0);
                      }}
                      className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium"
                    >
                      重新选择
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      disabled={questions.length === 0}
                      className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      导入题目
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* Step 3: 结果 */}
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

      {/* 图片缩放预览 */}
      {zoomedPreview && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomedPreview(null)}
        >
          <img
            src={zoomedPreview}
            alt="放大预览"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <button
            onClick={() => setZoomedPreview(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
