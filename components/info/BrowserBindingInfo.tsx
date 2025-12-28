'use client';

/**
 * Информационное сообщение о браузерной привязке данных
 * Показывается один раз при первом заходе
 */

import { useState, useEffect } from 'react';

export default function BrowserBindingInfo() {
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    // Показываем только один раз
    const hasSeenInfo = localStorage.getItem('cosmos_browser_binding_info_seen');
    if (!hasSeenInfo) {
      setShowInfo(true);
    }
  }, []);

  const handleClose = () => {
    setShowInfo(false);
    localStorage.setItem('cosmos_browser_binding_info_seen', 'seen');
  };

  if (!showInfo) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-slide-up">
      <div className="bg-gradient-to-br from-blue-800/90 to-indigo-900/90 backdrop-blur-md border-2 border-blue-400/50 rounded-xl p-4 sm:p-6 shadow-2xl">
        <div className="flex items-start gap-3 mb-3">
          <div className="text-3xl flex-shrink-0">💡</div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-sm sm:text-base mb-2">
              Важная информация
            </h3>
            <p className="text-white/90 text-xs sm:text-sm mb-3 leading-relaxed">
              Ваши шары на ёлке и комнаты доступны <strong>только в этом браузере</strong>.
            </p>
            <p className="text-white/80 text-xs leading-relaxed mb-4">
              Для доступа с другого устройства или браузера потребуется <strong>регистрация</strong>.
            </p>
            <button
              onClick={handleClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-xs sm:text-sm"
            >
              Понятно
            </button>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white transition-colors text-xl flex-shrink-0"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

