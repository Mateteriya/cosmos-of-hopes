# 🚀 КОМАНДЫ ДЛЯ СБОРКИ ПРИЛОЖЕНИЯ

## 📍 ЛОКАЛЬНАЯ ПРОВЕРКА (Windows)

### 1. Перейти в папку проекта
```powershell
cd C:\Projects\NewDreamer\cosmos-of-hopes
```

### 2. Установить зависимости
```powershell
npm install
```

### 3. Очистить кеш (если были проблемы)
```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
```

### 4. Проверить сборку локально
```powershell
npm run build
```

**Если сборка успешна**, вы увидите:
```
✓ Compiled successfully
```

### 5. Запустить для проверки (опционально)
```powershell
npm run dev
```

---

## 🖥️ ДЕПЛОЙ НА СЕРВЕР (Linux)

### 1. Подключиться к серверу
```bash
ssh root@ваш_сервер_ip
```

### 2. Перейти в папку проекта
```bash
cd ~/cosmos-of-hopes
```

### 3. Остановить приложение
```bash
pm2 stop cosmos-of-hopes
```

### 4. Получить последние изменения из Git
```bash
git pull origin main
```

**Если были локальные изменения**, которые нужно откатить:
```bash
git fetch origin
git reset --hard origin/main
```

### 5. Установить зависимости
```bash
npm install
```

### 6. Очистить кеш сборки
```bash
rm -rf .next
rm -rf node_modules/.cache
```

### 7. Собрать приложение для продакшена
```bash
npm run build
```

**Если сборка успешна**, вы увидите:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

### 8. Запустить приложение
```bash
pm2 restart cosmos-of-hopes --update-env
```

### 9. Проверить статус
```bash
pm2 status
pm2 logs cosmos-of-hopes --lines 50
```

---

## ⚠️ ЕСЛИ ВОЗНИКЛИ ПРОБЛЕМЫ

### Ошибка: "Could not find a production build"
```bash
cd ~/cosmos-of-hopes
rm -rf .next
npm run build
pm2 restart cosmos-of-hopes
```

### Ошибка: "Module not found" или "Export doesn't exist"
```bash
cd ~/cosmos-of-hopes
git pull origin main
git reset --hard origin/main
rm -rf node_modules .next
npm install
npm run build
pm2 restart cosmos-of-hopes
```

### Ошибка: Порт занят
```bash
pm2 delete cosmos-of-hopes
cd ~/cosmos-of-hopes
npm run build
pm2 start npm --name "cosmos-of-hopes" -- start
pm2 save
```

---

## 📝 ПРОВЕРКА РАБОТЫ

### После деплоя проверьте:

1. **Откройте в браузере**: `http://ваш_домен` или `http://ваш_ip:3000`

2. **Проверьте логи**:
```bash
pm2 logs cosmos-of-hopes --lines 100
```

3. **Проверьте что нет ошибок** в консоли браузера (F12 → Console)

---

## 🔄 БЫСТРАЯ ПЕРЕСБОРКА (если что-то сломалось)

```bash
cd ~/cosmos-of-hopes
git pull
rm -rf .next node_modules/.cache
npm install
npm run build
pm2 restart cosmos-of-hopes --update-env
```

