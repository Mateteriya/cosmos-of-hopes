-- ВОССТАНОВЛЕНИЕ ИСХОДНОЙ СХЕМЫ БАЗЫ ДАННЫХ
-- Этот файл содержит ПОЛНЫЙ исходный код для создания всех таблиц
-- Выполните его в Supabase SQL Editor, если вы случайно заменили исходный код

-- ============================================
-- ЧАСТЬ 1: СОЗДАНИЕ ТАБЛИЦ
-- ============================================

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
  wish_text TEXT CHECK (char_length(wish_text) <= 200),
  image_url TEXT, -- Ссылка на изображение в Supabase Storage
  user_photo_url TEXT, -- Опциональное фото пользователя
  
  -- Состояние
  status TEXT NOT NULL DEFAULT 'on_tree' CHECK (status IN ('on_tree', 'transformed', 'in_cosmos')),
  transformed_at TIMESTAMP,
  
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

-- ============================================
-- ЧАСТЬ 2: ФУНКЦИИ И ТРИГГЕРЫ
-- ============================================

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
CREATE TRIGGER update_toys_updated_at 
  BEFORE UPDATE ON toys
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at 
  BEFORE UPDATE ON rooms
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ЧАСТЬ 3: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Включить Row Level Security (RLS)
ALTER TABLE toys ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ЧАСТЬ 4: ПОЛИТИКИ БЕЗОПАСНОСТИ ДЛЯ ТАБЛИЦ
-- ============================================

-- Удаляем старые политики (если есть), чтобы избежать дублирования
DROP POLICY IF EXISTS "Anyone can read toys" ON toys;
DROP POLICY IF EXISTS "Users can insert their own toys" ON toys;
DROP POLICY IF EXISTS "Anyone can read rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can create rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can read user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage their profiles" ON user_profiles;

-- Политики для таблицы toys
CREATE POLICY "Anyone can read toys" ON toys FOR SELECT USING (true);
CREATE POLICY "Users can insert their own toys" ON toys FOR INSERT 
  WITH CHECK (true); -- В реальности нужно проверять user_id из Telegram

-- Политики для таблицы rooms
CREATE POLICY "Anyone can read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON rooms FOR INSERT WITH CHECK (true);

-- Политики для таблицы user_profiles
CREATE POLICY "Anyone can read user profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage their profiles" ON user_profiles 
  FOR ALL USING (true); -- В реальности нужно проверять user_id

-- ============================================
-- ГОТОВО!
-- ============================================
-- После выполнения этого скрипта все таблицы будут созданы
-- Политики для Storage нужно выполнять ОТДЕЛЬНО (см. storage-policies.sql)


