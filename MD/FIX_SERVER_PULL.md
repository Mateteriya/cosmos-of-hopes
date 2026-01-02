# Исправление конфликта на сервере

## Проблема
На сервере есть локальные изменения в `components/rooms/VideoRoom.tsx`, которые конфликтуют с изменениями из репозитория.

## Решение

### Вариант 1: Сохранить локальные изменения (рекомендуется)

```bash
# Сохранить локальные изменения во временное хранилище
git stash

# Получить обновления
git pull origin main

# Посмотреть, что было сохранено
git stash show -p

# Если нужно вернуть локальные изменения:
git stash pop

# Если локальные изменения не нужны, просто удалить stash:
git stash drop
```

### Вариант 2: Отменить локальные изменения (если они не нужны)

```bash
# Посмотреть, что изменилось
git diff components/rooms/VideoRoom.tsx

# Если изменения не нужны, отменить их
git checkout -- components/rooms/VideoRoom.tsx

# Теперь можно сделать pull
git pull origin main
```

### Вариант 3: Закоммитить локальные изменения

```bash
# Добавить изменения
git add components/rooms/VideoRoom.tsx

# Закоммитить
git commit -m "Локальные изменения VideoRoom.tsx"

# Теперь можно сделать pull
git pull origin main

# Если будет конфликт, разрешить его вручную
```

---

## После успешного pull:

```bash
npm install  # если были изменения в package.json
npm run build
pm2 restart cosmos-of-hopes --update-env
```

