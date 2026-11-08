'use client';

/**
 * 页面级返回拦截器
 *
 * 硬件返回键的默认行为是「有历史就回退，没历史就退出 App」。
 * 但像刷题页这种「章 → 节 → 知识点 → 答题」的多级结构，
 * 用户期望的是逐级往上退，而不是直接离开当前页。
 *
 * 页面可以注册一个拦截器：返回 true 表示这一级返回我已经处理掉了，
 * 全局的返回逻辑就不再执行。
 */

type BackInterceptor = () => boolean;

let current: BackInterceptor | null = null;

export function registerBackInterceptor(fn: BackInterceptor): () => void {
  current = fn;
  return () => {
    if (current === fn) current = null;
  };
}

export function runBackInterceptor(): boolean {
  if (!current) return false;
  try {
    return current() === true;
  } catch {
    return false;
  }
}
