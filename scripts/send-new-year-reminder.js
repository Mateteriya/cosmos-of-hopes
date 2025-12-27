// Скрипт для отправки напоминания о волшебном моменте (23:58 31 декабря)
// Запуск: node scripts/send-new-year-reminder.js
// Или в 23:58 31 декабря: node scripts/send-new-year-reminder.js

const webpush = require('web-push');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = 'mailto:your-email@example.com'; // Замените на ваш email

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('❌ ОШИБКА: VAPID ключи не настроены!');
  console.error('Добавьте NEXT_PUBLIC_VAPID_PUBLIC_KEY и VAPID_PRIVATE_KEY в .env.local');
  process.exit(1);
}

// Настройка web-push
webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Файл для хранения подписок (временно, пока нет базы данных)
const SUBSCRIPTIONS_FILE = path.join(__dirname, '..', 'subscriptions.json');

// Загружаем подписки
function loadSubscriptions() {
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Ошибка загрузки подписок:', error);
  }
  return [];
}

// Сохраняем подписки
function saveSubscriptions(subscriptions) {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
  } catch (error) {
    console.error('Ошибка сохранения подписок:', error);
  }
}

// Отправка уведомления одной подписке
async function sendNotification(subscription, title, body, url = '/tree') {
  const payload = JSON.stringify({
    title,
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'new-year-reminder',
    requireInteraction: true,
    data: {
      url,
    },
    actions: [
      {
        action: 'view',
        title: 'Открыть ёлку',
      },
      {
        action: 'close',
        title: 'Закрыть',
      },
    ],
  });

  try {
    await webpush.sendNotification(subscription, payload);
    console.log('✅ Уведомление отправлено:', subscription.endpoint.substring(0, 50) + '...');
    return true;
  } catch (error) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Подписка больше не действительна - удаляем её
      console.log('⚠️ Подписка больше не действительна, удаляем:', subscription.endpoint.substring(0, 50) + '...');
      return 'expired';
    }
    console.error('❌ Ошибка отправки уведомления:', error.message);
    return false;
  }
}

// Главная функция
async function sendNewYearReminder() {
  console.log('🎄 Отправка напоминания о волшебном моменте...\n');

  const subscriptions = loadSubscriptions();

  if (subscriptions.length === 0) {
    console.log('⚠️ Нет подписок для отправки.');
    console.log('Подписки должны быть сохранены в subscriptions.json');
    console.log('\n💡 Как собрать подписки:');
    console.log('1. Пользователи подписываются через кнопку в приложении');
    console.log('2. Подписки сохраняются в localStorage');
    console.log('3. Скопируйте подписки из localStorage всех пользователей в subscriptions.json');
    return;
  }

  console.log(`📬 Отправляем уведомления ${subscriptions.length} подписчикам...\n`);

  const title = '✨ Волшебный момент приближается!';
  const body = 'Через 2 минуты все шары с мечтами отправятся в космос 2026 года! Не пропустите это волшебство!';
  const url = '/tree';

  let successCount = 0;
  let errorCount = 0;
  let expiredCount = 0;
  const validSubscriptions = [];

  for (const subscription of subscriptions) {
    const result = await sendNotification(subscription, title, body, url);
    
    if (result === true) {
      successCount++;
      validSubscriptions.push(subscription);
    } else if (result === 'expired') {
      expiredCount++;
    } else {
      errorCount++;
      // Оставляем подписку на случай временной ошибки
      validSubscriptions.push(subscription);
    }

    // Небольшая задержка между отправками
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Сохраняем только валидные подписки
  saveSubscriptions(validSubscriptions);

  console.log('\n📊 Результаты:');
  console.log(`✅ Успешно отправлено: ${successCount}`);
  console.log(`❌ Ошибок: ${errorCount}`);
  console.log(`⚠️ Недействительных подписок (удалено): ${expiredCount}`);
  console.log(`\n🎉 Готово!`);
}

// Запуск
sendNewYearReminder().catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});

