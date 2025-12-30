'use client';

/**
 * Компонент кнопки для запроса уведомлений в правом верхнем углу
 * Показывается только если уведомления еще не подключены
 */

import { useState, useEffect } from 'react';
import {
  isPushNotificationSupported,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
  getPushSubscription,
  saveSubscriptionToServer,
} from '@/lib/pushNotifications';
import { getOrCreateUserId } from '@/lib/userId';
import { useLanguage } from '@/components/constructor/LanguageProvider';

interface NotificationPromptButtonProps {
  onSubscribed?: () => void;
}

export default function NotificationPromptButton({ onSubscribed }: NotificationPromptButtonProps) {
  const { t } = useLanguage();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // Промежуточная модалка перед системным диалогом
  const [showDeniedModal, setShowDeniedModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined') {
        setIsInitialized(true);
        return;
      }
      
      console.log('[NotificationPromptButton] Initializing...');
      
      try {
        if (!isPushNotificationSupported()) {
          console.log('[NotificationPromptButton] Push notifications not supported');
          setIsSupported(false);
          setIsInitialized(true);
          return;
        }

        console.log('[NotificationPromptButton] Push notifications supported');
        setIsSupported(true);
      } catch (error) {
        console.error('[NotificationPromptButton] Error checking support:', error);
        setIsSupported(false);
        setIsInitialized(true);
        return;
      }

      try {
        // Регистрируем Service Worker
        console.log('[NotificationPromptButton] Registering Service Worker...');
        const swRegistration = await registerServiceWorker();
        if (swRegistration) {
          console.log('[NotificationPromptButton] Service Worker registered');
          setRegistration(swRegistration);

          // Проверяем текущую подписку
          console.log('[NotificationPromptButton] Checking subscription...');
          const subscription = await getPushSubscription(swRegistration);
          const subscribed = !!subscription;
          console.log('[NotificationPromptButton] Subscription status:', subscribed, subscription);
          setIsSubscribed(subscribed);
        } else {
          console.log('[NotificationPromptButton] Service Worker registration failed, but will show button');
        }
        // Если Service Worker не зарегистрирован - кнопка все равно покажется, попробуем зарегистрировать при клике
      } catch (error) {
        console.error('[NotificationPromptButton] Error during initialization:', error);
        // В случае ошибки кнопка покажется, попробуем при клике
      } finally {
        console.log('[NotificationPromptButton] Initialization complete');
        setIsInitialized(true);
      }
    };

    init();
  }, []);

  // Определяем мобильное устройство и таймер сворачивания
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      try {
        if (typeof window !== 'undefined' && window.innerWidth) {
          setIsMobile(window.innerWidth < 640); // sm breakpoint
        }
      } catch (error) {
        console.error('Error checking mobile:', error);
        // По умолчанию считаем мобильным, если не можем определить
        setIsMobile(true);
      }
    };
    
    checkMobile();
    
    try {
      window.addEventListener('resize', checkMobile);
    } catch (error) {
      console.error('Error adding resize listener:', error);
    }
    
    // На мобильном сворачиваем через 3.5 секунды (только если не в процессе загрузки)
    if (isInitialized && isSupported && !isSubscribed && !isLoading) {
      const timer = setTimeout(() => {
        if (isMobile && !isLoading) {
          setIsCollapsed(true);
        }
      }, 3500);
      
      return () => {
        clearTimeout(timer);
        try {
          if (typeof window !== 'undefined') {
            window.removeEventListener('resize', checkMobile);
          }
        } catch (error) {
          console.error('Error removing resize listener:', error);
        }
      };
    }
    
    return () => {
      try {
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', checkMobile);
        }
      } catch (error) {
        console.error('Error removing resize listener:', error);
      }
    };
  }, [isInitialized, isSupported, isSubscribed, isMobile, isLoading]);

  const handleSubscribe = async () => {
    console.log('[NotificationPromptButton] handleSubscribe called');
    
    // Если кнопка свернута, разворачиваем её при клике
    if (isCollapsed && isMobile) {
      setIsCollapsed(false);
      setIsHovered(false);
    }
    
    // Проверяем текущий статус разрешения
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentPermission = Notification.permission;
      console.log('[NotificationPromptButton] Current permission in handleSubscribe:', currentPermission);
      
      // Если разрешение уже отклонено - сразу показываем инструкции
      if (currentPermission === 'denied') {
        console.log('[NotificationPromptButton] Permission already denied, showing instructions modal');
        setShowDeniedModal(true);
        return;
      }
    }
    
    // Проверяем, показывали ли мы уже информационное окно
    const hasSeenInfo = typeof window !== 'undefined' ? localStorage.getItem('has_seen_notification_info') : null;
    console.log('[NotificationPromptButton] Has seen info:', hasSeenInfo);
    
    // Если еще не показывали - показываем информационное окно
    if (!hasSeenInfo) {
      console.log('[NotificationPromptButton] Showing info modal');
      setShowInfoModal(true);
      return;
    }
    
    // Если уже показывали - показываем промежуточную модалку с подтверждением
    console.log('[NotificationPromptButton] Showing confirmation modal');
    setShowConfirmationModal(true);
  };

  const requestPermissionAndSubscribe = async () => {
    console.log('[NotificationPromptButton] requestPermissionAndSubscribe called');
    setIsLoading(true);

    // Если регистрации нет, попробуем зарегистрировать Service Worker
    let currentRegistration = registration;
    if (!currentRegistration) {
      console.log('[NotificationPromptButton] No registration, registering Service Worker...');
      try {
        const swRegistration = await registerServiceWorker();
        if (!swRegistration) {
          console.error('[NotificationPromptButton] Service Worker registration failed');
          alert(t('serviceWorkerRegistrationError'));
          setIsLoading(false);
          return;
        }
        setRegistration(swRegistration);
        currentRegistration = swRegistration;
        console.log('[NotificationPromptButton] Service Worker registered successfully');
      } catch (error: any) {
        console.error('[NotificationPromptButton] Error registering Service Worker:', error);
        alert(t('serviceWorkerError') + (error.message || t('unknownError')));
        setIsLoading(false);
        return;
      }
    }

    if (!currentRegistration) {
      console.error('[NotificationPromptButton] No registration available');
      setIsLoading(false);
      return;
    }

    try {
      // Проверяем текущий статус разрешения перед запросом
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const currentPermission = Notification.permission;
        console.log('[NotificationPromptButton] Current permission:', currentPermission);
        
        if (currentPermission === 'denied') {
          // Разрешение было отклонено ранее - показываем модальное окно с инструкциями
          console.log('[NotificationPromptButton] Permission already denied, showing instructions');
          setIsLoading(false);
          setShowDeniedModal(true);
          // На мобильном сворачиваем кнопку обратно
          if (isMobile) {
            setTimeout(() => {
              setIsCollapsed(true);
            }, 500);
          }
          return;
        }
      }
      
      // Пытаемся запросить разрешение
      console.log('[NotificationPromptButton] Requesting notification permission...');
      let permission: NotificationPermission;
      try {
        permission = await requestNotificationPermission();
        console.log('[NotificationPromptButton] Permission result:', permission);
      } catch (error: any) {
        console.error('[NotificationPromptButton] Error requesting permission:', error);
        // Если разрешение уже было отклонено ранее
        if (error.message && error.message.includes('отклонено')) {
          setIsLoading(false);
          setShowDeniedModal(true);
          if (isMobile) {
            setTimeout(() => {
              setIsCollapsed(true);
            }, 500);
          }
          return;
        }
        // Другая ошибка
        alert(t('permissionRequestError') + (error.message || t('unknownError')));
        setIsLoading(false);
        if (isMobile) {
          setTimeout(() => {
            setIsCollapsed(true);
          }, 500);
        }
        return;
      }
      
      if (permission !== 'granted') {
        if (permission === 'denied') {
          // Пользователь только что отклонил - показываем модальное окно с инструкциями
          console.log('[NotificationPromptButton] Permission denied, showing instructions');
          setShowDeniedModal(true);
        } else {
          console.log('[NotificationPromptButton] Permission not granted:', permission);
          // Если пользователь просто закрыл диалог - просто закрываем модалку
        }
        setIsLoading(false);
        // На мобильном сворачиваем кнопку обратно после отказа
        if (isMobile) {
          setTimeout(() => {
            setIsCollapsed(true);
          }, 500);
        }
        return;
      }

      console.log('[NotificationPromptButton] Permission granted, subscribing to push notifications...');
      const subscription = await subscribeToPushNotifications(currentRegistration);
      console.log('[NotificationPromptButton] Subscription result:', subscription);
      
      if (subscription) {
        const userId = await getOrCreateUserId();
        await saveSubscriptionToServer(subscription, userId);
        console.log('[NotificationPromptButton] Subscription saved to server');
        
        setIsSubscribed(true);

        if (onSubscribed) {
          onSubscribed();
        }

        // Показываем тестовое уведомление с небольшой задержкой для надежности
        setTimeout(() => {
          if (currentRegistration.showNotification) {
            currentRegistration.showNotification('Вы подписались на уведомления!', {
              body: 'Вы будете получать напоминания о волшебном моменте!',
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: 'subscription-success',
              requireInteraction: false,
            }).catch((error) => {
              console.warn('[NotificationPromptButton] Failed to show test notification:', error);
            });
          }
        }, 500);
      } else {
        console.error('[NotificationPromptButton] Failed to create subscription');
      }
    } catch (error: any) {
      console.error('[NotificationPromptButton] Error subscribing to notifications:', error);
      alert(error.message || t('subscriptionError'));
    } finally {
      setIsLoading(false);
      console.log('[NotificationPromptButton] requestPermissionAndSubscribe completed');
    }
  };

  // Не показываем кнопку, если:
  // 1. Еще инициализируется (ждем проверки)
  if (!isInitialized) {
    return null;
  }

  // 2. Не поддерживается - не показываем (но на мобильных все равно показываем, если инициализировано)
  // На мобильных может быть проблема с определением поддержки, поэтому показываем кнопку всегда после инициализации
  if (!isSupported && !isMobile) {
    return null;
  }

  // 3. Уже подписан - не показываем
  if (isSubscribed) {
    return null;
  }

  // Во всех остальных случаях показываем кнопку
  const shouldShowFull = !isMobile || !isCollapsed || isHovered;
  const showPulse = isMobile && !isCollapsed;

  return (
    <>
      <div 
        className={`fixed top-24 md:top-20 left-4 z-[100] transition-all duration-300 ${
          showPulse ? 'animate-pulse' : ''
        } ${isCollapsed && isMobile ? 'opacity-70' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => {
          setIsHovered(true);
          setIsCollapsed(false);
        }}
        onTouchEnd={() => setTimeout(() => setIsHovered(false), 300)}
      >
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none backdrop-blur-md border-2 border-white/20 flex items-center gap-2 ${
            shouldShowFull 
              ? 'px-4 py-2.5 text-sm sm:text-base' 
              : 'px-2 py-2 text-xl'
          }`}
          title={!shouldShowFull ? t('enableNotificationsButton') : undefined}
        >
          <span className="text-lg">🔔</span>
          {shouldShowFull && (
            <span>{isLoading ? t('loading') : t('enableNotificationsButton')}</span>
          )}
        </button>
      </div>

      {/* Модальное окно с описанием уведомлений (показывается перед запросом разрешения) */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-purple-500/50 shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">🔔</div>
              <h2 className="text-xl font-bold text-white mb-3">
                {t('whyNotifications')}
              </h2>
            </div>

            <div className="space-y-3 mb-6 text-sm text-slate-200">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <strong className="text-purple-300">{t('notificationReminder1')}</strong>
                <p className="mt-1 text-xs">{t('notificationReminder1Desc')}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <strong className="text-purple-300">{t('notificationReminder2')}</strong>
                <p className="mt-1 text-xs">{t('notificationReminder2Desc')}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <strong className="text-purple-300">{t('newLikes')}</strong>
                <p className="mt-1 text-xs">{t('newLikesDesc')}</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={async () => {
                  setShowInfoModal(false);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('has_seen_notification_info', 'true');
                  }
                  // Показываем промежуточную модалку с подтверждением
                  setShowConfirmationModal(true);
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                {t('connectNotifications')}
              </button>
              <button
                onClick={() => {
                  setShowInfoModal(false);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('has_seen_notification_info', 'true');
                  }
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
              >
                {t('later')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Промежуточная модалка с подтверждением перед системным диалогом браузера */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-purple-500/50 shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">🔔</div>
              <h2 className="text-xl font-bold text-white mb-3">
                {t('confirmNotificationConnection')}
              </h2>
            </div>

            <div className="space-y-3 mb-6 text-sm text-slate-200">
              <div className="bg-gradient-to-r from-purple-700/30 to-pink-700/30 rounded-lg p-3 border border-purple-400/20">
                <p className="text-white font-semibold mb-2">{t('whatYouGet')}</p>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  <li>• <strong>{t('reminder1')}</strong> {t('reminder1Text')}</li>
                  <li>• <strong>{t('reminder2')}</strong> {t('reminder2Text')}</li>
                  <li>• <strong>{t('newLikes')}</strong> {t('newLikesText')}</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-amber-700/30 to-orange-700/30 rounded-lg p-3 border border-amber-400/20">
                <p className="text-amber-200 font-semibold mb-2">{t('notificationImportant')}</p>
                <p className="text-xs text-slate-200">
                  {t('notificationAfterConnect')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={async (e) => {
                  console.log('[NotificationPromptButton] Confirmation modal: Connect button clicked');
                  e.preventDefault();
                  setShowConfirmationModal(false);
                  // Вызываем сразу, без задержки, чтобы сохранить контекст пользовательского взаимодействия
                  // Это важно для Edge и других браузеров
                  await requestPermissionAndSubscribe();
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                {t('connectNotifications')}
              </button>
              <button
                onClick={() => {
                  setShowConfirmationModal(false);
                  if (isMobile) {
                    setTimeout(() => {
                      setIsCollapsed(true);
                    }, 500);
                  }
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
              >
                {t('later')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно с инструкциями, если разрешение отклонено */}
      {showDeniedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-purple-500/50 shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">🔔</div>
              <h2 className="text-xl font-bold text-white mb-2">
                {t('notificationDenied')}
              </h2>
              <p className="text-slate-300 text-sm mb-4">
                {t('notificationDeniedSteps').replace('{count}', '2')}
              </p>
            </div>

            <div className="space-y-4 mb-4 text-sm text-slate-200 max-h-[400px] overflow-y-auto">
              {/* ШАГ 1 */}
              <div>
                <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg p-3 mb-2 border-2 border-blue-400/30">
                  <strong className="text-blue-200 text-base">{t('notificationStep1')}</strong>
                </div>
                <div className="space-y-2 ml-2">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <strong className="text-white">{t('chromeEdge')}</strong>
                    <p className="mt-1 text-xs">{t('browserSettingsPath')}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <strong className="text-white">{t('firefox')}</strong>
                    <p className="mt-1 text-xs">{t('browserSettingsPath')}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <strong className="text-white">{t('safari')}</strong>
                    <p className="mt-1 text-xs">{t('safariSettingsPath')}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <strong className="text-white">{t('mobile')}</strong>
                    <p className="mt-1 text-xs">{t('mobileSettingsPath')}</p>
                  </div>
                </div>
              </div>

              {/* ШАГ 2 */}
              <div>
                <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-lg p-3 mb-2 border-2 border-purple-400/30">
                  <strong className="text-purple-200 text-base">{t('notificationStep2Confirm')}</strong>
                </div>
                <div className="bg-gradient-to-r from-purple-700/50 to-pink-700/50 rounded-lg p-3 ml-2 border-2 border-purple-400/30">
                  <p className="text-xs text-white">{t('notificationStep2Desc')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={async () => {
                  setShowDeniedModal(false);
                  // Проверяем статус и пытаемся подписаться, если разрешение было предоставлено
                  await requestPermissionAndSubscribe();
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                {t('iEnabledNotifications')}
              </button>
              <button
                onClick={() => setShowDeniedModal(false)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
              >
                {t('gotItClose')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

