'use client';

/**
 * Компонент таймера до Нового года с гибридной синхронизацией
 * Использует API для точного времени + локальный fallback
 */

import { useState, useEffect } from 'react';

interface NewYearTimerProps {
  midnightUTC: string; // ISO timestamp полночи в UTC
  timezone: string; // Часовой пояс комнаты
}

export default function NewYearTimer({ midnightUTC, timezone }: NewYearTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Синхронизация с сервером каждые 5 минут
  useEffect(() => {
    const syncWithServer = async () => {
      try {
        setIsSyncing(true);
        const response = await fetch('/api/time');
        if (response.ok) {
          const data = await response.json();
          const serverTime = new Date(data.timestamp).getTime();
          const localTime = Date.now();
          setServerTimeOffset(serverTime - localTime);
        }
      } catch (error) {
        console.warn('Не удалось синхронизировать время с сервером:', error);
      } finally {
        setIsSyncing(false);
      }
    };

    syncWithServer();
    const syncInterval = setInterval(syncWithServer, 5 * 60 * 1000); // Каждые 5 минут

    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      // Используем серверное время с offset или локальное как fallback
      const now = new Date(Date.now() + serverTimeOffset);
      const midnight = new Date(midnightUTC);
      const diff = midnight.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [midnightUTC, serverTimeOffset]);

  if (!timeLeft) {
    return (
      <div className="text-white text-center">
        <div className="text-sm font-bold flex items-center justify-center gap-2">
          <div className="animate-spin w-3 h-3 border border-white/30 border-t-white rounded-full"></div>
          Загрузка...
        </div>
      </div>
    );
  }

  const isNewYear = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div className="bg-gradient-to-r from-purple-600/40 via-pink-600/40 to-purple-600/40 backdrop-blur-md border border-white/30 rounded-lg p-2 text-center shadow-lg relative">
      {isSyncing && (
        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" title="Синхронизация времени"></div>
      )}
      {isNewYear ? (
        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl">🎉</div>
          <div className="text-sm sm:text-base font-bold text-white">С НОВЫМ ГОДОМ!</div>
          <div className="text-xs text-white/80">✨</div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-white/90 text-[10px] sm:text-xs uppercase tracking-wider font-medium">
            До Нового года
          </div>
          <div className="grid grid-cols-4 gap-1">
            <div className="bg-white/15 backdrop-blur-sm rounded p-1 border border-white/20 min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white leading-tight">{timeLeft.days}</div>
              <div className="text-[8px] text-white/70 uppercase">Дней</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded p-1 border border-white/20 min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white leading-tight">{timeLeft.hours}</div>
              <div className="text-[8px] text-white/70 uppercase">Часов</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded p-1 border border-white/20 min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white leading-tight">{timeLeft.minutes}</div>
              <div className="text-[8px] text-white/70 uppercase">Минут</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded p-1 border border-white/20 min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white leading-tight">{timeLeft.seconds}</div>
              <div className="text-[8px] text-white/70 uppercase">Секунд</div>
            </div>
          </div>
          <div className="text-white/60 text-[9px]">
            {timezone}
          </div>
        </div>
      )}
    </div>
  );
}
