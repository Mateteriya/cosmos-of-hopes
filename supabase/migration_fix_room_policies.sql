-- Миграция: Исправление политик RLS для комнат и участников
-- ВАЖНО: Применяйте этот скрипт в SQL Editor Supabase
-- Этот скрипт создаст политики, если их нет, или обновит существующие

-- Проверяем и создаём политики для таблицы rooms
DO $$
BEGIN
  -- Удаляем старые политики, если есть
  DROP POLICY IF EXISTS "Anyone can read rooms" ON rooms;
  DROP POLICY IF EXISTS "Anyone can create rooms" ON rooms;
  DROP POLICY IF EXISTS "Anyone can update rooms" ON rooms;
  DROP POLICY IF EXISTS "Anyone can delete rooms" ON rooms;
  
  -- Создаём новые политики
  CREATE POLICY "Anyone can read rooms" ON rooms FOR SELECT USING (true);
  CREATE POLICY "Anyone can create rooms" ON rooms FOR INSERT WITH CHECK (true);
  CREATE POLICY "Anyone can update rooms" ON rooms FOR UPDATE USING (true) WITH CHECK (true);
  CREATE POLICY "Anyone can delete rooms" ON rooms FOR DELETE USING (true);
  
  RAISE NOTICE 'Политики для rooms созданы/обновлены';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Ошибка при создании политик для rooms: %', SQLERRM;
END $$;

-- Проверяем и создаём политики для таблицы room_members
DO $$
BEGIN
  -- Удаляем старые политики, если есть
  DROP POLICY IF EXISTS "Anyone can read room_members" ON room_members;
  DROP POLICY IF EXISTS "Anyone can insert room_members" ON room_members;
  DROP POLICY IF EXISTS "Anyone can delete room_members" ON room_members;
  
  -- Создаём новые политики
  CREATE POLICY "Anyone can read room_members" ON room_members FOR SELECT USING (true);
  CREATE POLICY "Anyone can insert room_members" ON room_members FOR INSERT WITH CHECK (true);
  CREATE POLICY "Anyone can delete room_members" ON room_members FOR DELETE USING (true);
  
  RAISE NOTICE 'Политики для room_members созданы/обновлены';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Ошибка при создании политик для room_members: %', SQLERRM;
END $$;

-- Проверяем, что RLS включен
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- Выводим информацию о созданных политиках
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('rooms', 'room_members')
ORDER BY tablename, policyname;
