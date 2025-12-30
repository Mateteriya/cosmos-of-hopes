# Как посмотреть оценки приложения

## Где хранятся оценки

Оценки приложения хранятся в таблице `app_ratings` в базе данных Supabase.

## Структура таблицы

- `id` - UUID, уникальный идентификатор записи
- `user_id` - TEXT, ID пользователя (из localStorage)
- `rating` - INTEGER, оценка от 1 до 5 звезд
- `created_at` - TIMESTAMPTZ, дата и время оценки

**Важно:** Один пользователь может оценить приложение только один раз (UNIQUE constraint на `user_id`).

## Способы просмотра оценок

### 1. Через Supabase Dashboard

1. Войдите в Supabase Dashboard
2. Перейдите в раздел **Table Editor**
3. Откройте таблицу **app_ratings**
4. Там вы увидите все оценки:
   - `user_id` - ID пользователя
   - `rating` - оценка (1-5)
   - `created_at` - когда была поставлена оценка

### 2. SQL запросы для статистики

**Общее количество оценок:**
```sql
SELECT COUNT(*) as total_ratings
FROM app_ratings;
```

**Средняя оценка:**
```sql
SELECT AVG(rating) as average_rating, COUNT(*) as total_ratings
FROM app_ratings;
```

**Распределение оценок:**
```sql
SELECT 
  rating,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM app_ratings), 2) as percentage
FROM app_ratings
GROUP BY rating
ORDER BY rating DESC;
```

**Последние 10 оценок:**
```sql
SELECT user_id, rating, created_at
FROM app_ratings
ORDER BY created_at DESC
LIMIT 10;
```

**Количество оценок по дням:**
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as count
FROM app_ratings
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 3. Создание представления (View) для удобства

Можно создать представление для быстрого доступа к статистике:

```sql
CREATE OR REPLACE VIEW app_ratings_stats AS
SELECT 
  COUNT(*) as total_ratings,
  AVG(rating) as average_rating,
  MIN(rating) as min_rating,
  MAX(rating) as max_rating,
  COUNT(CASE WHEN rating = 5 THEN 1 END) as five_stars,
  COUNT(CASE WHEN rating = 4 THEN 1 END) as four_stars,
  COUNT(CASE WHEN rating = 3 THEN 1 END) as three_stars,
  COUNT(CASE WHEN rating = 2 THEN 1 END) as two_stars,
  COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
FROM app_ratings;
```

Затем можно просто запросить:
```sql
SELECT * FROM app_ratings_stats;
```

## Применение миграции

Чтобы создать таблицу `app_ratings`, выполните SQL миграцию:

```bash
# Через Supabase Dashboard:
# 1. Перейдите в SQL Editor
# 2. Откройте файл supabase/migrations/create_app_ratings.sql
# 3. Выполните SQL запрос

# Или через Supabase CLI:
supabase db push
```

## Примечания

- Оценки сохраняются только один раз на пользователя
- Если пользователь попытается оценить повторно, будет ошибка (UNIQUE constraint)
- Для изменения оценки пользователю нужно будет удалить старую запись вручную через SQL

