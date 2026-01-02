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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function VideoRoom({ roomId, currentUserId, displayName, hideHeader = false, isCollapsed = false, onToggleCollapse }: VideoRoomProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [conferenceLeft, setConferenceLeft] = useState(false);
  const [showCustomPlaceholder, setShowCustomPlaceholder] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Генерируем имя комнаты Jitsi на основе roomId
  // Используем безопасное имя (только буквы, цифры, дефисы)
  const jitsiRoomName = roomId.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();

  // Генерируем уникальный идентификатор для каждого подключения
  // Это важно, чтобы Jitsi не считал разные устройства одним пользователем
  const [uniqueSessionId] = useState(() => {
    // Генерируем уникальный ID при первом рендере (сохраняется на время сессии)
    return Math.random().toString(36).substring(2, 9);
  });

  // Имя пользователя для отображения в Jitsi
  // Добавляем уникальный идентификатор, чтобы различать разные подключения
  const userName = displayName 
    ? `${displayName} (${uniqueSessionId})` 
    : `${t('participant')} ${currentUserId.slice(-6)}-${uniqueSessionId}`;

  // URL для Jitsi Meet (используем переменную окружения или публичный сервер по умолчанию)
  const jitsiServerUrl = process.env.NEXT_PUBLIC_JITSI_SERVER_URL || 'https://meet.jit.si';
  
  // Настройки для оптимизации UI мобильной версии:
  // - Отключаем глубокие ссылки на приложения (принудительно браузер)
  // - Отключаем показ App Store ссылок
  // - Скрываем водяные знаки
  // - Принудительно открываем в браузере, минуя плейсхолдер
  const jitsiConfigParams = [
    `userInfo.displayName=${encodeURIComponent(userName)}`,
    'config.startWithVideoMuted=false',
    'config.startWithAudioMuted=false',
    'config.disableDeepLinking=true', // Отключаем ссылки на приложения
    'config.disableInviteFunctions=true', // Отключаем функции приглашения
    'config.disableThirdPartyRequests=true', // Отключаем запросы к App Store
    'config.prejoinPageEnabled=false', // ОТКЛЮЧАЕМ страницу предварительного присоединения (чтобы сразу в звонок)
    'config.enableWelcomePage=false', // Отключаем приветственную страницу
    'config.enableNoisyMicDetection=true',
    'config.enableLayerSuspension=true',
    'config.enableRemb=true',
    'config.enableTcc=true',
    'config.enableIceRestart=true',
    'config.p2p.enabled=false', // ОТКЛЮЧАЕМ P2P - может вызывать проблемы с соединением
    'config.iceTransportPolicy=all', // Разрешаем все типы соединений (TURN и STUN)
    'config.enableNoAudioDetection=true', // Включаем детекцию отсутствия аудио
    'config.enableNoisyMicDetection=true',
    'config.audioLevelsInterval=200', // Интервал проверки уровня аудио
    'config.channelLastN=10', // Количество участников для получения видео
    'interfaceConfig.SHOW_JITSI_WATERMARK=false',
    'interfaceConfig.SHOW_BRAND_WATERMARK=false',
    'interfaceConfig.SHOW_POWERED_BY=false',
    'interfaceConfig.DISABLE_DOMINANT_SPEAKER_INDICATOR=false',
    'interfaceConfig.DISABLE_FOCUS_INDICATOR=false',
    'interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","closedcaptions","desktop","fullscreen","fodeviceselection","hangup","profile","chat","recording","livestreaming","settings","videoquality","filmstrip","invite","feedback","stats","shortcuts","tileview","videobackgroundblur","download","help","mute-everyone","security"]', // Убрали raisehand - он вызывает панель с эмодзи
    'interfaceConfig.DISABLE_REACTIONS=true', // Отключаем реакции (эмодзи)
    'interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true',
    'interfaceConfig.DISABLE_PRESENCE_STATUS=true',
    'interfaceConfig.MOBILE_APP_PROMO=false', // Отключаем промо мобильного приложения
    'interfaceConfig.INITIAL_TOOLBAR_TIMEOUT=20000', // Увеличиваем время показа панели инструментов
    'interfaceConfig.TOOLBAR_TIMEOUT=4000', // Время скрытия панели инструментов
    'config.enableClosePage=true', // Включаем возможность закрыть страницу
  ].join('&');
  
  // Базовый URL для Jitsi (без параметров предварительного присоединения)
  const jitsiUrl = `${jitsiServerUrl}/${jitsiRoomName}?${jitsiConfigParams}`;
  
  // URL для прямого присоединения к конференции (без плейсхолдера)
  const jitsiDirectUrl = `${jitsiServerUrl}/${jitsiRoomName}#jitsi_meet_external_api_config=${encodeURIComponent(JSON.stringify({
    prejoinPageEnabled: false,
    enableWelcomePage: false,
    disableDeepLinking: true,
    disableInviteFunctions: true,
    disableThirdPartyRequests: true,
    startWithVideoMuted: false,
    startWithAudioMuted: false,
    userInfo: {
      displayName: userName
    }
  }))}`;

  // Определяем мобильное устройство
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // На ПК сразу скрываем кастомный плейсхолдер
      if (!mobile) {
        setShowCustomPlaceholder(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


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

  // Функция для начала видеозвонка в браузере
  const startBrowserCall = () => {
    setShowCustomPlaceholder(false);
    setIsLoading(true);
    
    // Создаем URL с ВСЕМИ параметрами для стабильного соединения и отключения плейсхолдера
    const directJoinParams = [
      ...jitsiConfigParams.split('&'),
      'config.prejoinPageEnabled=false', // ОТКЛЮЧАЕМ плейсхолдер
      'config.enableWelcomePage=false',
      'config.skipPrejoin=true',
      'config.p2p.enabled=false', // Отключаем P2P для стабильности
      'config.iceTransportPolicy=all',
      'interfaceConfig.DISABLE_REACTIONS=true', // Отключаем реакции
      'interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true',
    ].join('&');
    
    const directJoinUrl = `${jitsiServerUrl}/${jitsiRoomName}?${directJoinParams}`;
    
    // Загружаем iframe с новым URL
    if (iframeRef.current) {
      // Полностью перезагружаем iframe
      iframeRef.current.src = '';
      // Небольшая задержка для гарантированной перезагрузки
      requestAnimationFrame(() => {
        if (iframeRef.current) {
          iframeRef.current.src = directJoinUrl;
        }
      });
    }
    
    // Скрываем лоадер через задержку
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };

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

  // Обработчик сообщений от iframe (для отслеживания событий Jitsi)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Проверяем, что сообщение от нашего Jitsi сервера
      if (event.origin !== jitsiServerUrl.replace('https://', '').split('/')[0]) {
        return;
      }

      // Обрабатываем события от Jitsi
      if (event.data && typeof event.data === 'object') {
        // Если пользователь покинул конференцию
        if (event.data.type === 'video-conference-left' || event.data.event === 'video-conference-left') {
          setConferenceLeft(true);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [jitsiServerUrl]);

  return (
    <div className="h-full flex flex-col">
      {/* Глобальные стили для мобильных устройств */}
      {isMobile && (
        <style>{`
          /* Гарантируем, что кнопки в iframe доступны на мобильных */
          iframe {
            touch-action: manipulation;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
          }
          /* Увеличиваем область нажатия для кнопок на мобильных */
          @media (max-width: 768px) {
            [data-videoroom-container] button {
              min-height: 44px !important;
              min-width: 44px !important;
              touch-action: manipulation;
            }
          }
        `}</style>
      )}
      {/* Заголовок с кнопками */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-2 flex-shrink-0 relative">
          <div className="text-white font-bold text-xs sm:text-sm">{t('videoRoom')}</div>
          {/* Кнопка переподключения - по центру панельки */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <button
              onClick={() => {
                setConferenceLeft(false);
                if (iframeRef.current) {
                  iframeRef.current.src = jitsiUrl;
                }
              }}
              className="bg-gradient-to-b from-blue-600/90 via-blue-700/90 to-blue-800/90 hover:from-blue-500/90 hover:via-blue-600/90 hover:to-blue-700/90 text-white px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 touch-manipulation border border-white/20 backdrop-blur-sm shadow-md"
              style={{
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 1px 2px rgba(0, 0, 0, 0.2)',
                textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)',
              }}
              title={t('reconnect') || 'Переподключиться'}
            >
              <span className="flex items-center gap-1">
                🔄 {t('reconnect') || 'Переподключиться'}
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Кнопка свернуть/развернуть */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="bg-gradient-to-b from-slate-600/90 via-slate-700/90 to-slate-800/90 hover:from-slate-500/90 hover:via-slate-600/90 hover:to-slate-700/90 text-white px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 touch-manipulation border border-white/20 backdrop-blur-sm shadow-md"
                style={{
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 1px 2px rgba(0, 0, 0, 0.2)',
                  textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)',
                }}
                title={isCollapsed ? t('expand') || 'Развернуть' : t('collapse') || 'Свернуть'}
              >
                {isCollapsed ? (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {t('expand') || 'Развернуть'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    {t('collapse') || 'Свернуть'}
                  </span>
                )}
              </button>
            )}
            {/* Кнопка fullscreen */}
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
        </div>
      )}

      {/* Контейнер видеочата */}
      <div
        data-videoroom-container
        className={`flex-1 bg-black rounded-lg overflow-hidden relative transition-all duration-300 ${
          isCollapsed ? 'max-h-0 opacity-0' : 'opacity-100'
        }`}
        style={isCollapsed ? {} : { minHeight: '300px' }}
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
        ) : showCustomPlaceholder && isMobile ? (
          // Кастомный плейсхолдер для мобильной версии с правильным порядком элементов (компактный)
          <div className="absolute inset-0 bg-slate-800/95 backdrop-blur-md rounded-lg flex flex-col items-center justify-center z-20 p-2 sm:p-3 overflow-y-auto">
            <div className="text-center text-white/90 w-full max-w-xs">
              {/* Логотип/иконка (меньше) */}
              <div className="text-3xl sm:text-4xl mb-2">📹</div>
              
              {/* Заголовок (компактнее) */}
              <h3 className="text-sm sm:text-base font-bold mb-1.5">{t('videoRoom')}</h3>
              
              {/* Код комнаты (очень компактно) */}
              <div className="text-[10px] sm:text-xs text-white/70 mb-3 font-mono bg-slate-700/50 px-2 py-1 rounded text-center truncate">
                {jitsiRoomName}
              </div>
              
              {/* Основная кнопка - Присоединиться в браузере (ПЕРВАЯ И КРУПНАЯ, но компактная) */}
              <button
                onClick={startBrowserCall}
                className="w-full bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 text-white font-bold px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm mb-2.5 transition-all shadow-lg border border-white/20 backdrop-blur-sm"
                style={{
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.3)',
                  textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)',
                }}
              >
                {t('joinInBrowser') || 'Присоединиться в браузере'}
              </button>
              
              {/* Разделитель (компактнее) */}
              <div className="flex items-center justify-center mb-2.5">
                <div className="flex-1 border-t border-white/20"></div>
                <span className="px-2 text-[10px] text-white/50">или</span>
                <div className="flex-1 border-t border-white/20"></div>
              </div>
              
              {/* Кнопка открыть в приложении Jitsi (внизу, с пояснением, компактная) */}
              <button
                onClick={() => {
                  // Открываем в приложении Jitsi через deep link
                  const jitsiAppUrl = `org.jitsi.meet://${jitsiServerUrl.replace(/^https?:\/\//, '')}/${jitsiRoomName}`;
                  window.location.href = jitsiAppUrl;
                  // Fallback: если приложение не установлено, показываем iframe
                  setTimeout(() => {
                    startBrowserCall();
                  }, 1000);
                }}
                className="w-full bg-slate-700/80 hover:bg-slate-600/80 text-white font-semibold px-3 py-2 rounded-lg text-[10px] sm:text-xs transition-colors border border-white/10"
              >
                <div className="leading-tight">
                  {t('joinInJitsiApp') || 'Открыть в приложении Jitsi'}
                </div>
                <div className="text-[9px] sm:text-[10px] text-white/60 mt-0.5 font-normal leading-tight">
                  {t('jitsiAppNote') || '(требуется установка приложения Jitsi)'}
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <iframe
              ref={iframeRef}
              src={showCustomPlaceholder ? '' : jitsiUrl}
              allow="camera; microphone; fullscreen; speaker; display-capture"
              className="w-full h-full border-0"
              onError={(e) => {
                console.error('Ошибка загрузки iframe:', e);
                setError(t('videoRoomLoadError'));
                setIsLoading(false);
              }}
            />
          </div>
        )}
      </div>

      <div className="mt-2 text-white/50 text-[9px] sm:text-[10px] text-center flex-shrink-0">
        {t('jitsiVideoRoom')}
      </div>
    </div>
  );
}

