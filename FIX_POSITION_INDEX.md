# Исправление ошибки сохранения шаров

## Проблема
Пользователи не могут сохранить шары. Ошибка: `Could not find the 'position_index' column of 'toys' in the schema cache`

## Причина
В коде используется колонка `position_index` для позиционирования шаров на ёлке, но эта колонка отсутствует в базе данных Supabase.

## Решение

### Шаг 1: Выполнить SQL в Supabase

1. Откройте Supabase Dashboard: https://supabase.com/dashboard
2. Выберите проект `pjvbiblalapcbgwpojvm`
3. Перейдите в раздел **SQL Editor**
4. Выполните следующий SQL-скрипт:

```sql
-- Добавление колонки position_index в таблицу toys
ALTER TABLE toys ADD COLUMN IF NOT EXISTS position_index INTEGER;

-- Создаем индекс для быстрого поиска по position_index
CREATE INDEX IF NOT EXISTS idx_toys_position_index ON toys(position_index);

-- Комментарий к колонке
COMMENT ON COLUMN toys.position_index IS 'Индекс позиции игрушки на ёлке (0-199 для основных позиций, 200+ для переполнения)';
```

5. Нажмите **Run** (или Ctrl+Enter)

### Шаг 2: Проверка

После выполнения SQL:
1. Обновите страницу приложения (F5)
2. Попробуйте создать и сохранить новый шар
3. Шар должен успешно сохраниться и появиться на ёлке

## Что делает position_index?

- Каждый шар получает уникальный индекс позиции на ёлке (0-199)
- Если все 200 позиций заняты, новые шары получают индексы 200+
- Это позволяет равномерно распределить шары по ёлке

## Файлы изменены

- `supabase/add_position_index.sql` - SQL-скрипт для миграции
- `supabase/schema.sql` - обновлена схема с добавлением position_index
- `FIX_POSITION_INDEX.md` - эта инструкция

