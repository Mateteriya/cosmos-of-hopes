-- Создание таблицы для хранения оценок приложения
CREATE TABLE IF NOT EXISTS app_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- Один пользователь может оценить только один раз
);

-- Индекс для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS idx_app_ratings_user_id ON app_ratings(user_id);

-- Индекс для быстрого получения статистики
CREATE INDEX IF NOT EXISTS idx_app_ratings_rating ON app_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_app_ratings_created_at ON app_ratings(created_at);

