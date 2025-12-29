# 🚀 Настройка Push-уведомлений на сервере

## Шаг 1: Найти директорию проекта

```bash
# Поиск директории проекта
find /root /home /var/www -name "cosmos-of-hopes" -type d 2>/dev/null

# Или проверьте, где PM2 запускает приложение
pm2 info cosmos-of-hopes | grep "script path"
```

## Шаг 2: Перейти в директорию проекта

```bash
cd /найденный/путь/cosmos-of-hopes
pwd  # Проверить текущую директорию
```

## Шаг 3: Проверить наличие скрипта

```bash
ls -la scripts/send-push-notifications-server.js
```

Если файла нет, нужно скопировать его на сервер.

## Шаг 4: Установить зависимости

```bash
# Проверить package.json
cat package.json | grep -A 5 "dependencies"

# Установить зависимости
npm install web-push node-cron dotenv
```

## Шаг 5: Настроить .env.local

```bash
# Проверить, есть ли .env.local
ls -la .env.local

# Если нет, создать
nano .env.local
```

Добавьте (используйте ваши ключи):
```env
NEXT_PUBLIC_SUPABASE_URL=https://pjvbiblalapcbgwpojvm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_rbnfTQkofSYumZsNKRUklg_isgW42ZP
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BKQO-oVx2u2Dnz38U7RwbRvOnxNGb9QI6JP9_PmWZZ94D4q5NpdqLXmwEFYlH9IpJiP1eZEZfvV84iIjN7smOnA
VAPID_PRIVATE_KEY=okPEY6b0ljhnrJ9bhc79FaIGSddOzdRHb2yqrWaNRro
VAPID_PUBLIC_KEY=BKQO-oVx2u2Dnz38U7RwbRvOnxNGb9QI6JP9_PmWZZ94D4q5NpdqLXmwEFYlH9IpJiP1eZEZfvV84iIjN7smOnA
VAPID_EMAIL=mailto:mateteriya@gmail.com
SUPABASE_SERVICE_ROLE_KEY=sb_secret_DpdPMwDSyhm3aapXV984_g_XAXO6g5J
```

Сохраните (Ctrl+O, Enter, Ctrl+X).

## Шаг 6: Запустить сервер

```bash
# Проверить, что скрипт существует
ls -la scripts/send-push-notifications-server.js

# Запустить через PM2
pm2 start scripts/send-push-notifications-server.js --name push-notifications

# Проверить статус
pm2 status

# Посмотреть логи
pm2 logs push-notifications
```

## Шаг 7: Настроить автозапуск

```bash
# Сохранить текущие процессы
pm2 save

# Настроить автозапуск
pm2 startup
# Выполните команду, которую выведет PM2
```

## Проверка работы

```bash
# Посмотреть логи в реальном времени
pm2 logs push-notifications --lines 50

# Должны видеть:
# 🚀 Сервер push-уведомлений запущен
# ⏰ Проверка каждые 5 минут
# 🔔 Проверка уведомлений...
```

## Если скрипт не найден

Если файл `scripts/send-push-notifications-server.js` не существует на сервере:

1. Скопируйте файл с локального компьютера на сервер
2. Или создайте файл вручную через nano
3. Или используйте git pull для обновления проекта

