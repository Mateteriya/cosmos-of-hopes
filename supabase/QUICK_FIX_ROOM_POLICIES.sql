-- БЫСТРОЕ ИСПРАВЛЕНИЕ: Политики для комнат
-- Скопируйте и выполните этот скрипт в SQL Editor Supabase

-- 1. Убеждаемся, что RLS включен
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- 2. Удаляем все старые политики
DROP POLICY IF EXISTS "Anyone can read rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can create rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can update rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can delete rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can read room_members" ON room_members;
DROP POLICY IF EXISTS "Anyone can insert room_members" ON room_members;
DROP POLICY IF EXISTS "Anyone can delete room_members" ON room_members;

-- 3. Создаём политики для rooms
CREATE POLICY "Anyone can read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON rooms FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete rooms" ON rooms FOR DELETE USING (true);

-- 4. Создаём политики для room_members
CREATE POLICY "Anyone can read room_members" ON room_members FOR SELECT USING (true);
CREATE POLICY "Anyone can insert room_members" ON room_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete room_members" ON room_members FOR DELETE USING (true);

-- 5. Проверяем результат
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('rooms', 'room_members')
ORDER BY tablename, policyname;
