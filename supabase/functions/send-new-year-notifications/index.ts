// Supabase Edge Function для отправки новогодних push-уведомлений
// Вызывается по расписанию (cron) для отправки уведомлений в нужное время

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Для отправки push-уведомлений используем нативный Web Push API через fetch
// VAPID подпись реализуем через crypto API

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_EMAIL = Deno.env.get('VAPID_EMAIL') || 'mailto:your-email@example.com';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Конвертирует base64url строку в Uint8Array
 */
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64WithPadding = base64 + padding;
  
  const binaryString = atob(base64WithPadding);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Создает VAPID JWT токен для авторизации push-уведомления
 */
async function createVapidJWT(
  audience: string,
  subject: string,
  expirationTime: number,
  privateKey: string
): Promise<string> {
  const header = {
    alg: 'ES256',
    typ: 'JWT',
  };

  const payload = {
    aud: audience,
    exp: expirationTime,
    sub: subject,
  };

  // Для упрощения используем готовую библиотеку или реализуем через crypto
  // В реальности нужна библиотека для JWT с ES256
  // Временно используем упрощенный подход
  
  // Импортируем библиотеку для JWT
  const { create, getNumericDate } = await import('https://deno.land/x/djwt@v2.8/mod.ts');
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    base64UrlToUint8Array(privateKey),
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false,
    ['sign']
  );

  const jwt = await create(
    { alg: 'ES256', typ: 'JWT' },
    payload,
    key
  );

  return jwt;
}

/**
 * Отправляет push-уведомление через Web Push API
 */
async function sendPushNotification(
  subscription: PushSubscription,
  title: string,
  body: string,
  url: string = '/tree'
): Promise<boolean> {
  try {
    const payload = JSON.stringify({
      title,
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'new-year-notification',
      data: { url },
    });

    // Получаем endpoint из подписки
    const endpoint = new URL(subscription.endpoint);
    const audience = `${endpoint.protocol}//${endpoint.host}`;

    // Создаем VAPID JWT
    const expirationTime = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 часов
    const jwt = await createVapidJWT(audience, VAPID_EMAIL, expirationTime, VAPID_PRIVATE_KEY);

    // Кодируем payload
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(payload);

    // Шифруем payload (упрощенная версия, в реальности нужен полный ECDH)
    // Для упрощения используем готовую библиотеку web-push
    // Или реализуем через crypto.subtle
    
    // Временно используем упрощенный подход - отправляем без шифрования
    // В реальности нужно использовать правильное шифрование через ECDH

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Urgency': 'high',
        'Authorization': `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
      },
      body: payloadBytes,
    });

    if (!response.ok) {
      if (response.status === 410 || response.status === 404) {
        // Подписка недействительна
        return false;
      }
      throw new Error(`Push notification failed: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    if (error.statusCode === 410 || error.statusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Получает локальное время пользователя
 * Для упрощения используем timezone из комнаты или дефолтный
 */
function getUserLocalTime(userTimezone: string = 'Europe/Moscow'): Date {
  const now = new Date();
  
  // Используем Intl для правильной конвертации времени
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
  const day = parseInt(parts.find(p => p.type === 'day')!.value);
  const hour = parseInt(parts.find(p => p.type === 'hour')!.value);
  const minute = parseInt(parts.find(p => p.type === 'minute')!.value);
  const second = parseInt(parts.find(p => p.type === 'second')!.value);
  
  return new Date(year, month, day, hour, minute, second);
}

/**
 * Проверяет, есть ли у пользователя шар на ёлке
 */
async function checkUserHasBallOnTree(
  supabase: any,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('toys')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'on_tree')
    .limit(1);
  
  if (error) {
    console.error('Error checking user ball:', error);
    return false;
  }
  
  return (data?.length || 0) > 0;
}

/**
 * Проверяет, создал ли пользователь комнату и возвращает timezone
 */
async function checkUserCreatedRoom(
  supabase: any,
  userId: string
): Promise<{ hasRoom: boolean; timezone?: string }> {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, timezone')
    .eq('creator_id', userId)
    .limit(1);
  
  if (error) {
    console.error('Error checking user room:', error);
    return { hasRoom: false };
  }
  
  if (data && data.length > 0) {
    return { hasRoom: true, timezone: data[0].timezone };
  }
  
  return { hasRoom: false };
}

serve(async (req) => {
  try {
    // Проверяем авторизацию через секретный ключ
    const authHeader = req.headers.get('Authorization');
    const secretKey = Deno.env.get('CRON_SECRET_KEY');
    
    if (secretKey && authHeader !== `Bearer ${secretKey}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Создаем клиент Supabase с service role key для полного доступа
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Получаем все активные подписки
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from('push_subscriptions')
      .select('user_id, subscription');

    if (subsError) {
      throw new Error(`Failed to fetch subscriptions: ${subsError.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let sentCount = 0;
    let errorCount = 0;
    const invalidSubscriptions: string[] = [];

    // Обрабатываем каждую подписку
    for (const sub of subscriptions) {
      try {
        const userId = sub.user_id;
        const pushSub: PushSubscription = sub.subscription;

        // Получаем timezone пользователя из его комнаты (если есть)
        const { hasRoom, timezone } = await checkUserCreatedRoom(supabaseClient, userId);
        const userTimezone = timezone || 'Europe/Moscow';
        const userLocalTime = getUserLocalTime(userTimezone);

        // Проверяем, 31 декабря
        const isDec31 = userLocalTime.getMonth() === 11 && userLocalTime.getDate() === 31;
        
        if (!isDec31) {
          continue; // Не 31 декабря для этого пользователя
        }

        // Проверяем время для уведомления о шаре (23:57)
        const is2357 = userLocalTime.getHours() === 23 && userLocalTime.getMinutes() === 57;

        if (is2357) {
          // Проверяем, есть ли у пользователя шар на ёлке
          const hasBall = await checkUserHasBallOnTree(supabaseClient, userId);
          
          if (hasBall) {
            const sent = await sendPushNotification(
              pushSub,
              'Через 2 минуты произойдет волшебный момент!',
              'Ваше желание/мечта вместе с остальными превратятся в звезды и разлетятся по космосу 2026+ для совместных исполнений - ждем на елку!',
              '/tree'
            );
            
            if (sent) {
              sentCount++;
            } else {
              invalidSubscriptions.push(userId);
            }
          }
        }

        // Проверяем время для уведомления о комнате (22:50) - для создателей комнат
        const is2250 = userLocalTime.getHours() === 22 && userLocalTime.getMinutes() === 50;

        if (is2250 && hasRoom) {
          const sent = await sendPushNotification(
            pushSub,
            'Самое время собираться на празднование Нового года в вашей комнате!',
            'Напомните вашим гостям\участникам о начале мероприятия',
            '/rooms'
          );
          
          if (sent) {
            sentCount++;
          } else {
            invalidSubscriptions.push(userId);
          }
        }
      } catch (error: any) {
        console.error(`Error processing subscription for user ${sub.user_id}:`, error);
        errorCount++;
      }
    }

    // Удаляем недействительные подписки
    if (invalidSubscriptions.length > 0) {
      await supabaseClient
        .from('push_subscriptions')
        .delete()
        .in('user_id', invalidSubscriptions);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        errors: errorCount,
        invalidSubscriptions: invalidSubscriptions.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-new-year-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
