-- ПРОСТОЙ ВАРИАНТ: Если предыдущий скрипт не помог
-- Выполните этот скрипт в SQL Editor Supabase

-- 1. Отключаем RLS временно (для тестирования)
ALTER TABLE room_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;

-- 2. Включаем обратно
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- 3. Удаляем все политики вручную
DROP POLICY IF EXISTS "rooms_select_policy" ON rooms;
DROP POLICY IF EXISTS "rooms_insert_policy" ON rooms;
DROP POLICY IF EXISTS "rooms_update_policy" ON rooms;
DROP POLICY IF EXISTS "rooms_delete_policy" ON rooms;
DROP POLICY IF EXISTS "room_members_select_policy" ON room_members;
DROP POLICY IF EXISTS "room_members_insert_policy" ON room_members;
DROP POLICY IF EXISTS "room_members_delete_policy" ON room_members;
DROP POLICY IF EXISTS "Anyone can read rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can create rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can update rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can delete rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can read room_members" ON room_members;
DROP POLICY IF EXISTS "Anyone can insert room_members" ON room_members;
DROP POLICY IF EXISTS "Anyone can delete room_members" ON room_members;

-- 4. Создаём новые политики с явным указанием схемы
CREATE POLICY "rooms_select" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "rooms_update" ON public.rooms FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "rooms_delete" ON public.rooms FOR DELETE USING (true);

CREATE POLICY "room_members_select" ON public.room_members FOR SELECT USING (true);
CREATE POLICY "room_members_insert" ON public.room_members FOR INSERT WITH CHECK (true);
CREATE POLICY "room_members_delete" ON public.room_members FOR DELETE USING (true);

-- 5. Проверяем
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('rooms', 'room_members');
