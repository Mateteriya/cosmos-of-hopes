-- Миграция: Добавление политик RLS для комнат и участников
-- Применяйте этот скрипт в SQL Editor Supabase

-- Политики для таблицы rooms
DROP POLICY IF EXISTS "Anyone can read rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can create rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can update rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can delete rooms" ON rooms;

CREATE POLICY "Anyone can read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON rooms FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete rooms" ON rooms FOR DELETE USING (true);

-- Политики для таблицы room_members
DROP POLICY IF EXISTS "Anyone can read room_members" ON room_members;
DROP POLICY IF EXISTS "Anyone can insert room_members" ON room_members;
DROP POLICY IF EXISTS "Anyone can delete room_members" ON room_members;

CREATE POLICY "Anyone can read room_members" ON room_members FOR SELECT USING (true);
CREATE POLICY "Anyone can insert room_members" ON room_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete room_members" ON room_members FOR DELETE USING (true);
