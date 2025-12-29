/**
 * Утилиты для работы с Browser Push Notifications
 */

// VAPID ключи (нужно будет заменить на реальные)
// ВАЖНО: Эти ключи нужно сгенерировать через web-push библиотеку
// Для тестирования можно использовать временные ключи
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

/**
 * Проверяет, поддерживает ли браузер Push Notifications
 */
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Запрашивает разрешение на уведомления у пользователя
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    throw new Error('Браузер не поддерживает уведомления');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('Разрешение на уведомления отклонено');
  }

  // Для Edge и других браузеров может потребоваться явная проверка
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error: any) {
    console.error('[Push Notifications] Error requesting permission:', error);
    throw new Error('Ошибка при запросе разрешения: ' + (error.message || 'Неизвестная ошибка'));
  }
}

/**
 * Регистрирует Service Worker
 * С таймаутом, чтобы не блокировать загрузку страницы
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    // Создаем таймаут на 3 секунды, чтобы не блокировать загрузку
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn('[Push Notifications] Service Worker registration timeout');
        resolve(null);
      }, 3000);
    });

    const registrationPromise = navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    }).then(async (registration) => {
      console.log('[Push Notifications] Service Worker registered:', registration);
      
      // Ждем, пока Service Worker активируется, но с таймаутом
      try {
        await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
        ]);
      } catch (e) {
        console.warn('[Push Notifications] Service Worker ready timeout, but registration successful');
      }
      
      return registration;
    }).catch((error) => {
      console.error('[Push Notifications] Service Worker registration failed:', error);
      return null;
    });

    // Ждем либо регистрацию, либо таймаут
    const result = await Promise.race([registrationPromise, timeoutPromise]);
    return result;
  } catch (error) {
    console.error('[Push Notifications] Service Worker registration error:', error);
    return null;
  }
}

/**
 * Конвертирует base64url VAPID ключ в Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  try {
    // Убираем возможные пробелы и переносы строк
    const cleanKey = base64String.trim();
    
    // Добавляем padding если нужно
    const padding = '='.repeat((4 - (cleanKey.length % 4)) % 4);
    
    // Конвертируем base64url в base64
    const base64 = (cleanKey + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Декодируем base64
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    console.log('[Push Notifications] Key converted, length:', outputArray.length, 'bytes');
    return outputArray;
  } catch (error: any) {
    console.error('[Push Notifications] Key conversion error:', error);
    throw new Error(`Failed to convert VAPID key: ${error.message}`);
  }
}

/**
 * Подписывается на push уведомления
 */
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    // Проверяем, есть ли уже подписка
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('[Push Notifications] Already subscribed');
      return existingSubscription;
    }

    // Проверяем VAPID ключ
    console.log('[Push Notifications] VAPID_PUBLIC_KEY:', VAPID_PUBLIC_KEY ? `${VAPID_PUBLIC_KEY.substring(0, 20)}...` : 'НЕ НАЙДЕН');
    
    if (!VAPID_PUBLIC_KEY) {
      console.error('[Push Notifications] VAPID public key not configured!');
      console.error('[Push Notifications] Check NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env.local');
      alert('Ошибка: VAPID ключ не настроен. Проверьте конфигурацию.');
      return null;
    }

    // Проверяем формат ключа (должен быть base64url)
    if (VAPID_PUBLIC_KEY.length < 80) {
      console.error('[Push Notifications] VAPID key seems too short:', VAPID_PUBLIC_KEY.length);
      alert('Ошибка: VAPID ключ имеет неверный формат.');
      return null;
    }

    console.log('[Push Notifications] Attempting to subscribe with VAPID key...');
    console.log('[Push Notifications] Key length:', VAPID_PUBLIC_KEY.length);
    
    // Конвертируем ключ
    let applicationServerKey: Uint8Array;
    try {
      applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      console.log('[Push Notifications] Key converted successfully, size:', applicationServerKey.length);
    } catch (conversionError: any) {
      console.error('[Push Notifications] Key conversion failed:', conversionError);
      alert('Ошибка конвертации VAPID ключа: ' + conversionError.message);
      return null;
    }
    
    // Пытаемся подписаться
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as unknown as BufferSource,
    });

    console.log('[Push Notifications] Subscribed:', subscription);
    return subscription;
  } catch (error: any) {
    console.error('[Push Notifications] Subscription failed:', error);
    console.error('[Push Notifications] Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
    
    // Более информативное сообщение об ошибке
    if (error?.message?.includes('push service error')) {
      alert('Ошибка push-сервиса. Возможные причины:\n1. VAPID ключ неверный\n2. Сайт не на HTTPS\n3. Проблема с браузером');
    }
    
    return null;
  }
}

/**
 * Отписывается от push уведомлений
 */
export async function unsubscribeFromPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[Push Notifications] Unsubscribed');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Push Notifications] Unsubscribe failed:', error);
    return false;
  }
}

/**
 * Получает текущую подписку
 */
export async function getPushSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('[Push Notifications] Get subscription failed:', error);
    return null;
  }
}

/**
 * Сохраняет подписку в localStorage и отправляет на сервер (если настроен)
 */
export async function saveSubscriptionToServer(
  subscription: PushSubscription,
  userId: string
): Promise<boolean> {
  try {
    // Сохраняем в localStorage (для резервной копии)
    if (typeof window !== 'undefined') {
      const subscriptionJSON = JSON.stringify(subscription.toJSON());
      localStorage.setItem('push_subscription', subscriptionJSON);
      localStorage.setItem('push_subscription_user_id', userId);
    }

    // Пытаемся сохранить в Supabase (если таблица существует)
    try {
      const { supabase } = await import('./supabase');
      
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          subscription: subscription.toJSON(),
        } as never, {
          onConflict: 'user_id',
        });

      if (error) {
        // Если таблица не существует - это нормально, просто логируем
        if (error.code !== '42P01') {
          console.warn('[Push Notifications] Failed to save to database:', error.message);
        }
        // Возвращаем true, так как локальное сохранение прошло успешно
        return true;
      }

      console.log('[Push Notifications] Subscription saved to database');
      return true;
    } catch (err) {
      // Импорт или другой ошибка - продолжаем с локальным сохранением
      console.warn('[Push Notifications] Database save skipped:', err);
      return true;
    }
  } catch (error) {
    console.error('[Push Notifications] Failed to save subscription:', error);
    return false;
  }
}

/**
 * Сохраняет подписку в localStorage (для обратной совместимости)
 */
export function saveSubscriptionToLocalStorage(subscription: PushSubscription): void {
  if (typeof window === 'undefined') return;
  
  const subscriptionJSON = JSON.stringify(subscription.toJSON());
  localStorage.setItem('push_subscription', subscriptionJSON);
}

/**
 * Загружает подписку из localStorage
 */
export function loadSubscriptionFromLocalStorage(): PushSubscription | null {
  if (typeof window === 'undefined') return null;
  
  const subscriptionJSON = localStorage.getItem('push_subscription');
  if (!subscriptionJSON) return null;
  
  try {
    const subscriptionData = JSON.parse(subscriptionJSON);
    // Восстанавливаем PushSubscription объект
    // В реальности это должно быть через API бэкенда
    return subscriptionData as any;
  } catch (error) {
    console.error('[Push Notifications] Failed to load subscription:', error);
    return null;
  }
}

