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
  const [showDeniedModal, setShowDeniedModal] = useState(false);

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
          // Разрешение было отклонено ранее - показываем модальное окно с инструкциями
          setIsLoading(false);
          setShowDeniedModal(true);
          return;
        }
      }
      
      const permission = await requestNotificationPermission();
      
      if (permission !== 'granted') {
        if (permission === 'denied') {
          // Показываем модальное окно с инструкциями вместо alert
          setIsLoading(false);
          setShowDeniedModal(true);
          return;
        } else {
          // Если пользователь просто закрыл диалог - просто закрываем модальное окно
          setIsLoading(false);
          return;
        }
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

      {/* Модальное окно с инструкциями, если разрешение отклонено */}
      {showDeniedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-purple-500/50 shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">🔔</div>
              <h2 className="text-xl font-bold text-white mb-2">
                Разрешение на уведомления отклонено
              </h2>
              <p className="text-slate-300 text-sm mb-4">
                Чтобы включить уведомления, выполните <strong className="text-white">2 шага</strong>:
              </p>
            </div>

            <div className="space-y-4 mb-4 text-sm text-slate-200 max-h-[300px] overflow-y-auto">
              {/* ШАГ 1 */}
              <div className="bg-gradient-to-r from-blue-700/50 to-cyan-700/50 rounded-lg p-3 border-2 border-blue-400/30">
                <strong className="text-blue-200">ШАГ 1: Включить уведомления в настройках браузера</strong>
                <div className="mt-2 space-y-2">
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <strong className="text-white">Chrome/Edge:</strong>
                    <p className="mt-1 text-xs">Настройки → Конфиденциальность → Уведомления → Разрешить для этого сайта</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <strong className="text-white">Firefox:</strong>
                    <p className="mt-1 text-xs">Настройки → Конфиденциальность → Уведомления → Разрешить для этого сайта</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <strong className="text-white">Safari:</strong>
                    <p className="mt-1 text-xs">Настройки → Сайты → Уведомления → Разрешить для этого сайта</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <strong className="text-white">Мобильные:</strong>
                    <p className="mt-1 text-xs">Настройки браузера → Уведомления → Разрешить для этого сайта</p>
                  </div>
                </div>
              </div>

              {/* ШАГ 2 */}
              <div className="bg-gradient-to-r from-purple-700/50 to-pink-700/50 rounded-lg p-3 border-2 border-purple-400/30">
                <strong className="text-purple-200">ШАГ 2: Подтвердить подключение на сайте</strong>
                <p className="mt-2 text-xs text-white">После включения уведомлений в настройках браузера вернитесь на эту страницу и нажмите на кнопку 🔔 "Включить уведомления", чтобы подтвердить подключение.</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={async () => {
                  setShowDeniedModal(false);
                  await handleSubscribe();
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Я включил уведомления в настройках
              </button>
              <button
                onClick={() => {
                  setShowDeniedModal(false);
                  if (onClose) onClose();
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
              >
                Позже
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

