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

interface NotificationPromptButtonProps {
  onSubscribed?: () => void;
}

export default function NotificationPromptButton({ onSubscribed }: NotificationPromptButtonProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
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
    // Если кнопка свернута, разворачиваем её при клике
    if (isCollapsed && isMobile) {
      setIsCollapsed(false);
      setIsHovered(false);
      // Устанавливаем таймер для повторного сворачивания через 3 секунды
      setTimeout(() => {
        if (isMobile && !isSubscribed && !isLoading) {
          setIsCollapsed(true);
        }
      }, 3000);
    }
    
    // Проверяем, показывали ли мы уже информационное окно
    const hasSeenInfo = localStorage.getItem('has_seen_notification_info');
    
    // Если еще не показывали - показываем информационное окно
    if (!hasSeenInfo) {
      setShowInfoModal(true);
      return;
    }
    
    // Если уже показывали - сразу переходим к запросу разрешения
    await requestPermissionAndSubscribe();
  };

  const requestPermissionAndSubscribe = async () => {
    setIsLoading(true);

    // Если регистрации нет, попробуем зарегистрировать Service Worker
    let currentRegistration = registration;
    if (!currentRegistration) {
      try {
        const swRegistration = await registerServiceWorker();
        if (!swRegistration) {
          alert('Не удалось зарегистрировать Service Worker. Убедитесь, что сайт открыт по HTTPS.');
          setIsLoading(false);
          return;
        }
        setRegistration(swRegistration);
        currentRegistration = swRegistration;
      } catch (error: any) {
        console.error('Error registering Service Worker:', error);
        alert('Ошибка при регистрации Service Worker: ' + (error.message || 'Неизвестная ошибка'));
        setIsLoading(false);
        return;
      }
    }

    if (!currentRegistration) {
      setIsLoading(false);
      return;
    }

    try {
      // Проверяем текущий статус разрешения перед запросом
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const currentPermission = Notification.permission;
        
        if (currentPermission === 'denied') {
          // Разрешение было отклонено ранее - показываем модальное окно с инструкциями
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
      const permission = await requestNotificationPermission();
      
      if (permission !== 'granted') {
        if (permission === 'denied') {
          // Пользователь только что отклонил - показываем модальное окно с инструкциями
          setShowDeniedModal(true);
        } else {
          alert('Разрешение на уведомления не предоставлено');
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

      const subscription = await subscribeToPushNotifications(currentRegistration);
      
      if (subscription) {
        const userId = await getOrCreateUserId();
        await saveSubscriptionToServer(subscription, userId);
        
        setIsSubscribed(true);
        
        if (onSubscribed) {
          onSubscribed();
        }
        
        if (currentRegistration.showNotification) {
          currentRegistration.showNotification('Вы подписались на уведомления!', {
            body: 'Вы будете получать напоминания о волшебном моменте!',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
          });
        }
      }
    } catch (error: any) {
      console.error('Error subscribing to notifications:', error);
      alert(error.message || 'Ошибка при подписке на уведомления');
    } finally {
      setIsLoading(false);
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

  // Отладочная информация (можно убрать позже)
  if (typeof window !== 'undefined') {
    console.log('[NotificationPromptButton] Render:', {
      isInitialized,
      isSupported,
      isSubscribed,
      isMobile,
      isCollapsed,
      shouldShowFull,
    });
  }

  return (
    <>
      <div 
        className={`fixed top-4 left-4 z-50 transition-all duration-300 ${
          showPulse ? 'animate-pulse' : ''
        } ${isCollapsed && isMobile ? 'opacity-70' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
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
          title={!shouldShowFull ? 'Включить уведомления' : undefined}
        >
          <span className="text-lg">🔔</span>
          {shouldShowFull && (
            <span>{isLoading ? 'Загрузка...' : 'Включить уведомления'}</span>
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
                Зачем нужны уведомления?
              </h2>
            </div>

            <div className="space-y-3 mb-6 text-sm text-slate-200">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <strong className="text-purple-300">31 декабря в 23:57</strong>
                <p className="mt-1 text-xs">Напоминание о том, что ваш шар желаний отправляется в космос! Вы сможете увидеть это волшебство.</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <strong className="text-purple-300">31 декабря в 22:50</strong>
                <p className="mt-1 text-xs">Напоминание для создателей комнат: пора запускать празднование и приглашать гостей!</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <strong className="text-purple-300">Новые лайки</strong>
                <p className="mt-1 text-xs">Уведомления о том, что кто-то поддержал ваш шар желаний.</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={async () => {
                  setShowInfoModal(false);
                  localStorage.setItem('has_seen_notification_info', 'true');
                  await requestPermissionAndSubscribe();
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Подключить уведомления
              </button>
              <button
                onClick={() => {
                  setShowInfoModal(false);
                  localStorage.setItem('has_seen_notification_info', 'true');
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
              >
                Позже
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
                Разрешение на уведомления отклонено
              </h2>
              <p className="text-slate-300 text-sm mb-4">
                Чтобы включить уведомления, выполните <strong className="text-white">2 шага</strong>:
              </p>
            </div>

            <div className="space-y-4 mb-4 text-sm text-slate-200 max-h-[400px] overflow-y-auto">
              {/* ШАГ 1 */}
              <div>
                <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg p-3 mb-2 border-2 border-blue-400/30">
                  <strong className="text-blue-200 text-base">ШАГ 1: Включить уведомления в настройках браузера</strong>
                </div>
                <div className="space-y-2 ml-2">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <strong className="text-white">Chrome/Edge:</strong>
                    <p className="mt-1 text-xs">Настройки → Конфиденциальность → Уведомления → Разрешить для этого сайта</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <strong className="text-white">Firefox:</strong>
                    <p className="mt-1 text-xs">Настройки → Конфиденциальность → Уведомления → Разрешить для этого сайта</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <strong className="text-white">Safari:</strong>
                    <p className="mt-1 text-xs">Настройки → Сайты → Уведомления → Разрешить для этого сайта</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <strong className="text-white">Мобильные:</strong>
                    <p className="mt-1 text-xs">Настройки браузера → Уведомления → Разрешить для этого сайта</p>
                  </div>
                </div>
              </div>

              {/* ШАГ 2 */}
              <div>
                <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-lg p-3 mb-2 border-2 border-purple-400/30">
                  <strong className="text-purple-200 text-base">ШАГ 2: Подтвердить подключение на сайте</strong>
                </div>
                <div className="bg-gradient-to-r from-purple-700/50 to-pink-700/50 rounded-lg p-3 ml-2 border-2 border-purple-400/30">
                  <p className="text-xs text-white">Вернитесь на главную страницу и нажмите на кнопку 🔔 <strong>"Включить уведомления"</strong> в левом верхнем углу, чтобы подтвердить подключение.</p>
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
                Я включил уведомления в настройках
              </button>
              <button
                onClick={() => setShowDeniedModal(false)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
              >
                Понятно, закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

