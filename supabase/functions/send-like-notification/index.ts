// Supabase Edge Function для отправки push-уведомлений о лайках
// Вызывается при добавлении лайка к шару

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  const decoded = atob(base64 + padding);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
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

  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(JSON.stringify(header));
  const payloadBytes = encoder.encode(JSON.stringify(payload));

  const keyData = base64UrlToUint8Array(privateKey);
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new Uint8Array([...headerBytes, ...payloadBytes])
  );

  // Упрощенная версия - в реальности нужна правильная кодировка JWT
  const jwt = btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload)) + '.' + btoa(String.fromCharCode(...new Uint8Array(signature)));
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
      tag: 'like-notification',
      data: { url },
    });

    const endpoint = new URL(subscription.endpoint);
    const audience = `${endpoint.protocol}//${endpoint.host}`;

    const expirationTime = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
    const jwt = await createVapidJWT(audience, VAPID_EMAIL, expirationTime, VAPID_PRIVATE_KEY);

    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(payload);

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

serve(async (req) => {
  try {
    const { toyOwnerId, toyId } = await req.json();

    if (!toyOwnerId) {
      return new Response(
        JSON.stringify({ error: 'toyOwnerId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Создаем клиент Supabase с service role key
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

    // Получаем подписку владельца шара
    const { data: subscriptionData, error: subsError } = await supabaseClient
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', toyOwnerId)
      .single();

    if (subsError || !subscriptionData) {
      // Пользователь не подписан на уведомления - это нормально
      return new Response(
        JSON.stringify({ message: 'User not subscribed to notifications', sent: false }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const pushSubscription: PushSubscription = subscriptionData.subscription;

    // Отправляем уведомление
    const sent = await sendPushNotification(
      pushSubscription,
      '✨ Ваш шар получил лайк!',
      'Кто-то поддержал ваш шар желаний',
      '/tree'
    );

    return new Response(
      JSON.stringify({ success: true, sent }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-like-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

