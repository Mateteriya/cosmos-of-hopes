'use client';

/**
 * Компонент уведомления о том, что шар получил лайк
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/constructor/LanguageProvider';

interface LikeNotificationProps {
  likesCount: number;
  onClose: () => void;
  toyId?: string;
}

export default function LikeNotification({ likesCount, onClose, toyId }: LikeNotificationProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Автоматически скрываем через 10 секунд (увеличено с 5)
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Даем время на анимацию
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleView = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      router.push('/tree');
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-purple-500 text-gray-800 p-6 rounded-xl shadow-2xl max-w-lg pointer-events-auto animate-fade-in">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          <div className="ml-5 flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t('yourBallGotLike').replace('{count}', likesCount.toString())}
            </h3>
            <p className="text-base text-gray-700 mb-4">
              {t('someoneLikedYourBall')}
            </p>
            <button
              onClick={handleView}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
            >
              {t('view')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

