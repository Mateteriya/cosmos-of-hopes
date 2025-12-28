# Edge Function: send-new-year-notifications

Отправляет push-уведомления пользователям в новогоднюю ночь.

## Требования

- VAPID ключи настроены в Supabase Secrets
- Таблица `push_subscriptions` создана
- Планировщик (cron) настроен для вызова функции каждые 5 минут

## Логика работы

1. Получает все активные подписки из базы данных
2. Для каждой подписки:
   - Определяет локальное время пользователя (по timezone из комнаты)
   - Проверяет, 31 декабря ли сейчас
   - **23:57** - отправляет уведомление о шаре в космос (если есть шар на ёлке)
   - **22:50** - отправляет уведомление о запуске комнаты (если создал комнату)
3. Удаляет недействительные подписки

## Вызов

```bash
curl -X POST \
  -H "Authorization: Bearer ваш-cron-secret-key" \
  https://ваш-project-ref.supabase.co/functions/v1/send-new-year-notifications
```

## Ответ

```json
{
  "success": true,
  "sent": 5,
  "errors": 0,
  "invalidSubscriptions": 1
}
```

