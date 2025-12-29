# Настройка Browser Push Notifications

## Быстрый старт

### 1. Генерация VAPID ключей

Установите `web-push` (если еще не установлено):
```bash
npm install web-push
```

Запустите скрипт генерации ключей:
```bash
npm run generate-vapid-keys
```

Или вручную:
```bash
node scripts/generate-vapid-keys.js
```

### 2. Настройка переменных окружения

Добавьте в `.env.local`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=ваш_public_ключ
VAPID_PRIVATE_KEY=ваш_private_ключ
```

⚠️ **ВАЖНО**: 
- `VAPID_PRIVATE_KEY` - секретный ключ, НЕ публикуйте его!
- Он нужен только на сервере для отправки уведомлений

### 3. Service Worker

Service Worker уже создан в `public/sw.js`. Он автоматически регистрируется при загрузке приложения.

### 4. Проверка работы

1. Запустите приложение: `npm run dev`
2. Откройте главную страницу
3. Нажмите кнопку "Включить уведомления" (правый верхний угол)
4. Разрешите уведомления в браузере
5. Вы должны увидеть тестовое уведомление

## Отправка уведомлений

### Вариант 1: Supabase Edge Functions (Рекомендуется)

1. Создайте Edge Function в Supabase:
   ```bash
   supabase functions new send-push-notification
   ```

2. Скопируйте код из `supabase/functions/send-push-notification/index.ts`

3. Настройте VAPID ключи в Supabase secrets:
   ```bash
   supabase secrets set VAPID_PRIVATE_KEY=ваш_private_ключ
   supabase secrets set VAPID_PUBLIC_KEY=ваш_public_ключ
   supabase secrets set VAPID_EMAIL=mailto:your-email@example.com
   ```

4. Создайте таблицу `push_subscriptions`:
   ```sql
   CREATE TABLE push_subscriptions (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id TEXT NOT NULL,
     subscription JSONB NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user_id)
   );
   ```

5. Отправляйте уведомления через API:
   ```typescript
   await fetch('/api/supabase/functions/v1/send-push-notification', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${supabaseAnonKey}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       userId: 'user_id',
       title: 'Волшебный момент приближается!',
       body: 'Через 2 минуты все шары отправятся в космос!',
       url: '/tree',
       tag: 'new-year-reminder',
     }),
   });
   ```

### Вариант 2: Отдельный Node.js сервер

Если Edge Functions не подходят, можно создать отдельный сервер для отправки уведомлений.

### Вариант 3: Готовые сервисы (Быстро, но требует регистрации)

- OneSignal (бесплатный план до 10,000 подписчиков)
- Firebase Cloud Messaging (FCM)
- Pusher Beams

## Отправка напоминания о 23:58 31 декабря

Нужно настроить cron job или scheduled task, который будет:
1. Проверять текущее время
2. Если до 23:58 31 декабря осталось 2 минуты - отправлять уведомления всем подписанным пользователям
3. Учитывать timezone каждого пользователя

Пример для Supabase Edge Function с pg_cron:
```sql
-- Запускать каждую минуту 31 декабря после 23:00
SELECT cron.schedule(
  'new-year-reminder',
  '* * 23 31 12 *', -- каждую минуту 31 декабря с 23:00
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_ANON_KEY',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'userId', user_id,
      'title', 'Волшебный момент приближается!',
      'body', 'Через 2 минуты все шары отправятся в космос 2026 года!',
      'url', '/tree',
      'tag', 'new-year-reminder'
    )
  )
  FROM push_subscriptions
  WHERE ... -- проверка timezone и времени
  $$
);
```

## Устранение неполадок

### Service Worker не регистрируется
- Проверьте, что файл `sw.js` находится в `public/`
- Проверьте консоль браузера на ошибки
- Убедитесь, что приложение работает по HTTPS (или localhost для разработки)

### Уведомления не приходят
- Проверьте, что разрешение на уведомления выдано
- Проверьте VAPID ключи в `.env.local`
- Проверьте подписку в localStorage: `localStorage.getItem('push_subscription')`
- Проверьте логи сервера/Edge Function

### Ошибка "Subscription not found"
- Убедитесь, что подписка сохраняется в базу данных
- Проверьте, что `user_id` совпадает при сохранении и отправке

## Следующие шаги

1. ✅ Service Worker создан
2. ✅ Компонент подписки создан
3. ⏭ Настроить VAPID ключи
4. ⏭ Создать таблицу push_subscriptions
5. ⏭ Реализовать отправку уведомлений через Edge Function
6. ⏭ Настроить cron job для напоминания о 23:58

