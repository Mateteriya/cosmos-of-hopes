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
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl shadow-2xl border-2 border-purple-400/50 max-w-sm pointer-events-auto animate-fade-in">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">✨</div>
            <div>
              <div className="font-bold text-lg">
                {t('yourBallGotLike').replace('{count}', likesCount.toString())}
              </div>
              <div className="text-sm text-purple-100 opacity-90">
                {t('someoneLikedYourBall')}
              </div>
            </div>
          </div>
          <button
            onClick={handleView}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 text-sm"
          >
            {t('view')}
          </button>
        </div>
      </div>
    </div>
  );
}

