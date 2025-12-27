// Service Worker для Browser Push Notifications
// Этот файл должен находиться в public/, чтобы быть доступным по корневому пути

const CACHE_NAME = 'cosmos-of-hopes-v1';

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  // Принудительно активируем новый SW сразу
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  // Берем контроль над всеми страницами сразу
  event.waitUntil(clients.claim());
});

// Обработка push уведомлений
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received:', event);

  let notificationData = {
    title: 'Cosmos of Hopes',
    body: 'Напоминание о волшебном моменте!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'new-year-reminder',
    requireInteraction: true, // Уведомление не исчезнет автоматически
    data: {
      url: '/tree', // Куда перейти при клике
    },
  };

  // Если данные были переданы в push event
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
      };
    } catch (e) {
      // Если данные - просто текст
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
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
    })
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Получаем URL для перехода из данных уведомления
  const urlToOpen = event.notification.data?.url || '/tree';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Проверяем, есть ли уже открытое окно с этим URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Если нет открытого окна, открываем новое
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Обработка ошибок
self.addEventListener('error', (event) => {
  console.error('[Service Worker] Error:', event);
});

