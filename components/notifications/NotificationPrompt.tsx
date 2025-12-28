'use client';

/**
 * Компонент для предложения подписки на уведомления
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/constructor/LanguageProvider';
import {
  isPushNotificationSupported,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
  getPushSubscription,
  saveSubscriptionToServer,
} from '@/lib/pushNotifications';
import { getOrCreateUserId } from '@/lib/userId';

interface NotificationPromptProps {
  title?: string;
  message?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function NotificationPrompt({
  title,
  message,
  onClose,
  showCloseButton = true,
}: NotificationPromptProps) {
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

  const handleSubscribe = async () => {
    if (!registration) return;

    setIsLoading(true);

    try {
      // Проверяем текущий статус разрешения перед запросом
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const currentPermission = Notification.permission;
        
        if (currentPermission === 'denied') {
          // Разрешение было отклонено ранее - просто закрываем модальное окно
          // Пользователь может включить уведомления позже через настройки браузера
          setIsLoading(false);
          if (onClose) onClose();
          return;
        }
      }
      
      const permission = await requestNotificationPermission();
      
      if (permission !== 'granted') {
        // Если пользователь отклонил или закрыл диалог - просто закрываем модальное окно
        // Пользователь может попробовать позже
        setIsLoading(false);
        return;
      }

      const subscription = await subscribeToPushNotifications(registration);
      
      if (subscription) {
        const userId = await getOrCreateUserId();
        await saveSubscriptionToServer(subscription, userId);
        
        setIsSubscribed(true);
        
        if (registration.showNotification) {
          registration.showNotification(
            t('notificationSubscribed') || 'Вы подписались на уведомления!',
            {
              body: t('notificationSubscribedBody') || 'Вы будете получать напоминания о волшебном моменте!',
              icon: '/favicon.ico',
              badge: '/favicon.ico',
            }
          );
        }

        // Закрываем модальное окно через небольшую задержку
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error subscribing to notifications:', error);
      // Не показываем alert, просто закрываем модальное окно
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (onClose) onClose();
  };

  // Не показываем, если уже подписан или не поддерживается
  if (!isSupported || isSubscribed) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-purple-500/50 shadow-2xl max-w-md w-full p-4 sm:p-6">
        <div className="text-center mb-4 sm:mb-6">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🔔</div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            {title || t('enableNotificationsPrompt') || 'Включить уведомления?'}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm px-2">
            {message || t('enableNotificationsMessage') || 'Получайте напоминания о волшебном моменте и важных событиях!'}
          </p>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
          >
            {isLoading
              ? t('loading') || 'Загрузка...'
              : t('enableNotifications') || 'Включить уведомления'
            }
          </button>

          {showCloseButton && (
            <button
              onClick={handleSkip}
              disabled={isLoading}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {t('later') || 'Позже'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

