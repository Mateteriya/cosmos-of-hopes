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
    // Автоматически скрываем через 5 секунд
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Даем время на анимацию
    }, 5000);

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
      <div className="bg-white border-l-4 border-purple-500 text-gray-800 p-5 rounded-lg shadow-xl max-w-md pointer-events-auto animate-fade-in">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {t('yourBallGotLike').replace('{count}', likesCount.toString())}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {t('someoneLikedYourBall')}
            </p>
            <button
              onClick={handleView}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
            >
              {t('view')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

