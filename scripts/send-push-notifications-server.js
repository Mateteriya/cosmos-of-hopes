/**
 * Node.js сервер для отправки push-уведомлений
 * Альтернатива Edge Function, если нужна более простая настройка
 * 
 * Запуск: node scripts/send-push-notifications-server.js
 * Или через PM2: pm2 start scripts/send-push-notifications-server.js --name push-notifications
 */

require('dotenv').config({ path: '.env.local' });
const webpush = require('web-push');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

// VAPID ключи из переменных окружения
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:your-email@example.com';

// Supabase клиент
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('❌ VAPID ключи не настроены!');
  console.error('Сгенерируйте их: web-push generate-vapid-keys');
  process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase ключи не настроены!');
  process.exit(1);
}

// Настройка web-push
webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Получает локальное время пользователя
 */
function getUserLocalTime(timezone = 'Europe/Moscow') {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year').value);
  const month = parseInt(parts.find(p => p.type === 'month').value) - 1;
  const day = parseInt(parts.find(p => p.type === 'day').value);
  const hour = parseInt(parts.find(p => p.type === 'hour').value);
  const minute = parseInt(parts.find(p => p.type === 'minute').value);
  const second = parseInt(parts.find(p => p.type === 'second').value);
  
  return new Date(year, month, day, hour, minute, second);
}

/**
 * Проверяет, есть ли у пользователя шар на ёлке
 */
async function checkUserHasBallOnTree(userId) {
  const { data, error } = await supabase
    .from('toys')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'on_tree')
    .limit(1);
  
  if (error) {
    console.error(`Error checking ball for user ${userId}:`, error);
    return false;
  }
  
  return (data?.length || 0) > 0;
}

/**
 * Проверяет, создал ли пользователь комнату
 */
async function checkUserCreatedRoom(userId) {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, timezone')
    .eq('creator_id', userId)
    .limit(1);
  
  if (error) {
    console.error(`Error checking room for user ${userId}:`, error);
    return { hasRoom: false };
  }
  
  if (data && data.length > 0) {
    return { hasRoom: true, timezone: data[0].timezone };
  }
  
  return { hasRoom: false };
}

/**
 * Отправляет push-уведомление
 */
async function sendPushNotification(subscription, title, body, url = '/tree') {
  try {
    const payload = JSON.stringify({
      title,
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'new-year-notification',
      data: { url },
    });

    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (error) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Подписка недействительна
      return false;
    }
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Основная функция отправки уведомлений
 */
async function sendNewYearNotifications() {
  console.log('🔔 Проверка уведомлений...', new Date().toISOString());

  try {
    // Получаем все подписки
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('user_id, subscription');

    if (error) {
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('ℹ️ Нет активных подписок');
      return;
    }

    console.log(`📋 Найдено подписок: ${subscriptions.length}`);

    let sentCount = 0;
    let errorCount = 0;
    const invalidSubscriptions = [];

    for (const sub of subscriptions) {
      try {
        const userId = sub.user_id;
        const pushSub = sub.subscription;

        // Получаем timezone пользователя
        const { hasRoom, timezone } = await checkUserCreatedRoom(userId);
        const userTimezone = timezone || 'Europe/Moscow';
        const userLocalTime = getUserLocalTime(userTimezone);

        // Проверяем, 31 декабря
        const isDec31 = userLocalTime.getMonth() === 11 && userLocalTime.getDate() === 31;
        
        if (!isDec31) {
          continue;
        }

        // Уведомление в 23:57 (шар в космос)
        const is2357 = userLocalTime.getHours() === 23 && userLocalTime.getMinutes() === 57;

        if (is2357) {
          const hasBall = await checkUserHasBallOnTree(userId);
          
          if (hasBall) {
            const sent = await sendPushNotification(
              pushSub,
              'Через 2 минуты ваш шар отправится в космос!',
              'Не пропустите волшебный момент - ваш шар с желанием скоро отправится в космос 2026+ для исполнения! Вы сможете увидеть это волшебство на ёлке.',
              '/tree'
            );
            
            if (sent) {
              sentCount++;
              console.log(`✅ Уведомление отправлено пользователю ${userId} (шар в космос)`);
            } else {
              invalidSubscriptions.push(userId);
            }
          }
        }

        // Уведомление в 22:50 (запуск комнаты)
        const is2250 = userLocalTime.getHours() === 22 && userLocalTime.getMinutes() === 50;

        if (is2250 && hasRoom) {
          const sent = await sendPushNotification(
            pushSub,
            'Время запустить вашу комнату!',
            'Рекомендуем запустить вашу комнату для празднования Нового года и напомнить всем гостям о начале мероприятия!',
            '/rooms'
          );
          
          if (sent) {
            sentCount++;
            console.log(`✅ Уведомление отправлено пользователю ${userId} (запуск комнаты)`);
          } else {
            invalidSubscriptions.push(userId);
          }
        }
      } catch (error) {
        console.error(`❌ Ошибка обработки подписки для ${sub.user_id}:`, error);
        errorCount++;
      }
    }

    // Удаляем недействительные подписки
    if (invalidSubscriptions.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('user_id', invalidSubscriptions);
      
      console.log(`🗑️ Удалено недействительных подписок: ${invalidSubscriptions.length}`);
    }

    console.log(`✅ Отправлено: ${sentCount}, Ошибок: ${errorCount}`);
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

// Запускаем каждые 5 минут
console.log('🚀 Сервер push-уведомлений запущен');
console.log('⏰ Проверка каждые 5 минут');

// Первый запуск сразу
sendNewYearNotifications();

// Затем по расписанию
cron.schedule('*/5 * * * *', () => {
  sendNewYearNotifications();
});

