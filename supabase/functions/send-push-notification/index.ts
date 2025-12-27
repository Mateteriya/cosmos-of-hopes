// Supabase Edge Function для отправки Push уведомлений
// Этот файл должен быть задеплоен в Supabase как Edge Function

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

serve(async (req) => {
  try {
    const { userId, title, body, url, tag } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Создаем клиент Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Получаем подписку пользователя из базы данных
    // TODO: Создать таблицу push_subscriptions
    const { data: subscription, error } = await supabaseClient
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      return new Response(
        JSON.stringify({ error: 'Subscription not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const pushSubscription: PushSubscription = subscription.subscription;

    // Отправляем push уведомление
    const payload = JSON.stringify({
      title: title || 'Cosmos of Hopes',
      body: body || 'У вас новое уведомление',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag || 'notification',
      data: {
        url: url || '/tree',
      },
    });

    // Импортируем web-push для Deno
    // В реальности нужно использовать Deno-совместимую библиотеку или native crypto
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(VAPID_PRIVATE_KEY),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Отправляем уведомление через web push API
    const response = await fetch(pushSubscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'TTL': '86400',
        'Urgency': 'high',
      },
      body: payload,
    });

    if (!response.ok) {
      throw new Error(`Push notification failed: ${response.statusText}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/* 
ПРИМЕЧАНИЕ: Для полной реализации нужно:
1. Установить библиотеку web-push для Deno или использовать native crypto API
2. Создать таблицу push_subscriptions в Supabase
3. Сохранять подписки при регистрации пользователя
4. Настроить VAPID ключи в Supabase secrets

Временное решение: можно использовать отдельный Node.js сервер для отправки push уведомлений
или использовать готовые сервисы типа OneSignal, Firebase Cloud Messaging
*/

