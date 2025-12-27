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
  if (!('Notification' in window)) {
    throw new Error('Браузер не поддерживает уведомления');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('Разрешение на уведомления отклонено');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Регистрирует Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[Push Notifications] Service Worker registered:', registration);
    
    // Ждем, пока Service Worker активируется
    await navigator.serviceWorker.ready;
    
    return registration;
  } catch (error) {
    console.error('[Push Notifications] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Конвертирует base64 VAPID ключ в Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
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

    if (!VAPID_PUBLIC_KEY) {
      console.warn('[Push Notifications] VAPID public key not configured');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
    });

    console.log('[Push Notifications] Subscribed:', subscription);
    return subscription;
  } catch (error) {
    console.error('[Push Notifications] Subscription failed:', error);
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

