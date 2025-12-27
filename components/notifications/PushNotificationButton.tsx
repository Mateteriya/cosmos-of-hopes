'use client';

/**
 * Кнопка для подписки на Push уведомления
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/constructor/LanguageProvider';
import {
  isPushNotificationSupported,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getPushSubscription,
  saveSubscriptionToServer,
} from '@/lib/pushNotifications';
import { getOrCreateUserId } from '@/lib/userId';

export default function PushNotificationButton() {
  const { t } = useLanguage();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!isPushNotificationSupported()) {
        setIsSupported(false);
        return;
      }

      setIsSupported(true);

      // Регистрируем Service Worker
      const swRegistration = await registerServiceWorker();
      if (!swRegistration) {
        setIsSupported(false);
        return;
      }

      setRegistration(swRegistration);

      // Проверяем текущую подписку
      const subscription = await getPushSubscription(swRegistration);
      setIsSubscribed(!!subscription);
    };

    init();
  }, []);

  const handleToggleSubscription = async () => {
    if (!registration) return;

    setIsLoading(true);

    try {
      if (isSubscribed) {
        // Отписываемся
        await unsubscribeFromPushNotifications(registration);
        localStorage.removeItem('push_subscription');
        setIsSubscribed(false);
      } else {
        // Запрашиваем разрешение
        const permission = await requestNotificationPermission();
        
        if (permission !== 'granted') {
          alert(t('notificationPermissionDenied') || 'Разрешение на уведомления отклонено');
          setIsLoading(false);
          return;
        }

        // Подписываемся
        const subscription = await subscribeToPushNotifications(registration);
        
        if (subscription) {
          // Сохраняем подписку (localStorage + база данных)
          const userId = getOrCreateUserId();
          await saveSubscriptionToServer(subscription, userId);
          
          setIsSubscribed(true);
          
          // Показываем тестовое уведомление
          if (registration.showNotification) {
            registration.showNotification(t('notificationSubscribed') || 'Вы подписались на уведомления!', {
              body: t('notificationSubscribedBody') || 'Вы будете получать напоминания о волшебном моменте!',
              icon: '/favicon.ico',
              badge: '/favicon.ico',
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Error toggling push subscription:', error);
      alert(error.message || 'Ошибка при подписке на уведомления');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null; // Не показываем кнопку, если уведомления не поддерживаются
  }

  return (
    <button
      onClick={handleToggleSubscription}
      disabled={isLoading}
      className={`
        px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105
        ${isSubscribed
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'bg-purple-600 hover:bg-purple-700 text-white'
        }
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      `}
    >
      {isLoading
        ? t('loading') || 'Загрузка...'
        : isSubscribed
        ? '🔔 ' + (t('notificationsEnabled') || 'Уведомления включены')
        : '🔕 ' + (t('enableNotifications') || 'Включить уведомления')
      }
    </button>
  );
}

