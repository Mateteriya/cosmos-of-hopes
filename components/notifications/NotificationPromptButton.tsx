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

  useEffect(() => {
    const init = async () => {
      console.log('[NotificationPromptButton] Initializing...');
      
      if (!isPushNotificationSupported()) {
        console.log('[NotificationPromptButton] Push notifications not supported');
        setIsSupported(false);
        setIsInitialized(true);
        return;
      }

      console.log('[NotificationPromptButton] Push notifications supported');
      setIsSupported(true);

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
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // На мобильном сворачиваем через 3.5 секунды (только если не в процессе загрузки)
    if (isInitialized && isSupported && !isSubscribed && !isLoading) {
      const timer = setTimeout(() => {
        if (isMobile && !isLoading) {
          setIsCollapsed(true);
        }
      }, 3500);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkMobile);
      };
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile);
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
      const permission = await requestNotificationPermission();
      
      if (permission !== 'granted') {
        alert('Разрешение на уведомления отклонено');
        setIsLoading(false);
        // На мобильном сворачиваем кнопку обратно после отказа
        if (isMobile) {
          // Сворачиваем сразу и устанавливаем таймер для повторного сворачивания
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

  // 2. Не поддерживается - не показываем
  if (!isSupported) {
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
    <div 
      className={`fixed top-4 left-4 z-50 transition-all duration-300 ${
        showPulse ? 'animate-pulse' : ''
      } ${isCollapsed && isMobile ? 'opacity-70' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
  );
}

