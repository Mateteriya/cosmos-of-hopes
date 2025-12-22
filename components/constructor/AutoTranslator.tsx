'use client';

import { useState } from 'react';
import { useLanguage } from './LanguageProvider';

/**
 * Компонент для автоматического перевода страницы
 * Предлагает несколько вариантов перевода для пользователей из других стран
 */
export function AutoTranslator() {
  const { language, t } = useLanguage();
  const [showOptions, setShowOptions] = useState(false);

  // Функция для перевода через Google Translate
  const translateWithGoogle = (targetLang: string) => {
    const currentUrl = window.location.href;
    const googleTranslateUrl = `https://translate.google.com/translate?sl=auto&tl=${targetLang}&u=${encodeURIComponent(currentUrl)}`;
    window.open(googleTranslateUrl, '_blank');
  };

  // Функция для перевода через Yandex Translate (если доступен)
  const translateWithYandex = (targetLang: string) => {
    const currentUrl = window.location.href;
    // Yandex Translate не имеет прямого виджета для перевода страниц, но можно использовать их API
    // Для простоты - просто ссылка на их сервис
    const yandexUrl = `https://translate.yandex.com/?lang=${targetLang}&url=${encodeURIComponent(currentUrl)}`;
    window.open(yandexUrl, '_blank');
  };

  // Популярные языки для быстрого доступа
  const popularLanguages = [
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'he', name: 'עברית', flag: '🇮🇱' },
  ];

  const translations = {
    ru: {
      title: 'Перевести страницу',
      subtitle: 'Не понимаете русский или английский?',
      googleTranslate: 'Перевести через Google',
      yandexTranslate: 'Перевести через Yandex',
      selectLanguage: 'Выберите язык',
      orUseBrowser: 'Или используйте переводчик в вашем браузере',
    },
    en: {
      title: 'Translate page',
      subtitle: "Don't understand Russian or English?",
      googleTranslate: 'Translate via Google',
      yandexTranslate: 'Translate via Yandex',
      selectLanguage: 'Select language',
      orUseBrowser: 'Or use your browser translator',
    },
  };

  const currentTranslations = translations[language];

  return (
    <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50">
      <div className="relative">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold p-2 sm:p-2.5 rounded-lg shadow-xl transition-all transform hover:scale-105 flex items-center justify-center"
          style={{ backgroundColor: '#2563eb', background: 'linear-gradient(to right, #2563eb, #9333ea)', minWidth: '40px', minHeight: '40px' }}
          title={currentTranslations.title}
        >
          <span className="text-lg sm:text-xl">🌐</span>
        </button>

        {showOptions && (
          <div className="absolute top-full right-0 mt-2 w-[320px] bg-slate-800/95 backdrop-blur-md rounded-lg border-2 border-blue-500/40 shadow-xl p-4 z-50">
            <div className="text-white/90 text-sm font-bold mb-2">
              {currentTranslations.subtitle}
            </div>
            
            {/* Быстрый выбор популярных языков */}
            <div className="mb-3">
              <div className="text-white/70 text-xs mb-2">{currentTranslations.selectLanguage}:</div>
              <div className="grid grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto">
                {popularLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      translateWithGoogle(lang.code);
                      setShowOptions(false);
                    }}
                    className="p-2 bg-slate-700/50 hover:bg-blue-600/50 rounded text-white text-xs flex flex-col items-center gap-1 transition-colors"
                    title={`${lang.name} (${lang.code})`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-[9px]">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Кнопки переводчиков */}
            <div className="space-y-2 border-t border-white/20 pt-2">
              <button
                onClick={() => {
                  translateWithGoogle('auto');
                  setShowOptions(false);
                }}
                className="w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span>🔍</span>
                {currentTranslations.googleTranslate}
              </button>
              
              <button
                onClick={() => {
                  translateWithYandex('auto');
                  setShowOptions(false);
                }}
                className="w-full p-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span>🔍</span>
                {currentTranslations.yandexTranslate}
              </button>
            </div>

            <div className="mt-2 text-white/50 text-[9px] italic text-center">
              {currentTranslations.orUseBrowser}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

