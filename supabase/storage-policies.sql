-- Политики доступа для Storage bucket toy-images
-- Выполните этот SQL в Supabase SQL Editor

-- Удаляем старые политики (если есть)
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all for toy-images" ON storage.objects;

-- Создаем политики для загрузки (INSERT)
CREATE POLICY "Anyone can upload images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'toy-images');

-- Создаем политики для чтения (SELECT)
CREATE POLICY "Anyone can read images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'toy-images');

-- Создаем политики для обновления (UPDATE)
CREATE POLICY "Anyone can update images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'toy-images')
WITH CHECK (bucket_id = 'toy-images');

-- Создаем политики для удаления (DELETE)
CREATE POLICY "Anyone can delete images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'toy-images');

-- Альтернативный вариант: разрешить всё для bucket toy-images (для тестирования)
-- Раскомментируйте, если политики выше не работают:
/*
CREATE POLICY "Allow all for toy-images" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'toy-images')
WITH CHECK (bucket_id = 'toy-images');
*/


