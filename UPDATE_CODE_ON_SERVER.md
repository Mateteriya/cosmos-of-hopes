# Инструкция по обновлению кода на сервере

## Шаг 1: Узнать где находится проект на сервере

Выполните на сервере:

```bash
# Найти где находится проект
find /root -name "VideoRoom.tsx" 2>/dev/null
find /home -name "VideoRoom.tsx" 2>/dev/null
find /var/www -name "VideoRoom.tsx" 2>/dev/null

# Или если используете PM2
pm2 list
pm2 info cosmos-of-hopes  # или имя вашего процесса
```

## Шаг 2: Обновить файл

### Способ A: Через SCP (с вашего компьютера)

```powershell
# В PowerShell на вашем компьютере
cd C:\Projects\NewDreamer\cosmos-of-hopes

# Скопировать файл (замените [ПУТЬ_НА_СЕРВЕРЕ] на реальный путь)
scp components\rooms\VideoRoom.tsx root@[IP-АДРЕС]:[ПУТЬ_НА_СЕРВЕРЕ]/components/rooms/VideoRoom.tsx
```

### Способ B: Через SSH (на сервере)

```bash
# 1. Подключиться к серверу
ssh root@[IP-АДРЕС]

# 2. Перейти в папку проекта
cd /root/cosmos-of-hopes  # или где находится проект

# 3. Открыть файл в редакторе
nano components/rooms/VideoRoom.tsx

# 4. Скопировать содержимое обновленного файла из проекта
# (откройте файл на вашем компьютере и скопируйте всё содержимое)

# 5. Вставить в nano, сохранить (Ctrl+O, Enter, Ctrl+X)
```

### Способ C: Через Git (если используется)

```bash
# На сервере
cd /root/cosmos-of-hopes  # или где находится проект
git pull origin main  # или ваша ветка
```

## Шаг 3: Перезапустить приложение

### Если используете PM2:

```bash
pm2 restart cosmos-of-hopes
# или
pm2 restart all
```

### Если используете systemd:

```bash
systemctl restart cosmos-of-hopes
```

### Если используете npm/yarn напрямую:

```bash
# Остановить процесс (Ctrl+C если запущен в терминале)
# Затем запустить снова
npm run build  # если нужно собрать
npm start  # или npm run dev
```

## Шаг 4: Проверить что обновление применилось

Откройте приложение в браузере и проверьте:
1. Откройте консоль браузера (F12)
2. Войдите в комнату
3. Проверьте URL - должно быть `config.p2p.enabled=false` (не `true`)
4. Проверьте что нет ошибок в консоли

## Важно

После обновления кода нужно:
1. **Пересобрать проект** (если используется Next.js):
   ```bash
   npm run build
   ```

2. **Перезапустить сервер** (PM2, systemd или вручную)

3. **Очистить кеш браузера** (Ctrl+Shift+R или Ctrl+F5)

