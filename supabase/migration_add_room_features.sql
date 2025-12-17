-- Миграция: Добавление функций для комнат (дизайн, программа мероприятия, чат)
-- Применяйте этот скрипт в SQL Editor Supabase

-- Расширяем таблицу rooms
ALTER TABLE rooms 
  ADD COLUMN IF NOT EXISTS design_theme TEXT DEFAULT 'classic' CHECK (design_theme IN ('classic', 'cosmic', 'minimal', 'urban', 'custom')),
  ADD COLUMN IF NOT EXISTS custom_background_url TEXT,
  ADD COLUMN IF NOT EXISTS event_program TEXT DEFAULT 'chat' CHECK (event_program IN ('chat', 'video_watch', 'quiz', 'music_guess', 'truth_or_dare')),
  ADD COLUMN IF NOT EXISTS shared_video_url TEXT,
  ADD COLUMN IF NOT EXISTS shared_video_type TEXT CHECK (shared_video_type IN ('youtube', 'file', 'none'));

-- Таблица сообщений в чате комнаты
CREATE TABLE IF NOT EXISTS room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  message_text TEXT NOT NULL CHECK (char_length(message_text) <= 500),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Индексы для сообщений
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON room_messages(created_at DESC);

-- RLS политики для сообщений
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read room_messages" ON room_messages 
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert room_messages" ON room_messages 
  FOR INSERT WITH CHECK (true);

-- Комментарии к полям
COMMENT ON COLUMN rooms.design_theme IS 'Тема дизайна комнаты: classic, cosmic, minimal, urban, custom';
COMMENT ON COLUMN rooms.custom_background_url IS 'URL кастомного фона (если design_theme = custom)';
COMMENT ON COLUMN rooms.event_program IS 'Программа мероприятия: chat, video_watch, quiz, music_guess, truth_or_dare';
COMMENT ON COLUMN rooms.shared_video_url IS 'URL видео для совместного просмотра';
COMMENT ON COLUMN rooms.shared_video_type IS 'Тип видео: youtube, file, none';
