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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 pointer-events-none">
      <div className="bg-white border-l-4 border-amber-500 text-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 pointer-events-auto animate-fade-in">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('magicMomentComing')}
            </h2>
            <div className="text-3xl font-bold mb-3 text-amber-600">
              {timeLeft}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {t('magicMomentDescription')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleGo}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-4 rounded-md transition-colors"
              >
                {t('watchMagic')}
              </button>
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition-colors"
              >
                {t('later')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

