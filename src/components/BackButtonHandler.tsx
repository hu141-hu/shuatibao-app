'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { runBackInterceptor } from '@/lib/backHandler';

/**
 * 安卓硬件返回键
 *
 * 优先级：
 *   1. 当前页面自己处理（刷题页逐级回退）
 *   2. 浏览器历史里有上一页 → 回退
 *   3. 不在首页 → 回首页
 *   4. 首页 → 连按两次才退出（避免误触直接退回桌面）
 */
export default function BackButtonHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const lastBackAt = useRef(0);
  const [hint, setHint] = useState('');

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let remove: (() => void) | null = null;
    let disposed = false;

    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('backButton', ({ canGoBack }) => {
          // 1. 页面内部的层级回退
          if (runBackInterceptor()) return;

          // 2. 有历史就回上一页
          const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
          if (canGoBack || idx > 0) {
            router.back();
            return;
          }

          // 3. 不在首页就先回首页，不直接退出
          if (pathRef.current !== '/') {
            router.replace('/');
            return;
          }

          // 4. 已经在首页：连按两次才退出
          const now = Date.now();
          if (now - lastBackAt.current < 2000) {
            App.exitApp();
          } else {
            lastBackAt.current = now;
            setHint('再按一次返回退出');
            setTimeout(() => setHint(''), 1800);
          }
        });

        if (disposed) {
          handle.remove();
        } else {
          remove = () => handle.remove();
        }
      } catch {
        // 插件不可用（比如浏览器环境）时交给 Capacitor 默认行为
      }
    })();

    return () => {
      disposed = true;
      remove?.();
    };
  }, [router]);

  if (!hint) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-black/75 text-white text-sm pointer-events-none animate-fade-in">
      {hint}
    </div>
  );
}
