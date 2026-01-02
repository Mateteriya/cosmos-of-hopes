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
        className="bg-slate-800/95 backdrop-blur-md border-2 border-white/30 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-white font-semibold text-xs sm:text-base cursor-pointer active:border-white/50 transition-all duration-300 shadow-xl max-w-[100px] sm:max-w-none hover:border-cyan-400/80 hover:bg-slate-700/95 hover:shadow-cyan-400/30 font-[var(--font-inter)] tracking-wide"
        style={{
          fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
          letterSpacing: '0.025em',
        }}
      >
        <option 
          value="ru" 
          className="bg-slate-800 text-white font-semibold"
          style={{
            fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
          }}
        >
          {isMobile ? '🇷🇺 Рус' : '🇷🇺 Русский'}
        </option>
        <option 
          value="en"
          className="bg-slate-800 text-white font-semibold"
          style={{
            fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
          }}
        >
          {isMobile ? '🇺🇸 Eng' : '🇺🇸 English'}
        </option>
      </select>
    </div>
  );
}

