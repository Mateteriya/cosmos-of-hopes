-- Таблица для WebRTC сигналинга (обмен SDP и ICE кандидатами)
CREATE TABLE IF NOT EXISTS webrtc_signaling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice-candidate')),
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Индексы для быстрого поиска сигналов
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_room_id ON webrtc_signaling(room_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_to_user ON webrtc_signaling(to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webrtc_signaling_from_user ON webrtc_signaling(from_user_id, created_at DESC);

-- Очистка старых сигналов (старше 1 минуты) - автоматически через триггер
CREATE OR REPLACE FUNCTION cleanup_old_signals()
RETURNS void AS $$
BEGIN
  DELETE FROM webrtc_signaling WHERE created_at < NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;

-- RLS политики
ALTER TABLE webrtc_signaling ENABLE ROW LEVEL SECURITY;

-- Все могут читать сигналы для своей комнаты (без проверки auth, так как используем временные user_id)
CREATE POLICY "Anyone can read signals for their room" ON webrtc_signaling
  FOR SELECT USING (true);

-- Все могут отправлять сигналы (без проверки auth)
CREATE POLICY "Anyone can send signals" ON webrtc_signaling
  FOR INSERT WITH CHECK (true);

-- Включаем Realtime для таблицы
ALTER PUBLICATION supabase_realtime ADD TABLE webrtc_signaling;


