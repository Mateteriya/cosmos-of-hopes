# Исправление конфликта при git pull на сервере

## Проблема:
На сервере есть локальные изменения в `package.json`, `package-lock.json` и файл `scripts/send-push-notifications-server.js` уже существует.

## Решение:

### Вариант 1: Сохранить локальные изменения (если они важны)

```bash
cd /root/cosmos-of-hopes

# Сохранить локальные изменения
git stash

# Переместить/удалить существующий файл
mv scripts/send-push-notifications-server.js scripts/send-push-notifications-server.js.backup

# Получить изменения из Git
git pull

# Если нужно восстановить локальные изменения:
git stash pop
```

### Вариант 2: Перезаписать локальные изменения (рекомендуется)

```bash
cd /root/cosmos-of-hopes

# Удалить существующий файл (он будет заменен версией из Git)
rm scripts/send-push-notifications-server.js

# Отменить локальные изменения в package.json и package-lock.json
git checkout -- package.json package-lock.json

# Получить изменения из Git
git pull
```

### Вариант 3: Принудительный сброс (если ничего важного нет)

```bash
cd /root/cosmos-of-hopes

# Удалить файл
rm scripts/send-push-notifications-server.js

# Сбросить все локальные изменения
git reset --hard HEAD

# Получить изменения из Git
git pull
```

## После успешного git pull:

```bash
npm install
npm run build
pm2 restart cosmos-of-hopes
```

