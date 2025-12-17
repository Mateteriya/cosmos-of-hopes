/**
 * Типы для персональных комнат
 */

export type DesignTheme = 'classic' | 'cosmic' | 'minimal' | 'urban' | 'custom';
export type EventProgram = 'chat' | 'video_watch' | 'quiz' | 'music_guess' | 'truth_or_dare';
export type VideoType = 'youtube' | 'file' | 'none';

export interface Room {
  id: string;
  creator_id: string;
  name: string;
  invite_code: string;
  timezone: string; // Например, 'Europe/Moscow'
  midnight_utc: string; // ISO timestamp
  
  // Дизайн комнаты
  design_theme?: DesignTheme; // Тема дизайна
  custom_background_url?: string | null; // URL кастомного фона (если design_theme = 'custom')
  
  // Программа мероприятия
  event_program?: EventProgram; // Программа мероприятия
  shared_video_url?: string | null; // URL видео для совместного просмотра
  shared_video_type?: VideoType | null; // Тип видео
  
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
}

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  message_text: string;
  created_at: string;
}


