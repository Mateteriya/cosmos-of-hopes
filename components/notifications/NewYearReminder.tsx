'use client';

/**
 * Компонент напоминания о волшебном моменте (23:58 31 декабря)
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/constructor/LanguageProvider';

interface NewYearReminderProps {
  onClose: () => void;
}

export default function NewYearReminder({ onClose }: NewYearReminderProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    // Обновляем таймер каждую секунду
    const updateTimer = () => {
      const now = new Date();
      const newYear2026 = new Date('2026-01-01T00:00:00');
      
      // Используем время пользователя
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Вычисляем разницу
      const diff = newYear2026.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('0:00');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    // Автоматически скрываем через 10 секунд
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onClose]);

  const handleGo = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      router.push('/tree');
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 text-white rounded-2xl border-4 border-purple-400/50 shadow-2xl max-w-md w-full p-8 text-center animate-scale-in">
        <div className="text-6xl mb-4 animate-pulse">✨🎄✨</div>
        <h2 className="text-3xl font-bold mb-4">
          {t('magicMomentComing')}
        </h2>
        <div className="text-4xl font-bold mb-6 text-yellow-300">
          {timeLeft}
        </div>
        <p className="text-lg mb-6 text-purple-100">
          {t('magicMomentDescription')}
        </p>
        <div className="flex gap-4">
          <button
            onClick={handleGo}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
          >
            {t('watchMagic')}
          </button>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="px-6 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all"
          >
            {t('later')}
          </button>
        </div>
      </div>
    </div>
  );
}

