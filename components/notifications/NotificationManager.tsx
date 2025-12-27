'use client';

/**
 * Компонент-менеджер для управления уведомлениями
 * Проверяет новые лайки и показывает напоминания
 */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LikeNotification from './LikeNotification';
import NewYearReminder from './NewYearReminder';
import { getOrCreateUserId } from '@/lib/userId';
import { checkNewLikes, checkAndAddDeveloperLikes } from '@/lib/toys';

const LAST_CHECKED_KEY = 'cosmos_of_hopes_last_likes_check';
const NEW_YEAR_REMINDER_SHOWN_KEY = 'cosmos_of_hopes_newyear_reminder_shown';

export default function NotificationManager() {
  const pathname = usePathname();
  const [showLikeNotification, setShowLikeNotification] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showNewYearReminder, setShowNewYearReminder] = useState(false);

  useEffect(() => {
    const checkNotifications = async () => {
      // Проверяем только на главной странице, странице елки или странице комнаты
      if (pathname !== '/' && pathname !== '/tree' && !pathname.startsWith('/room')) {
        return;
      }

      const userId = getOrCreateUserId();
      if (!userId) return;

      try {
        // 1. Проверяем и добавляем автоматические лайки разработчика
        await checkAndAddDeveloperLikes(userId);

        // 2. Проверяем новые лайки
        const lastChecked = typeof window !== 'undefined' 
          ? localStorage.getItem(LAST_CHECKED_KEY)
          : null;
        
        const lastCheckedTimestamp = lastChecked ? parseInt(lastChecked, 10) : null;
        const newLikesInfo = await checkNewLikes(userId, lastCheckedTimestamp);

        if (newLikesInfo.hasNewLikes && newLikesInfo.toysWithNewLikes.length > 0) {
          // Берем максимальное количество лайков для показа
          const maxLikes = Math.max(...newLikesInfo.toysWithNewLikes.map(t => t.likesCount));
          setLikesCount(maxLikes);
          setShowLikeNotification(true);
        }

        // Обновляем время последней проверки
        if (typeof window !== 'undefined') {
          localStorage.setItem(LAST_CHECKED_KEY, Date.now().toString());
        }

        // 3. Проверяем, нужно ли показать напоминание о Новом Годе
        const now = new Date();
        const newYear2026 = new Date('2026-01-01T00:00:00');
        const reminderShown = typeof window !== 'undefined'
          ? localStorage.getItem(NEW_YEAR_REMINDER_SHOWN_KEY)
          : null;

        // Показываем напоминание если:
        // - До Нового года осталось меньше 2 часов (120 минут)
        // - И мы еще не показывали напоминание сегодня
        // - И сейчас после 21:00 31 декабря
        const timeUntilNewYear = newYear2026.getTime() - now.getTime();
        const hoursUntilNewYear = timeUntilNewYear / (1000 * 60 * 60);
        
        const isDec31 = now.getMonth() === 11 && now.getDate() === 31;
        const isAfter21 = now.getHours() >= 21;
        const isCloseToMidnight = hoursUntilNewYear > 0 && hoursUntilNewYear < 2;

        if (isDec31 && isAfter21 && isCloseToMidnight && !reminderShown) {
          setShowNewYearReminder(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem(NEW_YEAR_REMINDER_SHOWN_KEY, Date.now().toString());
          }
        }

      } catch (error) {
        console.error('Ошибка проверки уведомлений:', error);
      }
    };

    // Небольшая задержка, чтобы не блокировать загрузку страницы
    const timer = setTimeout(checkNotifications, 1000);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      {showLikeNotification && (
        <LikeNotification
          likesCount={likesCount}
          onClose={() => setShowLikeNotification(false)}
        />
      )}
      {showNewYearReminder && (
        <NewYearReminder
          onClose={() => setShowNewYearReminder(false)}
        />
      )}
    </>
  );
}

