/**
 * Типы для пользователей
 */

export interface UserProfile {
  user_id: string; // Telegram ID
  username?: string;
  new_year_timezone: string; // Например, 'Europe/Moscow'
  midnight_utc?: string; // ISO timestamp (вычисляется Edge Function)
  created_at: string;
  updated_at: string;
}


