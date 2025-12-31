'use client';

/**
 * Компонент блока "Удалённый Новый год"
 */

import { useLanguage } from '@/components/constructor/LanguageProvider';

export default function RemoteNewYear() {
  const { t } = useLanguage();

  return (
    <div className="bg-gradient-to-br from-yellow-500/20 via-pink-500/20 to-purple-500/20 backdrop-blur-md border-2 border-yellow-400/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
            {t('remoteNewYearTitle')}
          </h2>
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <p className="text-white/90 text-sm sm:text-base md:text-lg mb-2 sm:mb-3 font-semibold">
          {t('remoteNewYearDesc')}
        </p>
        <p className="text-white/80 text-xs sm:text-sm md:text-base mb-2 sm:mb-3">
          {t('remoteNewYearFeatures')}
        </p>
        <p className="text-yellow-300 text-sm sm:text-base md:text-lg font-bold">
          {t('remoteNewYearTagline')}
        </p>
      </div>
    </div>
  );
}

