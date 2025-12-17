-- Миграция: Добавление функций для виртуальной ёлки
-- Добавляем поля для системы лайков и позиционирования шаров на ёлке

-- Расширяем таблицу toys
ALTER TABLE toys 
  ADD COLUMN IF NOT EXISTS is_on_tree BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS position JSONB, -- {x, y, z} координаты на 3D ёлке
  ADD COLUMN IF NOT EXISTS support_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS author_tg_id TEXT, -- ID автора (Telegram ID)
  ADD COLUMN IF NOT EXISTS ball_size FLOAT DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS surface_type TEXT CHECK (surface_type IN ('glossy', 'matte', 'metal')),
  ADD COLUMN IF NOT EXISTS effects JSONB, -- {sparkle, gradient, glow, stars}
  ADD COLUMN IF NOT EXISTS filters JSONB, -- {blur, contrast, saturation, vignette, grain}
  ADD COLUMN IF NOT EXISTS second_color TEXT, -- Второй цвет для разноцветного шара
  ADD COLUMN IF NOT EXISTS user_name TEXT,
  ADD COLUMN IF NOT EXISTS selected_country TEXT,
  ADD COLUMN IF NOT EXISTS birth_year INTEGER;

-- Индексы для новых полей
CREATE INDEX IF NOT EXISTS idx_toys_is_on_tree ON toys(is_on_tree);
CREATE INDEX IF NOT EXISTS idx_toys_support_count ON toys(support_count);
CREATE INDEX IF NOT EXISTS idx_toys_author_tg_id ON toys(author_tg_id);

-- Таблица поддержек (лайков)
CREATE TABLE IF NOT EXISTS supports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supporter_tg_id TEXT NOT NULL, -- ID пользователя, который поставил лайк
  toy_id UUID NOT NULL REFERENCES toys(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Один пользователь может поддержать один шар только один раз
  UNIQUE(supporter_tg_id, toy_id)
);

-- Индексы для таблицы supports
CREATE INDEX IF NOT EXISTS idx_supports_supporter_tg_id ON supports(supporter_tg_id);
CREATE INDEX IF NOT EXISTS idx_supports_toy_id ON supports(toy_id);
CREATE INDEX IF NOT EXISTS idx_supports_created_at ON supports(created_at);

-- Включить RLS для supports
ALTER TABLE supports ENABLE ROW LEVEL SECURITY;

-- Политики для supports
DROP POLICY IF EXISTS "Anyone can read supports" ON supports;
DROP POLICY IF EXISTS "Users can create supports" ON supports;

CREATE POLICY "Anyone can read supports" ON supports FOR SELECT USING (true);
CREATE POLICY "Users can create supports" ON supports FOR INSERT WITH CHECK (true);

-- Функция для автоматического обновления support_count при добавлении/удалении поддержки
CREATE OR REPLACE FUNCTION update_toy_support_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE toys SET support_count = support_count + 1 WHERE id = NEW.toy_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE toys SET support_count = GREATEST(0, support_count - 1) WHERE id = OLD.toy_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления support_count
DROP TRIGGER IF EXISTS update_support_count_on_insert ON supports;
CREATE TRIGGER update_support_count_on_insert
  AFTER INSERT ON supports
  FOR EACH ROW EXECUTE FUNCTION update_toy_support_count();

DROP TRIGGER IF EXISTS update_support_count_on_delete ON supports;
CREATE TRIGGER update_support_count_on_delete
  AFTER DELETE ON supports
  FOR EACH ROW EXECUTE FUNCTION update_toy_support_count();

