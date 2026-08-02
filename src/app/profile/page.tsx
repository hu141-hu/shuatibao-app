'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/store';
import ImportModal from '@/components/ImportModal';
import OcrImportModal from '@/components/OcrImportModal';
import AddQuestionModal from '@/components/AddQuestionModal';
import UpdateModal from '@/components/UpdateModal';
import InputModal from '@/components/InputModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { Question, ImportedBank } from '@/types';
import { checkForUpdate, isNewerVersion, CURRENT_VERSION, VersionInfo } from '@/lib/updater';

const PRESET_AVATARS: Record<string, string> = {
  fox: '🦊', cat: '🐱', dog: '🐶', rabbit: '🐰',
  panda: '🐼', koala: '🐨', tiger: '🐯', penguin: '🐧',
};

export default function ProfilePage() {
  const router = useRouter();
  const {
    currentUser, progress, setDailyGoal, removeWrong,
    importedBanks, addImportedQuestions, removeImportedBank,
    customQuestions, addCustomQuestion,
    wrongQuestions, confusedQuestions, todayReviewCount,
    allQuestions,
    categoryHierarchy, addCategory, removeCategory, updateCategory,
  } = useStore();
  const { theme, setTheme } = useTheme();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(progress.dailyGoal.toString());
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  
  // 删除确认弹窗状态
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    bankId: string;
    bankName: string;
    questionCount: number;
  }>({ isOpen: false, bankId: '', bankName: '', questionCount: 0 });

  // InputModal 状态
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message?: string;
    defaultValue?: string;
    placeholder?: string;
    mode: 'input' | 'confirm';
    onConfirm: (value: string) => void;
  }>({ isOpen: false, title: '', mode: 'input', onConfirm: () => {} });

  const openInputModal = (title: string, defaultValue: string, placeholder: string, onConfirm: (v: string) => void) => {
    setModalState({ isOpen: true, title, defaultValue, placeholder, mode: 'input', onConfirm });
  };
  const openConfirmModal = (title: string, message: string, onConfirm: () => void) => {
    setModalState({ isOpen: true, title, message, mode: 'confirm', onConfirm: () => onConfirm() });
  };
  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    const info = await checkForUpdate();
    setCheckingUpdate(false);
    if (info && isNewerVersion(info.version, CURRENT_VERSION)) {
      setUpdateInfo(info);
      setShowUpdateModal(true);
    } else {
      alert('当前已是最新版本');
    }
  };

  // 未登录跳转
  useEffect(() => {
    if (!currentUser) {
      router.replace('/account');
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  const accuracy = progress.totalCount > 0
    ? Math.round((progress.totalCorrect / progress.totalCount) * 100)
    : 0;

  const handleSaveGoal = () => {
    const goal = parseInt(goalInput);
    if (goal > 0 && goal <= 200) {
      setDailyGoal(goal);
    }
    setEditingGoal(false);
  };

  const handleImport = (bankName: string, questions: Question[], categoryId?: string, chapterId?: string, sectionId?: string, bankId?: string) => {
    const bank: ImportedBank = {
      id: bankId || `bank-${Date.now()}`,
      name: bankName,
      fileName: bankName,
      categoryId: categoryId || '',
      chapterId: chapterId || 'cat-chapter-cs',
      sectionId: sectionId || undefined,
      questionCount: questions.length,
      importedAt: new Date().toLocaleDateString('zh-CN'),
    };
    addImportedQuestions(bank, questions);
  };

  // 子页面：分类管理
  if (activeSection === 'categories') {
    const chapters = categoryHierarchy
      .filter(c => c.level === 'chapter' && c.parentId === null)
      .sort((a, b) => a.order - b.order);

    return (
      <div className="px-4 pt-6 pb-4 space-y-4">
        <button onClick={() => setActiveSection(null)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 min-h-[44px]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          <span className="text-sm">返回</span>
        </button>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200">📚 题库分类管理</h2>
          <button
            onClick={() => {
              openInputModal('新建章', '', '输入新章名称', (name) => {
                closeModal();
                if (name && name.trim()) addCategory(name.trim(), null, 'chapter');
              });
            }}
            className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600"
          >
            + 新建章
          </button>
        </div>
        <div className="space-y-3">
          {chapters.map((ch) => {
            const sections = categoryHierarchy
              .filter(c => c.level === 'section' && c.parentId === ch.id)
              .sort((a, b) => a.order - b.order);
            return (
              <div key={ch.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-5 bg-emerald-500 rounded-full" />
                      <h3 className="font-semibold text-gray-800 dark:text-slate-200">{ch.name}</h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 ml-3">{ch.questionIds.length} 道题 · {sections.length} 个节</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        openInputModal(`在“${ch.name}”下新建节`, '', '输入节名称', (name) => {
                          closeModal();
                          if (name && name.trim()) addCategory(name.trim(), ch.id, 'section');
                        });
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="新建节"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                    <button
                      onClick={() => {
                        openInputModal('修改章名称', ch.name, '输入新名称', (newName) => {
                          closeModal();
                          if (newName && newName.trim()) updateCategory(ch.id, { name: newName.trim() });
                        });
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                      title="编辑"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                      onClick={() => {
                        openConfirmModal('删除章', `确定删除章“${ch.name}”及其所有节吗？`, () => {
                          closeModal();
                          removeCategory(ch.id);
                        });
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="删除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                {sections.length > 0 && (
                  <div className="ml-4 space-y-1.5 mt-2">
                    {sections.map((sec) => (
                      <div key={sec.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-1 h-4 bg-blue-500 rounded-full" />
                          <span className="text-sm text-gray-700 dark:text-slate-300">{sec.name}</span>
                          <span className="text-xs text-gray-400">{sec.questionIds.length} 题</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              openInputModal('修改节名称', sec.name, '输入新名称', (newName) => {
                                closeModal();
                                if (newName && newName.trim()) updateCategory(sec.id, { name: newName.trim() });
                              });
                            }}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-white dark:hover:bg-slate-600"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button
                            onClick={() => {
                              openConfirmModal('删除节', `确定删除节“${sec.name}”吗？`, () => {
                                closeModal();
                                removeCategory(sec.id);
                              });
                            }}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-red-400 hover:bg-white dark:hover:bg-slate-600"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 通用输入/确认弹窗（分类管理子页面） */}
        <InputModal
          isOpen={modalState.isOpen}
          title={modalState.title}
          message={modalState.message}
          defaultValue={modalState.defaultValue || ''}
          placeholder={modalState.placeholder || ''}
          mode={modalState.mode}
          onConfirm={(v) => { modalState.onConfirm(v); }}
          onCancel={closeModal}
        />
      </div>
    );
  }

  // 子页面：收藏、笔记、题库管理
  if (activeSection === 'favorites') {
    const favoriteQuestions = allQuestions.filter(q => progress.favoriteIds.includes(q.id));

    return (
      <div className="px-4 pt-6 pb-4 space-y-4">
        <button onClick={() => setActiveSection(null)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 min-h-[44px]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          <span className="text-sm">返回</span>
        </button>
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200">❤️ 我的收藏 ({progress.favoriteIds.length})</h2>
        {progress.favoriteIds.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">暂无收藏题目</p>
        ) : (
          <div className="space-y-2.5">
            {favoriteQuestions.map((fq) => (
              <div key={fq.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{fq.question || fq.id}</p>
                <p className="text-xs text-gray-400 mt-1">{fq.category}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeSection === 'notes') {
    return (
      <div className="px-4 pt-6 pb-4 space-y-4">
        <button onClick={() => setActiveSection(null)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 min-h-[44px]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          <span className="text-sm">返回</span>
        </button>
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200">📝 我的笔记 ({progress.notes.length})</h2>
        {progress.notes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">暂无笔记，学习模式下可以添加笔记</p>
        ) : (
          <div className="space-y-2.5">
            {progress.notes.map((note) => (
              <div key={note.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
                <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{note.content}</p>
                <span className="text-xs text-gray-400 mt-2 block">{note.createdAt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeSection === 'banks') {
    return (
      <div className="px-4 pt-6 pb-4 space-y-4">
        <button onClick={() => setActiveSection(null)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 min-h-[44px]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          <span className="text-sm">返回</span>
        </button>
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200">📚 已导入题库</h2>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="py-3.5 rounded-2xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 shadow-sm flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            导入 MD 题库
          </button>

          <button
            onClick={() => setShowOcrModal(true)}
            className="py-3.5 rounded-2xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 shadow-sm flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            图片导入
          </button>
        </div>

        {importedBanks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">暂无导入的题库</p>
        ) : (
          <div className="space-y-2.5">
            {importedBanks.map((bank) => (
              <div key={bank.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{bank.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{bank.questionCount} 道题 · 导入于 {bank.importedAt}</p>
                  </div>
                  <button
                    onClick={() => {
                      setDeleteConfirmState({
                        isOpen: true,
                        bankId: bank.id,
                        bankName: bank.name,
                        questionCount: bank.questionCount,
                      });
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="删除题库"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
  
        <OcrImportModal
          isOpen={showOcrModal}
          onClose={() => setShowOcrModal(false)}
          onImport={handleImport}
        />

        {/* 通用输入/确认弹窗（题库管理子页面） */}
        <InputModal
          isOpen={modalState.isOpen}
          title={modalState.title}
          message={modalState.message}
          defaultValue={modalState.defaultValue || ''}
          placeholder={modalState.placeholder || ''}
          mode={modalState.mode}
          onConfirm={(v) => { modalState.onConfirm(v); }}
          onCancel={closeModal}
        />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* 用户信息 - 点击头像进入账号管理 */}
      <button
        onClick={() => router.push('/account/manage')}
        className="w-full flex items-center gap-4 text-left"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-3xl shadow-lg shadow-emerald-200">
          {PRESET_AVATARS[currentUser.avatar] || '🦊'}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-800 dark:text-slate-200">{currentUser.nickname}</h2>
          <p className="text-xs text-gray-400 mt-0.5">点击管理账号 →</p>
        </div>
      </button>

      {/* 数据统计 */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center shadow-sm border border-gray-100 dark:border-slate-700">
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{progress.totalCount}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">总刷题</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center shadow-sm border border-gray-100 dark:border-slate-700">
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{accuracy}%</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">正确率</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center shadow-sm border border-gray-100 dark:border-slate-700">
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{progress.streak}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">连续打卡</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center shadow-sm border border-gray-100 dark:border-slate-700">
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{progress.todayCount}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">今日完成</p>
        </div>
      </div>

      {/* 学习功能区 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 px-1">学习工具</h3>

        {/* 导入题库 - 醒目入口 */}
        <button
          onClick={() => setShowImportModal(true)}
          className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-2xl p-4 shadow-lg shadow-violet-200 flex items-center justify-between min-h-[52px] hover:shadow-xl transition-all card-hover"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-lg">📥</span>
            <span className="text-sm text-white font-medium">导入题库</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-white/80">{importedBanks.length} 个题库</span>
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>

        {/* 错题本 */}
        <button
          onClick={() => router.push('/wrong-questions')}
          className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between min-h-[52px] hover:shadow-md transition-all card-hover"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </span>
            <span className="text-sm text-gray-700 dark:text-slate-200">错题本</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-red-400 font-medium">{wrongQuestions.length} 题</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>

        {/* 不会的题 */}
        <button
          onClick={() => router.push('/confused')}
          className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between min-h-[52px] hover:shadow-md transition-all card-hover"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01" />
              </svg>
            </span>
            <span className="text-sm text-gray-700 dark:text-slate-200">不会的题</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-amber-500 font-medium">{confusedQuestions.length} 题</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>

        {/* 每日复习 */}
        <button
          onClick={() => router.push('/review')}
          className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between min-h-[52px] hover:shadow-md transition-all card-hover"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </span>
            <span className="text-sm text-gray-700 dark:text-slate-200">每日复习</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-blue-500 font-medium">{todayReviewCount} 已复习</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>

        {/* 知识点库 */}
        <button
          onClick={() => router.push('/knowledge')}
          className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between min-h-[52px] hover:shadow-md transition-all card-hover"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 text-lg">📚</span>
            <span className="text-sm text-gray-700 dark:text-slate-200">知识点库</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>

        {/* 刷题记录 */}
        <button
          onClick={() => router.push('/history')}
          className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between min-h-[52px] hover:shadow-md transition-all card-hover"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </span>
            <span className="text-sm text-gray-700 dark:text-slate-200">刷题记录</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>

        {/* 收藏 */}
        <button
          onClick={() => router.push('/favorites')}
          className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between min-h-[52px] hover:shadow-md transition-all card-hover"
        >
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </span>
            <span className="text-sm text-gray-700 dark:text-slate-200">我的收藏</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-yellow-500 font-medium">{progress.favoriteIds.length} 题</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>

        {/* 笔记 */}
        <button
          onClick={() => setActiveSection('notes')}
          className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between min-h-[52px] hover:shadow-md transition-all card-hover"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📝</span>
            <span className="text-sm text-gray-700 dark:text-slate-200">我的笔记</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-400">{progress.notes.length} 条</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>
      </div>

      {/* 外观模式 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 px-1">外观模式</h3>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg">🎨</span>
            <span className="text-sm text-gray-700 dark:text-slate-200 font-medium">外观设置</span>
          </div>
          <div className="flex bg-gray-100 dark:bg-slate-700 rounded-xl p-1 gap-1">
            {([
              { value: 'light' as const, icon: '☀️', label: '亮色' },
              { value: 'dark' as const, icon: '🌙', label: '暗色' },
              { value: 'system' as const, icon: '💻', label: '跟随系统' },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  theme === opt.value
                    ? 'bg-white dark:bg-slate-600 text-gray-800 dark:text-slate-100 shadow-sm'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 设置 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 px-1">设置</h3>

        {/* 每日目标 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
          {editingGoal ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-slate-300">每日目标：</span>
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-20 px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-center text-gray-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                min={1}
                max={200}
              />
              <span className="text-sm text-gray-500 dark:text-slate-400">题</span>
              <button onClick={handleSaveGoal} className="ml-auto text-sm text-emerald-600 dark:text-emerald-400 font-medium">保存</button>
            </div>
          ) : (
            <button onClick={() => setEditingGoal(true)} className="w-full flex items-center justify-between min-h-[44px]">
              <div className="flex items-center gap-3">
                <span className="text-lg">🎯</span>
                <span className="text-sm text-gray-700 dark:text-slate-200">每日目标</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500 dark:text-slate-400">{progress.dailyGoal} 题/天</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 题库管理 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 px-1">题库管理</h3>

        <button
          onClick={() => setActiveSection('categories')}
          className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between min-h-[52px] hover:shadow-md transition-all card-hover"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📁</span>
            <span className="text-sm text-gray-700 dark:text-slate-200">题库分类管理</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-400">{categoryHierarchy.filter(c => c.level === 'chapter').length} 个章</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>

        <button
          onClick={() => setActiveSection('banks')}
          className="w-full bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between min-h-[52px] hover:shadow-md transition-all card-hover"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📚</span>
            <span className="text-sm text-gray-700 dark:text-slate-200">已导入题库</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-400">{importedBanks.length} 个</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between min-h-[52px] hover:shadow-md transition-all card-hover"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">➕</span>
              <span className="text-sm text-gray-700 dark:text-slate-200">添加题目</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-400">{customQuestions.length} 题</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>

          <button
            onClick={() => setShowOcrModal(true)}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between min-h-[52px] hover:shadow-md transition-all card-hover"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">📷</span>
              <span className="text-sm text-gray-700 dark:text-slate-200">图片导入</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        </div>
      </div>

      {/* 版本信息与检查更新 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 px-1">关于</h3>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">📦</span>
              <span className="text-sm text-gray-700 dark:text-slate-200">当前版本</span>
            </div>
            <span className="text-sm text-gray-400 dark:text-slate-500">v{CURRENT_VERSION}</span>
          </div>
          <button
            onClick={handleCheckUpdate}
            disabled={checkingUpdate}
            className="w-full mt-3 flex items-center justify-between min-h-[44px] py-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🔄</span>
              <span className="text-sm text-gray-700 dark:text-slate-200">
                {checkingUpdate ? '检查中...' : '检查更新'}
              </span>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 导入弹窗 */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

      {/* 图片导入弹窗 */}
      <OcrImportModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        onImport={handleImport}
      />

      {/* 添加题目弹窗 */}
      <AddQuestionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addCustomQuestion}
      />

      {/* 版本更新弹窗 */}
      {updateInfo && (
        <UpdateModal
          isOpen={showUpdateModal}
          versionInfo={updateInfo}
        />
      )}

      {/* 通用输入/确认弹窗 */}
      <InputModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        defaultValue={modalState.defaultValue || ''}
        placeholder={modalState.placeholder || ''}
        mode={modalState.mode}
        onConfirm={(v) => { modalState.onConfirm(v); }}
        onCancel={closeModal}
      />

      {/* 删除题库确认弹窗 */}
      <DeleteConfirmModal
        isOpen={deleteConfirmState.isOpen}
        title="删除题库？"
        message={`确定要删除【${deleteConfirmState.bankName}】吗？此操作将删除该题库中的 ${deleteConfirmState.questionCount} 道题目，且无法恢复。已导入的题库将被删除，对应的错题记录会自动清理。`}
        confirmText="确定删除"
        onConfirm={() => {
          if (deleteConfirmState.bankId) {
            removeImportedBank(deleteConfirmState.bankId);
          }
        }}
        onCancel={() => {
          setDeleteConfirmState({ isOpen: false, bankId: '', bankName: '', questionCount: 0 });
        }}
      />
    </div>
  );
}
