-- Добавление колонки position_index в таблицу toys
-- Эта колонка используется для позиционирования шаров на ёлке

ALTER TABLE toys ADD COLUMN IF NOT EXISTS position_index INTEGER;

-- Создаем индекс для быстрого поиска по position_index
CREATE INDEX IF NOT EXISTS idx_toys_position_index ON toys(position_index);

-- Комментарий к колонке
COMMENT ON COLUMN toys.position_index IS 'Индекс позиции игрушки на ёлке (0-199 для основных позиций, 200+ для переполнения)';

