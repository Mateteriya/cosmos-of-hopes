-- Миграция: Поддержка регистрации пользователей
-- Привязка существующих данных к авторизованным пользователям

-- Создаем таблицу для связи старых userId (из localStorage) с новыми (из Supabase Auth)
CREATE TABLE IF NOT EXISTS user_migrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  old_user_id TEXT NOT NULL UNIQUE, -- Старый ID из localStorage
  new_user_id UUID NOT NULL, -- Новый ID из Supabase Auth
  migrated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  migrated_data JSONB -- Информация о мигрированных данных (шары, комнаты)
);

CREATE INDEX IF NOT EXISTS idx_user_migrations_old_user_id ON user_migrations(old_user_id);
CREATE INDEX IF NOT EXISTS idx_user_migrations_new_user_id ON user_migrations(new_user_id);

-- Функция для миграции данных пользователя
-- Вызывается при первом входе после регистрации
CREATE OR REPLACE FUNCTION migrate_user_data(
  p_old_user_id TEXT,
  p_new_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_migrated_toys INTEGER := 0;
  v_migrated_rooms INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Мигрируем шары (toys)
  UPDATE toys
  SET user_id = p_new_user_id::TEXT
  WHERE user_id = p_old_user_id;
  
  GET DIAGNOSTICS v_migrated_toys = ROW_COUNT;
  
  -- Мигрируем комнаты (rooms)
  UPDATE rooms
  SET creator_id = p_new_user_id::TEXT
  WHERE creator_id = p_old_user_id;
  
  GET DIAGNOSTICS v_migrated_rooms = ROW_COUNT;
  
  -- Мигрируем подписки на уведомления
  UPDATE push_subscriptions
  SET user_id = p_new_user_id::TEXT
  WHERE user_id = p_old_user_id;
  
  -- Сохраняем информацию о миграции
  INSERT INTO user_migrations (old_user_id, new_user_id, migrated_data)
  VALUES (
    p_old_user_id,
    p_new_user_id,
    jsonb_build_object(
      'toys', v_migrated_toys,
      'rooms', v_migrated_rooms
    )
  )
  ON CONFLICT (old_user_id) DO NOTHING;
  
  v_result := jsonb_build_object(
    'success', true,
    'toys_migrated', v_migrated_toys,
    'rooms_migrated', v_migrated_rooms
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Комментарии
COMMENT ON TABLE user_migrations IS 'Связь старых userId (localStorage) с новыми (Supabase Auth)';
COMMENT ON FUNCTION migrate_user_data IS 'Мигрирует данные пользователя со старого ID на новый';

