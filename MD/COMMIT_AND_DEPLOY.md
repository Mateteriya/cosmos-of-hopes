# Коммит и деплой изменений

## ⚠️ ВАЖНО: Redirect URLs в Supabase

**Две звездочки НЕ нужны!** Используйте только:
```
https://super2026.online
```

Если уже добавили с `/**` - можно оставить оба варианта, но достаточно одного без звездочек.

---

## 📦 Шаг 1: Проверка изменений

```bash
cd C:\Projects\NewDreamer\cosmos-of-hopes
git status
```

---

## 📝 Шаг 2: Добавление файлов в Git

### Основные файлы приложения:
```bash
git add app/
git add components/
git add lib/
git add scripts/
git add supabase/
git add package.json
git add package-lock.json
git add next.config.ts
```

### Документация (опционально, можно добавить позже):
```bash
git add *.md
```

---

## 💾 Шаг 3: Коммит

```bash
git commit -m "Исправления: async getOrCreateUserId, регистрация пользователей, уведомления"
```

---

## 🚀 Шаг 4: Отправка в Git

```bash
git push
```

---

## 🔄 Шаг 5: Деплой на сервер

**На сервере выполните:**

```bash
cd /root/cosmos-of-hopes
git pull
npm install
npm run build
pm2 restart cosmos-of-hopes
```

---

## ✅ Проверка после деплоя

1. Откройте `https://super2026.online` в **инкогнито режиме** (чтобы проверить без кеша)
2. Проверьте, что кнопка "Включить уведомления" появляется в правом верхнем углу
3. Проверьте консоль браузера (F12) на наличие ошибок

---

## 🐛 Если кнопка не появляется

1. **Очистите кеш браузера** (Ctrl+Shift+Delete)
2. **Откройте в инкогнито режиме**
3. **Проверьте консоль браузера** (F12 → Console) на ошибки
4. **Проверьте, что Service Worker зарегистрирован** (F12 → Application → Service Workers)

---

## 📋 Список измененных файлов

### Исправления async/await:
- `components/notifications/NotificationPromptButton.tsx`
- `components/notifications/NotificationManager.tsx`
- `components/notifications/NotificationPrompt.tsx`
- `components/notifications/PushNotificationButton.tsx`
- `app/tree/page.tsx`
- `app/create/page.tsx`

### Новые компоненты:
- `components/auth/` (AuthButton, AuthModal)
- `components/info/` (BrowserBindingInfo)
- `lib/auth.ts`
- `lib/userMigration.ts`
- `scripts/send-push-notifications-server.js`
- `supabase/migration_add_user_registration.sql`

### Обновленные файлы:
- `app/layout.tsx` (добавлены AuthButton, BrowserBindingInfo)
- `app/page.tsx` (добавлен NotificationPromptButton)
- `lib/userId.ts` (теперь async)
- `package.json` (новые зависимости)

