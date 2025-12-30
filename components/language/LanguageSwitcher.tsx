'use client';

/**
 * Компонент переключения языка интерфейса (Русский/English)
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/constructor/LanguageProvider';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    };
    
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  return (
    <div className="relative">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'ru' | 'en')}
        className="bg-slate-800/95 backdrop-blur-md border-2 border-white/30 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-white font-bold text-xs sm:text-base cursor-pointer active:border-white/50 transition-colors shadow-xl max-w-[100px] sm:max-w-none"
      >
        <option value="ru">{isMobile ? 'Рус' : '🇷🇺 Русский'}</option>
        <option value="en">{isMobile ? 'Eng' : '🇺🇸 English'}</option>
      </select>
    </div>
  );
}

