-- ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ: Политики RLS для комнат
-- ВАЖНО: Выполните этот скрипт в SQL Editor Supabase полностью
-- Этот скрипт гарантированно исправит проблемы с RLS

-- Шаг 1: Включаем RLS для обеих таблиц (если еще не включен)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- Шаг 2: Удаляем ВСЕ существующие политики для rooms
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'rooms') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON rooms', r.policyname);
    END LOOP;
END $$;

-- Шаг 3: Удаляем ВСЕ существующие политики для room_members
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'room_members') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON room_members', r.policyname);
    END LOOP;
END $$;

-- Шаг 4: Создаём политики для rooms
CREATE POLICY "rooms_select_policy" ON rooms 
    FOR SELECT 
    USING (true);

CREATE POLICY "rooms_insert_policy" ON rooms 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "rooms_update_policy" ON rooms 
    FOR UPDATE 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "rooms_delete_policy" ON rooms 
    FOR DELETE 
    USING (true);

-- Шаг 5: Создаём политики для room_members
CREATE POLICY "room_members_select_policy" ON room_members 
    FOR SELECT 
    USING (true);

CREATE POLICY "room_members_insert_policy" ON room_members 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "room_members_delete_policy" ON room_members 
    FOR DELETE 
    USING (true);

-- Шаг 6: Проверяем результат
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename IN ('rooms', 'room_members')
ORDER BY tablename, policyname;

-- Шаг 7: Проверяем, что RLS включен
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename IN ('rooms', 'room_members');
