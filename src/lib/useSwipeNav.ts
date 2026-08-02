'use client';

import { useCallback, useEffect, useRef } from 'react';

export type SwipeZone = 'left-edge' | 'right-edge' | 'middle';

interface UseSwipeNavOptions {
  /** 左右边距宽度（px）：起手落在此区域内时按边距规则处理，默认 72 */
  edgeMargin?: number;
  /** 判定为滑动的最小横向位移（px），默认 60 */
  minDistance?: number;
  /** 纵向位移允许达到横向位移的倍数，超过则视为上下滚动，默认 1.2 */
  verticalSlop?: number;
  /** 中间区域左滑：下一题 */
  onNext?: () => void;
  /** 中间区域右滑：上一题 */
  onPrev?: () => void;
  /** 左边距区域左滑：返回 */
  onLeftEdgeBack?: () => void;
  /** 是否启用手势，默认 true */
  enabled?: boolean;
}

/**
 * 刷题页滑动手势：
 * - 中间区域：左滑 = 下一题，右滑 = 上一题
 * - 左边距区域：左滑 = 返回，右滑 = 无效
 * - 右边距区域：右滑 = 无效，左滑 = 下一题（与中间区域一致）
 * - 滑动本身不触发答题、不显示答案（答案状态由页面自行控制）
 */
export function useSwipeNav<T extends HTMLElement = HTMLDivElement>({
  edgeMargin = 72,
  minDistance = 60,
  verticalSlop = 1.2,
  onNext,
  onPrev,
  onLeftEdgeBack,
  enabled = true,
}: UseSwipeNavOptions) {
  const ref = useRef<T>(null);

  const touchStartRef = useRef<{ x: number; y: number; zone: SwipeZone } | null>(null);

  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  const onLeftEdgeBackRef = useRef(onLeftEdgeBack);
  useEffect(() => {
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;
    onLeftEdgeBackRef.current = onLeftEdgeBack;
  }, [onNext, onPrev, onLeftEdgeBack]);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      if (!touch) return;
      const x = touch.clientX;
      const width = window.innerWidth;
      const zone: SwipeZone = x < edgeMargin ? 'left-edge' : x > width - edgeMargin ? 'right-edge' : 'middle';
      touchStartRef.current = { x, y: touch.clientY, zone };
    },
    [enabled, edgeMargin]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || !enabled) return;

      const changed = e.changedTouches[0];
      if (!changed) return;

      const dx = changed.clientX - start.x;
      const dy = changed.clientY - start.y;

      // 位移太小：视为点击/轻触
      if (Math.abs(dx) < minDistance) return;
      // 纵向位移过大：视为上下滚动
      if (Math.abs(dy) > Math.abs(dx) * verticalSlop) return;

      const isLeft = dx < 0;

      if (start.zone === 'left-edge') {
        // 左边距区域：左滑返回，右滑无效
        if (isLeft) onLeftEdgeBackRef.current?.();
        return;
      }

      if (start.zone === 'right-edge') {
        // 右边距区域：右滑无效，左滑照常下一题
        if (isLeft) onNextRef.current?.();
        return;
      }

      // 中间区域：左滑下一题，右滑上一题
      if (isLeft) onNextRef.current?.();
      else onPrevRef.current?.();
    },
    [enabled, minDistance, verticalSlop]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return ref;
}
