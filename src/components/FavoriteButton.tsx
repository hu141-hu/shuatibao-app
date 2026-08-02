'use client';

import { useState, useCallback } from 'react';
import { useStore } from '@/lib/store';

interface FavoriteButtonProps {
  questionId: string;
  size?: 'sm' | 'md';
}

export default function FavoriteButton({ questionId, size = 'md' }: FavoriteButtonProps) {
  const { progress, toggleFavorite } = useStore();
  const isFavorite = progress.favoriteIds.includes(questionId);
  const [animating, setAnimating] = useState(false);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setAnimating(true);
    toggleFavorite(questionId);
    setTimeout(() => setAnimating(false), 400);
  }, [questionId, toggleFavorite]);

  const dimension = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <button
      onClick={handleClick}
      className={`${dimension} rounded-full flex items-center justify-center transition-all ${
        isFavorite
          ? 'text-yellow-500'
          : 'text-gray-300 dark:text-slate-600 hover:text-yellow-400 dark:hover:text-yellow-500'
      } ${animating ? 'animate-favorite' : ''}`}
      title={isFavorite ? '取消收藏' : '收藏'}
    >
      <svg
        className={iconSize}
        viewBox="0 0 24 24"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    </button>
  );
}
