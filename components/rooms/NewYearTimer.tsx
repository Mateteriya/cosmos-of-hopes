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

  // ОНЛАЙН СИНХРОНИЗАЦИЯ: каждые 5 минут проверяем точное время в интернете
  useEffect(() => {
    const syncWithInternet = async () => {
      try {
        setIsSyncing(true);
        const localTimeBefore = Date.now(); // Системное время устройства ДО запроса
        
        const response = await fetch('/api/time');
        
        const localTimeAfter = Date.now(); // Системное время устройства ПОСЛЕ запроса
        const localTimeAvg = (localTimeBefore + localTimeAfter) / 2; // Среднее время для компенсации задержки сети
        
        if (response.ok) {
          const data = await response.json();
          const internetTime = new Date(data.timestamp).getTime(); // Точное время из интернета
          
          // Вычисляем offset: разница между временем из интернета и системным временем устройства
          // Если internetTime > localTime, значит устройство отстает, offset положительный
          // Если internetTime < localTime, значит устройство спешит, offset отрицательный
          const offset = internetTime - localTimeAvg;
          
          // Отладочная информация
          console.log('Синхронизация времени:', {
            internetTime: new Date(internetTime).toISOString(),
            localTimeAvg: new Date(localTimeAvg).toISOString(),
            offset,
            offsetSeconds: offset / 1000,
          });
          
          setServerTimeOffset(offset);
        }
      } catch (error) {
        console.error('Ошибка синхронизации времени с интернетом:', error);
        // В онлайн приложении это не должно происходить, но на всякий случай оставляем offset = 0
        setServerTimeOffset(0);
      } finally {
        setIsSyncing(false);
      }
    };

    // Синхронизируем сразу при загрузке
    syncWithInternet();
    
    // Затем каждые 5 минут
    const syncInterval = setInterval(syncWithInternet, 5 * 60 * 1000);

    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      // ОНЛАЙН ПОДХОД:
      // 1. Используем системное время устройства (Date.now())
      // 2. Корректируем его на offset, полученный из интернета (serverTimeOffset)
      // 3. Каждые 5 минут синхронизируемся с интернетом для точности
      // 4. ВАЖНО: сравниваем время в нужном часовом поясе!
      
      const systemTime = Date.now(); // Системное время устройства (UTC timestamp)
      const correctedTime = systemTime + serverTimeOffset; // Время с коррекцией из интернета (UTC timestamp)
      
      // Полночь в нужном timezone (уже в UTC)
      // ВАЖНО: убеждаемся, что парсим как UTC (добавляем Z если его нет)
      const midnightUTCString = midnightUTC.endsWith('Z') ? midnightUTC : midnightUTC + 'Z';
      const midnight = new Date(midnightUTCString);
      
      // ПРАВИЛЬНЫЙ ПОДХОД: вычисляем разницу напрямую в UTC
      // midnight - это полночь 1 января в нужном timezone, но в UTC
      // correctedTime - это текущее время в UTC
      // Разница между ними - это правильное время до Нового года
      const diff = midnight.getTime() - correctedTime;
      
      // Отладочная информация (только при первой загрузке и периодически)
      if (typeof window !== 'undefined') {
        const now = Date.now();
        if (!(window as any).__timerDebugShown) {
          (window as any).__timerDebugShown = true;
          console.log('🔍 Таймер отладка (первая загрузка):', {
            midnightUTC,
            midnightTime: midnight.toISOString(),
            midnightInTZ: midnight.toLocaleString('ru-RU', { timeZone: timezone }),
            systemTime: new Date(systemTime).toISOString(),
            systemTimeInTZ: new Date(systemTime).toLocaleString('ru-RU', { timeZone: timezone }),
            serverTimeOffset,
            serverTimeOffsetSeconds: serverTimeOffset / 1000,
            correctedTime: new Date(correctedTime).toISOString(),
            correctedTimeInTZ: new Date(correctedTime).toLocaleString('ru-RU', { timeZone: timezone }),
            diff,
            diffHours: diff / (1000 * 60 * 60),
            timezone,
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          });
        }
      }

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
