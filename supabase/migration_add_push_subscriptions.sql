-- Миграция для создания таблицы push_subscriptions
-- Выполните этот SQL в Supabase SQL Editor

-- Создание таблицы для хранения подписок на push уведомления
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Индекс для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
-- Примечание: DROP TRIGGER IF EXISTS безопасен - он не удаляет данные, только триггер
DROP TRIGGER IF EXISTS trigger_update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER trigger_update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- Комментарии
COMMENT ON TABLE push_subscriptions IS 'Хранение подписок на Browser Push Notifications';
COMMENT ON COLUMN push_subscriptions.user_id IS 'ID пользователя (из localStorage или Telegram)';
COMMENT ON COLUMN push_subscriptions.subscription IS 'Объект PushSubscription в формате JSON';

