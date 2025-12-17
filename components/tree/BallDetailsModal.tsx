'use client';

/**
 * Модальное окно с деталями шара
 * Показывает дизайн, желание, данные пользователя
 */

import { useEffect } from 'react';
import type { Toy } from '@/types/toy';
import { useLanguage } from '../constructor/LanguageProvider';

interface BallDetailsModalProps {
  toy: Toy | null;
  onClose: () => void;
}

export default function BallDetailsModal({ toy, onClose }: BallDetailsModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    if (toy) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [toy]);

  if (!toy) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-slate-800 via-purple-900 to-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">
            {t('wish')} ✨
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Изображение шара */}
        {toy.image_url && (
          <div className="mb-4 flex justify-center">
            <img
              src={toy.image_url}
              alt="Ball design"
              className="max-w-xs max-h-64 rounded-lg shadow-xl border-2 border-white/20"
            />
          </div>
        )}

        {/* Желание */}
        {toy.wish_text && (
          <div className="mb-4">
            <h3 className="text-sm font-black text-white/90 mb-2 uppercase tracking-wider">
              {t('wish')}:
            </h3>
            <p className="text-white/80 text-base leading-relaxed bg-white/5 p-4 rounded-lg border border-white/10">
              {toy.wish_text}
            </p>
          </div>
        )}

        {/* Пожелание другим */}
        {toy.wish_for_others && (
          <div className="mb-4">
            <h3 className="text-sm font-black text-white/90 mb-2 uppercase tracking-wider">
              {t('wishForOthers')}:
            </h3>
            <p className="text-white/80 text-base leading-relaxed bg-white/5 p-4 rounded-lg border border-white/10">
              {toy.wish_for_others}
            </p>
          </div>
        )}

        {/* Фото пользователя */}
        {toy.user_photo_url && (
          <div className="mb-4">
            <h3 className="text-sm font-black text-white/90 mb-2 uppercase tracking-wider">
              {t('photo')}:
            </h3>
            <div className="flex justify-center">
              <img
                src={toy.user_photo_url}
                alt="User photo"
                className="max-w-xs max-h-48 rounded-lg shadow-xl border-2 border-white/20"
              />
            </div>
          </div>
        )}

        {/* Данные пользователя */}
        <div className="grid grid-cols-2 gap-4 text-sm">
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

        {/* Счётчик поддержек */}
        {toy.support_count !== undefined && toy.support_count > 0 && (
          <div className="mt-4 text-center">
            <span className="text-2xl">❤️</span>
            <span className="text-white/90 font-bold text-lg ml-2">
              {toy.support_count} {t('supports') || 'поддержек'}
            </span>
          </div>
        )}

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

