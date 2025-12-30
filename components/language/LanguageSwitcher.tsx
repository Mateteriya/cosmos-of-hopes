'use client';

/**
 * Компонент переключения языка интерфейса (Русский/English)
 */

import { useLanguage } from '@/components/constructor/LanguageProvider';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'ru' | 'en')}
        className="bg-slate-800/95 backdrop-blur-md border-2 border-white/30 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-white font-bold text-xs sm:text-base cursor-pointer active:border-white/50 transition-colors shadow-xl max-w-[100px] sm:max-w-none"
      >
        <option value="ru">🇷🇺 Русский</option>
        <option value="en">🇺🇸 English</option>
      </select>
    </div>
  );
}

