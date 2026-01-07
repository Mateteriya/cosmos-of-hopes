-- Схема базы данных для Космоса Надежд

-- Таблица персональных комнат (создаем первой, т.к. на неё ссылается toys)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT NOT NULL,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  timezone TEXT NOT NULL, -- Например, 'Europe/Moscow'
  midnight_utc TIMESTAMP NOT NULL, -- Вычисленное время полночи в UTC
  
  -- Метаданные
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Индексы для комнат
CREATE INDEX IF NOT EXISTS idx_rooms_invite_code ON rooms(invite_code);
CREATE INDEX IF NOT EXISTS idx_rooms_midnight_utc ON rooms(midnight_utc);

-- Таблица игрушек/шаров/звезд
CREATE TABLE IF NOT EXISTS toys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  
  -- Параметры игрушки
  shape TEXT NOT NULL CHECK (shape IN ('ball', 'star', 'heart')),
  color TEXT NOT NULL, -- HEX цвет
  pattern TEXT CHECK (pattern IN ('stripes', 'dots', 'snowflakes', 'stars')),
  sticker TEXT CHECK (sticker IN ('deer', 'snowman', 'gift', 'bell', 'snowflake')),
  
  -- Личное содержимое
  wish_text TEXT CHECK (char_length(wish_text) <= 200), -- Личное желание пользователя
  wish_for_others TEXT CHECK (char_length(wish_for_others) <= 200), -- Пожелание для других/всех
  image_url TEXT, -- Ссылка на изображение в Supabase Storage
  user_photo_url TEXT, -- Опциональное фото пользователя (отображается только на ёлке при клике на игрушку)
  
  -- Состояние
  status TEXT NOT NULL DEFAULT 'on_tree' CHECK (status IN ('on_tree', 'transformed', 'in_cosmos')),
  transformed_at TIMESTAMP,
  
  -- Позиция на ёлке
  position_index INTEGER, -- Индекс позиции на ёлке (0-199 для основных позиций, 200+ для переполнения)
  
  -- Позиция в космосе (после трансформации)
  cosmos_x FLOAT,
  cosmos_y FLOAT,
  cosmos_z FLOAT,
  
  -- Метаданные
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Индексы для игрушек
CREATE INDEX IF NOT EXISTS idx_toys_user_id ON toys(user_id);
CREATE INDEX IF NOT EXISTS idx_toys_room_id ON toys(room_id);
CREATE INDEX IF NOT EXISTS idx_toys_status ON toys(status);
CREATE INDEX IF NOT EXISTS idx_toys_transformed_at ON toys(transformed_at);
CREATE INDEX IF NOT EXISTS idx_toys_position_index ON toys(position_index);

-- Таблица профилей пользователей
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY, -- Telegram ID
  username TEXT,
  new_year_timezone TEXT NOT NULL, -- Например, 'Europe/Moscow'
  midnight_utc TIMESTAMP, -- Вычисленное время полночи в UTC
  
  -- Метаданные
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Индекс для профилей
CREATE INDEX IF NOT EXISTS idx_user_profiles_midnight_utc ON user_profiles(midnight_utc);

-- Таблица участников комнат
CREATE TABLE IF NOT EXISTS room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(room_id, user_id)
);

-- Индексы для участников
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
-- Используем DROP IF EXISTS, чтобы избежать ошибки "уже существует"
DROP TRIGGER IF EXISTS update_toys_updated_at ON toys;
CREATE TRIGGER update_toys_updated_at BEFORE UPDATE ON toys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Включить Row Level Security (RLS)
ALTER TABLE toys ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- Политики безопасности (базовые - можно расширить)
-- Удаляем старые политики (если есть), чтобы избежать дублирования
DROP POLICY IF EXISTS "Anyone can read toys" ON toys;
DROP POLICY IF EXISTS "Users can insert their own toys" ON toys;
DROP POLICY IF EXISTS "Anyone can read rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can create rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can update rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can delete rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can read user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage their profiles" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can read room_members" ON room_members;
DROP POLICY IF EXISTS "Anyone can insert room_members" ON room_members;
DROP POLICY IF EXISTS "Anyone can delete room_members" ON room_members;

-- Разрешаем всем читать игрушки
CREATE POLICY "Anyone can read toys" ON toys FOR SELECT USING (true);

-- Разрешаем пользователям создавать свои игрушки
CREATE POLICY "Users can insert their own toys" ON toys FOR INSERT 
  WITH CHECK (true); -- В реальности нужно проверять user_id из Telegram

-- Разрешаем всем читать комнаты
CREATE POLICY "Anyone can read rooms" ON rooms FOR SELECT USING (true);

-- Разрешаем создавать комнаты
CREATE POLICY "Anyone can create rooms" ON rooms FOR INSERT WITH CHECK (true);

-- Разрешаем обновлять комнаты (для изменения названия)
CREATE POLICY "Anyone can update rooms" ON rooms FOR UPDATE USING (true) WITH CHECK (true);

-- Разрешаем удалять комнаты (только создатель, но проверка на уровне приложения)
CREATE POLICY "Anyone can delete rooms" ON rooms FOR DELETE USING (true);

-- Разрешаем всем читать участников комнат
CREATE POLICY "Anyone can read room_members" ON room_members FOR SELECT USING (true);

-- Разрешаем добавлять участников
CREATE POLICY "Anyone can insert room_members" ON room_members FOR INSERT WITH CHECK (true);

-- Разрешаем удалять участников (выход из комнаты)
CREATE POLICY "Anyone can delete room_members" ON room_members FOR DELETE USING (true);

-- Разрешаем всем читать профили (только публичные данные)
CREATE POLICY "Anyone can read user profiles" ON user_profiles FOR SELECT USING (true);

-- Разрешаем создавать/обновлять профили
CREATE POLICY "Users can manage their profiles" ON user_profiles 
  FOR ALL USING (true); -- В реальности нужно проверять user_id

