# Исправление проблемы с подтверждением email

## Проблема:
При регистрации Supabase отправляет ссылку подтверждения с `localhost:3000` вместо реального домена.

## Решение:

### Шаг 1: Обновить Site URL в Supabase

1. Откройте **Supabase Dashboard**: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **Settings** (Настройки) → **API**
4. Найдите раздел **"Project URL"** или **"Site URL"**
5. Измените **Site URL** на:
   ```
   https://super2026.online
   ```
6. Сохраните изменения

### Шаг 2: Обновить Redirect URLs

1. В том же проекте перейдите в **Authentication** → **URL Configuration**
2. В разделе **"Redirect URLs"** добавьте:
   ```
   https://super2026.online
   https://super2026.online/**
   ```
3. Убедитесь, что там НЕТ `http://localhost:3000` (или удалите его, если есть)
4. Сохраните изменения

### Шаг 3: Проверить переменные окружения

Убедитесь, что в `.env.local` на сервере есть:
```env
NEXT_PUBLIC_APP_URL=https://super2026.online
```

### Шаг 4: Перезапустить приложение

```bash
cd /root/cosmos-of-hopes
pm2 restart cosmos-of-hopes
```

## После исправления:

1. Новые регистрации будут получать ссылки с правильным доменом
2. Старые ссылки (с localhost) больше не будут работать - нужно будет зарегистрироваться заново

## Альтернативное решение (если не можете найти Site URL):

Если в настройках нет поля "Site URL", используйте **Email Templates**:

1. Перейдите в **Authentication** → **Email Templates**
2. Найдите шаблон **"Confirm signup"**
3. В шаблоне найдите переменную `{{ .ConfirmationURL }}`
4. Замените её на:
   ```
   https://super2026.online/auth/confirm?token={{ .Token }}
   ```
5. Или используйте полный URL с токеном

Но лучше всего - обновить Site URL в настройках проекта.

