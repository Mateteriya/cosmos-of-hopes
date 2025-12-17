'use client';

/**
 * Компонент таймера до Нового года
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

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
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
  }, [midnightUTC]);

  if (!timeLeft) {
    return (
      <div className="text-white text-center">
        <div className="text-2xl font-bold">Загрузка...</div>
      </div>
    );
  }

  const isNewYear = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-md border-2 border-white/30 rounded-xl p-2 sm:p-4 lg:p-6 text-center">
      {isNewYear ? (
        <div className="space-y-1 sm:space-y-2">
          <div className="text-4xl sm:text-5xl lg:text-6xl mb-2 sm:mb-4">🎉</div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">С НОВЫМ ГОДОМ!</div>
          <div className="text-sm sm:text-base lg:text-lg text-white/80">Пусть все мечты сбудутся! ✨</div>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3 lg:space-y-4">
          <div className="text-white/80 text-xs sm:text-sm uppercase tracking-wider">
            До Нового года осталось
          </div>
          <div className="grid grid-cols-4 gap-0.5 sm:gap-1 lg:gap-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 sm:p-1.5 lg:p-2 xl:p-4 border border-white/20 min-w-0">
              <div className="text-sm sm:text-base lg:text-lg xl:text-2xl font-bold text-white leading-tight break-all">{timeLeft.days}</div>
              <div className="text-[8px] sm:text-[9px] lg:text-[10px] xl:text-xs text-white/70 uppercase mt-0.5 leading-tight">Дней</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 sm:p-1.5 lg:p-2 xl:p-4 border border-white/20 min-w-0">
              <div className="text-sm sm:text-base lg:text-lg xl:text-2xl font-bold text-white leading-tight break-all">{timeLeft.hours}</div>
              <div className="text-[8px] sm:text-[9px] lg:text-[10px] xl:text-xs text-white/70 uppercase mt-0.5 leading-tight">Часов</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 sm:p-1.5 lg:p-2 xl:p-4 border border-white/20 min-w-0">
              <div className="text-sm sm:text-base lg:text-lg xl:text-2xl font-bold text-white leading-tight break-all">{timeLeft.minutes}</div>
              <div className="text-[8px] sm:text-[9px] lg:text-[10px] xl:text-xs text-white/70 uppercase mt-0.5 leading-tight">Минут</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 sm:p-1.5 lg:p-2 xl:p-4 border border-white/20 min-w-0">
              <div className="text-sm sm:text-base lg:text-lg xl:text-2xl font-bold text-white leading-tight break-all">{timeLeft.seconds}</div>
              <div className="text-[8px] sm:text-[9px] lg:text-[10px] xl:text-xs text-white/70 uppercase mt-0.5 leading-tight">Секунд</div>
            </div>
          </div>
          <div className="text-white/60 text-[10px] sm:text-xs">
            По времени: {timezone}
          </div>
        </div>
      )}
    </div>
  );
}
