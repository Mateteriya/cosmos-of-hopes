# ⚡ Быстрый старт: Push-уведомления

## Вариант 1: Node.js сервер (рекомендуется для простоты)

### Шаг 1: Установка зависимостей

```bash
cd cosmos-of-hopes
npm install web-push node-cron dotenv @supabase/supabase-js
```

### Шаг 2: Генерация VAPID ключей

```bash
npx web-push generate-vapid-keys
```

Сохраните ключи в `.env.local`:

```env
VAPID_PUBLIC_KEY=ваш_public_key
VAPID_PRIVATE_KEY=ваш_private_key
VAPID_EMAIL=mailto:your-email@example.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=ваш_public_key
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_key
```

### Шаг 3: Запуск сервера

```bash
# Один раз
node scripts/send-push-notifications-server.js

# Или через PM2 (для постоянной работы)
pm2 start scripts/send-push-notifications-server.js --name push-notifications
pm2 save
pm2 startup
```

### Шаг 4: Проверка

Сервер будет проверять уведомления каждые 5 минут и отправлять их в нужное время.

## Вариант 2: Supabase Edge Function (для продакшн)

См. `PUSH_NOTIFICATIONS_SETUP_GUIDE.md` для полной инструкции.

## Что работает

✅ **23:57** - Уведомление о шаре в космос (если есть шар на ёлке)
✅ **22:50** - Уведомление о запуске комнаты (если создал комнату)
✅ Автоматическая очистка недействительных подписок
✅ Учет timezone пользователя из комнаты

## Тестирование

Для тестирования можно временно изменить время в коде:

```javascript
// Вместо проверки 23:57, проверяйте текущее время
const is2357 = true; // для теста
```

## Мониторинг

Логи показывают:
- Количество проверенных подписок
- Количество отправленных уведомлений
- Ошибки
- Удаленные недействительные подписки

