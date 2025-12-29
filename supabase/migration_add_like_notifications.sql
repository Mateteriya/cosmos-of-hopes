-- Миграция: Добавление триггера для отправки push-уведомлений о лайках
-- Этот триггер будет вызывать Edge Function при добавлении лайка

-- Функция для отправки push-уведомления о лайке через HTTP запрос к Edge Function
CREATE OR REPLACE FUNCTION send_like_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  toy_owner_id TEXT;
  toy_data RECORD;
  subscription_data RECORD;
  notification_sent BOOLEAN := false;
BEGIN
  -- Получаем информацию о шаре и его владельце
  SELECT user_id INTO toy_owner_id
  FROM toys
  WHERE id = NEW.toy_id;
  
  -- Если владелец не найден, выходим
  IF toy_owner_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Не отправляем уведомление, если лайк поставил сам владелец шара
  IF NEW.supporter_tg_id = toy_owner_id THEN
    RETURN NEW;
  END IF;
  
  -- Получаем подписку на push-уведомления владельца шара
  SELECT subscription INTO subscription_data
  FROM push_subscriptions
  WHERE user_id = toy_owner_id
  LIMIT 1;
  
  -- Если подписка не найдена, выходим (пользователь не подписан на уведомления)
  IF subscription_data IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Вызываем Edge Function для отправки push-уведомления
  -- Используем pg_net для HTTP запросов (если доступно)
  -- Или можно использовать Supabase Edge Function через HTTP
  PERFORM
    net.http_post(
      url := current_setting('app.supabase_url', true) || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
      ),
      body := jsonb_build_object(
        'userId', toy_owner_id,
        'title', '✨ Ваш шар получил лайк!',
        'body', 'Кто-то поддержал ваш шар желаний',
        'url', '/tree',
        'tag', 'like-notification'
      )
    );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Игнорируем ошибки отправки уведомлений, чтобы не блокировать добавление лайка
    RAISE WARNING 'Ошибка отправки push-уведомления о лайке: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер, который будет вызывать функцию при добавлении лайка
DROP TRIGGER IF EXISTS trigger_send_like_notification ON supports;
CREATE TRIGGER trigger_send_like_notification
  AFTER INSERT ON supports
  FOR EACH ROW
  EXECUTE FUNCTION send_like_push_notification();

-- Комментарии
COMMENT ON FUNCTION send_like_push_notification() IS 'Отправляет push-уведомление владельцу шара при добавлении лайка';
COMMENT ON TRIGGER trigger_send_like_notification ON supports IS 'Триггер для отправки push-уведомлений о лайках';

