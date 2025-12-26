'use client';

/**
 * Модальное окно с деталями шара
 * Показывает дизайн, желание, данные пользователя
 */

import { useEffect, useState } from 'react';
import type { Toy } from '@/types/toy';
import { useLanguage } from '../constructor/LanguageProvider';
import { hasUserLikedToy, addSupport, removeSupport, getToyLikesCount } from '@/lib/toys';

interface BallDetailsModalProps {
  toy: Toy | null;
  onClose: () => void;
  currentUserId?: string;
  onLikeChange?: (toyId: string, newLikesCount: number) => void;
}

export default function BallDetailsModal({ toy, onClose, currentUserId, onLikeChange }: BallDetailsModalProps) {
  const { t } = useLanguage();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(toy?.support_count || 0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (toy) {
      document.body.style.overflow = 'hidden';
      loadLikeStatus();
      loadLikesCount();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [toy, currentUserId]);

  const loadLikeStatus = async () => {
    if (!toy || !currentUserId) return;
    try {
      const liked = await hasUserLikedToy(toy.id, currentUserId);
      setIsLiked(liked);
    } catch (err) {
      console.error('Ошибка проверки лайка:', err);
    }
  };

  const loadLikesCount = async () => {
    if (!toy) return;
    try {
      const count = await getToyLikesCount(toy.id);
      setLikesCount(count);
    } catch (err) {
      console.error('Ошибка загрузки количества лайков:', err);
    }
  };

  const handleLike = async () => {
    if (!toy || !currentUserId || isLoading) return;
    
    setIsLoading(true);
    try {
      if (isLiked) {
        // Убираем лайк
        await removeSupport(toy.id, currentUserId);
        setIsLiked(false);
        const newCount = Math.max(0, likesCount - 1);
        setLikesCount(newCount);
        onLikeChange?.(toy.id, newCount);
      } else {
        // Добавляем лайк
        await addSupport(toy.id, currentUserId);
        setIsLiked(true);
        const newCount = likesCount + 1;
        setLikesCount(newCount);
        onLikeChange?.(toy.id, newCount);
      }
    } catch (err) {
      // Игнорируем ошибки - функции уже обработали их корректно
      // Не показываем ошибку пользователю, так как это может быть проблема подключения
      if (process.env.NODE_ENV === 'development') {
        console.warn('Ошибка изменения лайка (игнорируется):', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!toy) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-slate-800 via-purple-900 to-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border-2 border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
            {t('wish')} ✨
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl sm:text-3xl leading-none touch-manipulation p-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Изображение шара */}
        {toy.image_url && (
          <div className="mb-3 sm:mb-4 flex justify-center">
            <img
              src={toy.image_url}
              alt="Ball design"
              className="max-w-[240px] sm:max-w-xs max-h-48 sm:max-h-64 rounded-lg shadow-xl border-2 border-white/20"
            />
          </div>
        )}

        {/* Желание */}
        {toy.wish_text && (
          <div className="mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-black text-white/90 mb-1.5 sm:mb-2 uppercase tracking-wider">
              {t('wish')}:
            </h3>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed bg-white/5 p-3 sm:p-4 rounded-lg border border-white/10">
              {toy.wish_text}
            </p>
          </div>
        )}

        {/* Пожелание другим */}
        {toy.wish_for_others && (
          <div className="mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-black text-white/90 mb-1.5 sm:mb-2 uppercase tracking-wider">
              {t('wishForOthers')}:
            </h3>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed bg-white/5 p-3 sm:p-4 rounded-lg border border-white/10">
              {toy.wish_for_others}
            </p>
          </div>
        )}

        {/* Фото пользователя */}
        {toy.user_photo_url && (
          <div className="mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-black text-white/90 mb-1.5 sm:mb-2 uppercase tracking-wider">
              {t('photo')}:
            </h3>
            <div className="flex justify-center">
              <img
                src={toy.user_photo_url}
                alt="User photo"
                className="max-w-[200px] sm:max-w-xs max-h-40 sm:max-h-48 rounded-lg shadow-xl border-2 border-white/20"
              />
            </div>
          </div>
        )}

        {/* Данные пользователя */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
          {toy.user_name && (
            <div>
              <span className="text-white/60 text-xs uppercase tracking-wider">
                {t('nameOrNickname')}:
              </span>
              <p className="text-white/90 font-semibold">{toy.user_name}</p>
            </div>
          )}
          {toy.selected_country && (
            <div>
              <span className="text-white/60 text-xs uppercase tracking-wider">
                {t('selectCountry')}:
              </span>
              <p className="text-white/90 font-semibold">{toy.selected_country}</p>
            </div>
          )}
          {toy.birth_year && (
            <div>
              <span className="text-white/60 text-xs uppercase tracking-wider">
                {t('yourAge')}:
              </span>
              <p className="text-white/90 font-semibold">
                {new Date().getFullYear() - toy.birth_year} {t('years') || 'лет'}
              </p>
            </div>
          )}
        </div>

        {/* Счётчик поддержек и кнопка лайка */}
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">❤️</span>
            <span className="text-white/90 font-bold text-lg">
              {likesCount} {t('supports') || 'поддержек'}
            </span>
          </div>
          
          {/* Кнопка лайка (показываем только если есть currentUserId) */}
          {currentUserId && (
            <button
              onClick={handleLike}
              disabled={isLoading}
              className={`px-6 py-2 rounded-lg font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                isLiked
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-pink-600 hover:bg-pink-700 text-white'
              }`}
            >
              {isLiked ? `❤️ ${t('unlike')}` : `🤍 ${t('like')}`}
            </button>
          )}
        </div>

        {/* Кнопка закрытия */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all transform hover:scale-105"
          >
            {t('close') || 'Закрыть'}
          </button>
        </div>
      </div>
    </div>
  );
}

