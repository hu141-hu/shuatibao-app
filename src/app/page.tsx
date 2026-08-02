'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/store';
import ProgressRing from '@/components/ProgressRing';
import ImportModal from '@/components/ImportModal';
import { ImportedBank, Question } from '@/types';

const categoryIcons: Record<string, string> = {
  '常识判断': '🌍',
  '逻辑推理': '🧩',
  '言语理解': '📝',
  '数量关系': '🔢',
};

const defaultIcon = '📚';

export default function HomePage() {
  const router = useRouter();
  const {
    currentUser, progress, wrongQuestions, confusedQuestions, todayReviewCount,
    addImportedQuestions, allQuestions, categoryHierarchy,
  } = useStore();
  const { resolvedTheme, setTheme } = useTheme();
  const [showImportModal, setShowImportModal] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const handleImport = (bankName: string, qs: Question[], categoryId?: string, chapterId?: string, sectionId?: string, bankId?: string) => {
    const bank: ImportedBank = {
      id: bankId || `bank-${Date.now()}`,
      name: bankName,
      fileName: bankName,
      categoryId: categoryId || '',
      chapterId: chapterId || 'cat-chapter-cs',
      sectionId: sectionId || undefined,
      questionCount: qs.length,
      importedAt: new Date().toLocaleDateString('zh-CN'),
    };
    addImportedQuestions(bank, qs);
  };

  // 未登录跳转创建账号
  useEffect(() => {
    if (!currentUser) {
      router.replace('/account');
    }
  }, [currentUser, router]);

  const dailyProgress = progress.dailyGoal > 0 ? progress.todayCount / progress.dailyGoal : 0;

  // 待复习数量 = 错题 + 不会的题（去重）
  const pendingReview = useMemo(() => {
    const wrongIds = wrongQuestions.map(w => w.questionId);
    const allIds = new Set([...wrongIds, ...confusedQuestions]);
    return allIds.size;
  }, [wrongQuestions, confusedQuestions]);

  // 章列表（顶级分类）
  const chapters = useMemo(() => {
    return categoryHierarchy
      .filter(c => c.level === 'chapter' && c.parentId === null)
      .sort((a, b) => a.order - b.order);
  }, [categoryHierarchy]);

  // 获取章下的节
  const getSections = useCallback((chapterId: string) => {
    return categoryHierarchy
      .filter(c => c.level === 'section' && c.parentId === chapterId)
      .sort((a, b) => a.order - b.order);
  }, [categoryHierarchy]);

  // 获取分类下的题目数（含子分类）
  const getCategoryQuestionCount = useCallback((catId: string) => {
    const cat = categoryHierarchy.find(c => c.id === catId);
    if (!cat) return 0;
    if (cat.level === 'chapter') {
      // 章 = 自身题目 + 所有节的题目
      const sections = getSections(catId);
      const sectionCount = sections.reduce((sum, s) => sum + s.questionIds.length, 0);
      return cat.questionIds.length + sectionCount;
    }
    return cat.questionIds.length;
  }, [categoryHierarchy, getSections]);

  const toggleExpand = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  if (!currentUser) return null;

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      {/* 搜索栏入口 */}
      <div className="flex items-center gap-2">
        <Link
          href="/search"
          className="flex-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full px-4 py-2.5 text-sm text-gray-400 dark:text-slate-500 flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>搜索题目...</span>
        </Link>
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all duration-300 theme-icon-spin"
          title={resolvedTheme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
        >
          {resolvedTheme === 'dark' ? (
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          )}
        </button>
      </div>

      {/* 顶部问候 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-slate-200">
            Hi，{currentUser.nickname} 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">今天也要加油哦！</p>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
          <span className="animate-flame text-lg">🔥</span>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{progress.streak}</span>
          <span className="text-xs text-amber-500 dark:text-amber-400">天</span>
        </div>
      </div>

      {/* 每日复习提醒 */}
      {pendingReview > 0 && (
        <Link
          href="/review"
          className="block bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 shadow-lg shadow-blue-200 hover:shadow-xl transition-all card-hover"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <div className="flex-1 text-white">
              <h3 className="font-bold text-base">今日复习提醒</h3>
              <p className="text-sm text-white/80 mt-0.5">
                {wrongQuestions.length > 0 && `${wrongQuestions.length} 道错题`}
                {wrongQuestions.length > 0 && confusedQuestions.length > 0 && ' + '}
                {confusedQuestions.length > 0 && `${confusedQuestions.length} 道不会的题`}
                {' 待复习'}
              </p>
            </div>
            <span className="text-white/60 text-xl">→</span>
          </div>
          {todayReviewCount > 0 && (
            <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/60 rounded-full transition-all"
                style={{ width: `${Math.min((todayReviewCount / Math.max(pendingReview, 1)) * 100, 100)}%` }}
              />
            </div>
          )}
        </Link>
      )}

      {/* 今日进度 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-5 transition-colors duration-300">
        <ProgressRing
          progress={dailyProgress}
          size={100}
          strokeWidth={8}
          label={`${progress.todayCount}`}
          sublabel={`/ ${progress.dailyGoal} 题`}
        />
        <div className="flex-1">
          <h2 className="font-semibold text-gray-800 dark:text-slate-200">今日刷题进度</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {dailyProgress >= 1
              ? '🎉 今日目标已达成！'
              : `还差 ${progress.dailyGoal - progress.todayCount} 题完成目标`}
          </p>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(dailyProgress * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 入口按钮 */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/quiz"
          className="bg-emerald-500 text-white rounded-2xl p-4 text-center shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors card-hover"
        >
          <span className="text-2xl block mb-1">⚡</span>
          <span className="font-bold text-sm">刷题模式</span>
          <p className="text-xs text-emerald-100 mt-0.5">限时挑战</p>
        </Link>
        <Link
          href="/study"
          className="bg-blue-500 text-white rounded-2xl p-4 text-center shadow-lg shadow-blue-200 hover:bg-blue-600 transition-colors card-hover"
        >
          <span className="text-2xl block mb-1">📖</span>
          <span className="font-bold text-sm">学习模式</span>
          <p className="text-xs text-blue-100 mt-0.5">深度学习</p>
        </Link>
        <button
          onClick={() => setShowImportModal(true)}
          className="bg-violet-500 text-white rounded-2xl p-4 text-center shadow-lg shadow-violet-200 hover:bg-violet-600 transition-colors card-hover"
        >
          <span className="text-2xl block mb-1">📥</span>
          <span className="font-bold text-sm">导入题库</span>
          <p className="text-xs text-violet-100 mt-0.5">MD / 图片</p>
        </button>
      </div>
      <p className="text-xs text-gray-400 dark:text-slate-500 text-center -mt-3">支持 MD 文件和图片导入</p>

      {/* 题库分类 - 层级结构 */}
      <div>
        <h2 className="font-semibold text-gray-800 dark:text-slate-200 mb-3">题库分类</h2>
        <div className="space-y-2.5">
          {chapters.map((chapter) => {
            const sections = getSections(chapter.id);
            const totalQ = getCategoryQuestionCount(chapter.id);
            const isExpanded = expandedChapters.has(chapter.id);
            const hasSections = sections.length > 0;

            return (
              <div key={chapter.id}>
                {/* 章级卡片 */}
                <div className="relative overflow-hidden">
                  {/* 左侧绿色色条 */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 dark:bg-emerald-400 rounded-l-2xl" />
                  <div
                    className={`bg-white dark:bg-slate-800 rounded-2xl pl-4 pr-4 py-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-all ${
                      hasSections ? 'cursor-pointer hover:shadow-md' : 'hover:shadow-md'
                    }`}
                    onClick={() => hasSections ? toggleExpand(chapter.id) : undefined}
                  >
                    <div className="flex items-center justify-between">
                      {hasSections ? (
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 dark:text-slate-200 truncate">{chapter.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            {totalQ} 道题 · {sections.length} 个节
                          </p>
                        </div>
                      ) : (
                        <Link href={`/quiz?chapterId=${chapter.id}`} className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 dark:text-slate-200 truncate">{chapter.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{totalQ} 道题</p>
                        </Link>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{categoryIcons[chapter.name] || defaultIcon}</span>
                        {hasSections && (
                          <svg
                            className={`w-5 h-5 text-gray-400 dark:text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 节级列表（展开时显示） */}
                {isExpanded && hasSections && (
                  <div className="mt-1.5 ml-4 space-y-1.5 animate-fade-in">
                    {sections.map((section) => (
                      <Link
                        key={section.id}
                        href={`/quiz?sectionId=${section.id}`}
                        className="block"
                      >
                        <div className="relative overflow-hidden">
                          {/* 左侧蓝色色条 */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 dark:bg-blue-400 rounded-l-xl" />
                          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl pl-4 pr-3 py-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 truncate">{section.name}</h4>
                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{section.questionIds.length} 道题</p>
                              </div>
                              <svg className="w-4 h-4 text-blue-400 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {/* 如果章本身也有题目，显示"章级题目"入口 */}
                    {chapter.questionIds.length > 0 && (
                      <Link
                        href={`/quiz?chapterId=${chapter.id}`}
                        className="block"
                      >
                        <div className="relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-300 dark:bg-emerald-600 rounded-l-xl" />
                          <div className="bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl pl-4 pr-3 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-emerald-700 dark:text-emerald-400 truncate">章级题目</h4>
                                <p className="text-xs text-emerald-500 dark:text-emerald-600 mt-0.5">{chapter.questionIds.length} 道题</p>
                              </div>
                              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center shadow-sm border border-gray-100 dark:border-slate-700 transition-colors duration-300">
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{progress.totalCount}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">总刷题</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center shadow-sm border border-gray-100 dark:border-slate-700 transition-colors duration-300">
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {progress.totalCount > 0 ? Math.round((progress.totalCorrect / progress.totalCount) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">正确率</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 text-center shadow-sm border border-gray-100 dark:border-slate-700 transition-colors duration-300">
          <p className="text-xl font-bold text-red-500 dark:text-red-400">{wrongQuestions.length}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">错题数</p>
        </div>
      </div>

      {/* 导入弹窗 */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />

    </div>
  );
}
