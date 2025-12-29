# 📱 Полная настройка Push-уведомлений

## Шаг 1: Генерация VAPID ключей

Выполните на сервере или локально:

```bash
# Установите web-push (если еще не установлен)
npm install -g web-push

# Сгенерируйте VAPID ключи
web-push generate-vapid-keys
```

Сохраните полученные ключи:
- **Public Key** - нужен для клиента
- **Private Key** - нужен для сервера (секретный!)

## Шаг 2: Настройка переменных окружения в Supabase

1. Откройте Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Добавьте следующие секреты:

```
VAPID_PUBLIC_KEY=ваш_public_key
VAPID_PRIVATE_KEY=ваш_private_key
VAPID_EMAIL=mailto:your-email@example.com
CRON_SECRET_KEY=случайная_строка_для_безопасности
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_key
```

## Шаг 3: Обновление клиентского кода

Добавьте VAPID Public Key в `.env.local`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=ваш_public_key
```

## Шаг 4: Деплой Edge Function

```bash
# Установите Supabase CLI (если еще не установлен)
npm install -g supabase

# Войдите в Supabase
supabase login

# Свяжите проект
supabase link --project-ref ваш-project-ref

# Деплой функции
supabase functions deploy send-new-year-notifications
```

## Шаг 5: Настройка планировщика (Cron)

### Вариант 1: GitHub Actions (бесплатно, каждые 5 минут)

Создайте файл `.github/workflows/push-notifications.yml`:

```yaml
name: Send New Year Push Notifications

on:
  schedule:
    # Запускается каждые 5 минут
    - cron: '*/5 * * * *'
  workflow_dispatch: # Позволяет запускать вручную

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_KEY }}" \
            https://ваш-project-ref.supabase.co/functions/v1/send-new-year-notifications
```

Добавьте `CRON_SECRET_KEY` в GitHub Secrets.

### Вариант 2: Vercel Cron (если деплой на Vercel)

Создайте файл `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/push-notifications",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Создайте API route `app/api/cron/push-notifications/route.ts`:

```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET_KEY;
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-new-year-notifications`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET_KEY}`,
      },
    }
  );

  const data = await response.json();
  return NextResponse.json(data);
}
```

### Вариант 3: Отдельный Node.js сервер (надежнее)

Создайте файл `scripts/push-notifications-cron.js`:

```javascript
const cron = require('node-cron');
const fetch = require('node-fetch');

// Запускается каждые 5 минут
cron.schedule('*/5 * * * *', async () => {
  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/send-new-year-notifications`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();
    console.log('Push notifications sent:', data);
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
});
```

Запустите на сервере:
```bash
node scripts/push-notifications-cron.js
```

## Шаг 6: Тестирование

### Тест вручную:

```bash
curl -X POST \
  -H "Authorization: Bearer ваш-cron-secret-key" \
  https://ваш-project-ref.supabase.co/functions/v1/send-new-year-notifications
```

### Проверка логов:

```bash
supabase functions logs send-new-year-notifications
```

## Важно

1. **Время пользователя**: Функция вычисляет локальное время на основе timezone из комнаты пользователя
2. **Проверка шаров**: Отправляет уведомление только пользователям, у которых есть шар на ёлке (status = 'on_tree')
3. **Проверка комнат**: Отправляет уведомление только создателям комнат
4. **Очистка**: Автоматически удаляет недействительные подписки

## Упрощенная альтернатива

Если настройка серверной части сложна, можно использовать клиентскую логику:
- Проверка времени в браузере
- Показ уведомления через браузерный API
- Работает только когда пользователь онлайн

См. `PUSH_NOTIFICATIONS_PLAN.md` для деталей.

