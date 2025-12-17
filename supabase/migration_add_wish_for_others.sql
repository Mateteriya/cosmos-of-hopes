-- Миграция: Добавление поля wish_for_others в таблицу toys
-- Выполните этот SQL в Supabase SQL Editor

-- Добавляем колонку wish_for_others
ALTER TABLE toys 
ADD COLUMN IF NOT EXISTS wish_for_others TEXT CHECK (char_length(wish_for_others) <= 200);

-- Добавляем комментарий к колонке для документации
COMMENT ON COLUMN toys.wish_for_others IS 'Пожелание для других/всех (необязательное поле, до 200 символов)';

