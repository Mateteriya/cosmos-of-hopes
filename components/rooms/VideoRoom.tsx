'use client';

/**
 * Видеокомната на базе Jitsi Meet
 * Использует встраивание через iframe для простоты и надежности
 */

import { useState, useEffect, useRef } from 'react';

interface VideoRoomProps {
  roomId: string;
  currentUserId: string;
  displayName?: string;
}

export default function VideoRoom({ roomId, currentUserId, displayName }: VideoRoomProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Генерируем имя комнаты Jitsi на основе roomId
  // Используем безопасное имя (только буквы, цифры, дефисы)
  const jitsiRoomName = roomId.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();

  // Имя пользователя для отображения в Jitsi
  const userName = displayName || `Участник ${currentUserId.slice(-6)}`;

  // URL для Jitsi Meet (используем публичный сервер)
  const jitsiUrl = `https://meet.jit.si/${jitsiRoomName}?userInfo.displayName=${encodeURIComponent(userName)}&config.startWithVideoMuted=false&config.startWithAudioMuted=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_BRAND_WATERMARK=false&interfaceConfig.SHOW_POWERED_BY=false`;

  useEffect(() => {
    // Загружаем скрипт Jitsi для управления iframe (опционально)
    setIsLoading(true);
    
    // Простой таймер для индикации загрузки
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (error) {
    return (
      <div className="bg-red-900/50 backdrop-blur-md border-2 border-red-500/50 rounded-lg p-4">
        <div className="text-red-200 font-bold text-sm mb-2">❌ Ошибка загрузки видеокомнаты</div>
        <div className="text-red-300 text-xs">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
        >
          Перезагрузить
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg p-2 sm:p-3 lg:p-4">
      <div className="text-white font-bold text-xs sm:text-sm mb-2 sm:mb-3">📹 Видеокомната</div>
      
      {isLoading && (
        <div className="bg-slate-700/50 rounded-lg p-8 flex items-center justify-center min-h-[300px]">
          <div className="text-center text-white/70">
            <div className="text-4xl mb-4 animate-pulse">📹</div>
            <div className="text-sm">Загрузка видеокомнаты...</div>
          </div>
        </div>
      )}

      <div className={`relative bg-black rounded-lg overflow-hidden ${isLoading ? 'hidden' : ''}`} style={{ minHeight: '400px' }}>
        <iframe
          ref={iframeRef}
          src={jitsiUrl}
          allow="camera; microphone; fullscreen; speaker; display-capture"
          className="w-full h-full min-h-[400px] border-0"
          style={{ minHeight: '400px' }}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError('Не удалось загрузить видеокомнату. Проверьте подключение к интернету.');
            setIsLoading(false);
          }}
        />
      </div>

      <div className="mt-2 text-white/50 text-[9px] sm:text-[10px] text-center">
        Видеокомната Jitsi Meet
      </div>
    </div>
  );
}

