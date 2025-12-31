'use client';

/**
 * Видеокомната на базе Jitsi Meet
 * Использует встраивание через iframe для простоты и надежности
 */

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/components/constructor/LanguageProvider';

interface VideoRoomProps {
  roomId: string;
  currentUserId: string;
  displayName?: string;
  hideHeader?: boolean;
}

export default function VideoRoom({ roomId, currentUserId, displayName, hideHeader = false }: VideoRoomProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [conferenceLeft, setConferenceLeft] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Генерируем имя комнаты Jitsi на основе roomId
  // Используем безопасное имя (только буквы, цифры, дефисы)
  const jitsiRoomName = roomId.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();

  // Имя пользователя для отображения в Jitsi
  const userName = displayName || `${t('participant')} ${currentUserId.slice(-6)}`;

  // URL для Jitsi Meet (используем переменную окружения или публичный сервер по умолчанию)
  const jitsiServerUrl = process.env.NEXT_PUBLIC_JITSI_SERVER_URL || 'https://meet.jit.si';
  // Настройки для скрытия водяных знаков и настройки меню
  const jitsiUrl = `${jitsiServerUrl}/${jitsiRoomName}?userInfo.displayName=${encodeURIComponent(userName)}&config.startWithVideoMuted=false&config.startWithAudioMuted=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_BRAND_WATERMARK=false&interfaceConfig.SHOW_POWERED_BY=false&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","closedcaptions","desktop","fullscreen","fodeviceselection","hangup","profile","chat","recording","livestreaming","settings","raisehand","videoquality","filmstrip","invite","feedback","stats","shortcuts","tileview","videobackgroundblur","download","help","mute-everyone","security"]`;

  useEffect(() => {
    setIsLoading(true);
    
    // Показываем наш лоадер дольше, чтобы скрыть Jitsi плейсхолдер (обычно 2-4 секунды)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [jitsiUrl]);

  if (error) {
    return (
      <div className="bg-red-900/50 backdrop-blur-md border-2 border-red-500/50 rounded-lg p-4">
        <div className="text-red-200 font-bold text-sm mb-2">{t('videoRoomError')}</div>
        <div className="text-red-300 text-xs">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
        >
          {t('reload')}
        </button>
      </div>
    );
  }

  const toggleFullscreen = () => {
    const container = document.querySelector('[data-videoroom-container]');
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Слушаем изменения полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Заголовок с кнопкой fullscreen */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <div className="text-white font-bold text-xs sm:text-sm">{t('videoRoom')}</div>
          <button
            onClick={toggleFullscreen}
            className="bg-slate-700/80 hover:bg-slate-600 text-white p-1.5 rounded transition-colors touch-manipulation"
            title={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 3l-6 6m0 0V4m0 5h5M3 21l6-6m0 0v5m0-5H4" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Контейнер видеочата */}
      <div
        data-videoroom-container
        className="flex-1 bg-black rounded-lg overflow-hidden relative"
        style={{ minHeight: '300px' }}
      >
        {isLoading ? (
          <div className="absolute inset-0 bg-slate-800/95 backdrop-blur-md rounded-lg flex items-center justify-center z-20">
            <div className="text-center text-white/80">
              <div className="text-4xl mb-4 animate-pulse">📹</div>
              <div className="text-sm font-semibold">{t('loadingVideoRoom')}</div>
            </div>
          </div>
        ) : conferenceLeft ? (
          <div className="absolute inset-0 bg-slate-800/95 backdrop-blur-md rounded-lg flex items-center justify-center z-20">
            <div className="text-center text-white/80">
              <div className="text-4xl mb-4">📞</div>
              <div className="text-sm font-semibold mb-4">{t('conferenceEnded')}</div>
              <button
                onClick={() => {
                  setConferenceLeft(false);
                  if (iframeRef.current) {
                    iframeRef.current.src = jitsiUrl;
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
              >
                {t('rejoinConference')}
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <iframe
              ref={iframeRef}
              src={jitsiUrl}
              allow="camera; microphone; fullscreen; speaker; display-capture"
              className="w-full h-full border-0"
              onError={(e) => {
                console.error('Ошибка загрузки iframe:', e);
                setError(t('videoRoomLoadError'));
                setIsLoading(false);
              }}
            />
            {/* Кнопка завершения звонка в нашем интерфейсе */}
            {!hideHeader && (
              <button
                onClick={() => setConferenceLeft(true)}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded text-xs z-30 transition-colors"
                title={t('endCall') || 'Завершить звонок'}
              >
                {t('endCall') || 'Завершить'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 text-white/50 text-[9px] sm:text-[10px] text-center flex-shrink-0">
        {t('jitsiVideoRoom')}
      </div>
    </div>
  );
}

