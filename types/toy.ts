/**
 * Типы для игрушек/шаров/звезд
 */

export type ToyShape = 'ball' | 'star' | 'heart';
export type ToyPattern = 'stripes' | 'dots' | 'snowflakes' | 'stars' | null;
export type ToySticker = 'deer' | 'snowman' | 'gift' | 'bell' | 'snowflake' | null;
export type ToyStatus = 'on_tree' | 'transformed' | 'in_cosmos';

export interface Toy {
  id: string;
  user_id: string;
  room_id?: string;
  
  // Параметры игрушки
  shape: ToyShape;
  color: string; // HEX цвет
  pattern: ToyPattern;
  sticker?: ToySticker; // Опционально, так как наклейки убраны
  
  // Личное содержимое
  wish_text?: string; // До 200 символов - личное желание пользователя
  wish_for_others?: string; // До 200 символов - пожелание для других/всех
  image_url?: string; // Ссылка на изображение в Supabase Storage
  user_photo_url?: string; // Опциональное фото пользователя (отображается только на ёлке при клике на игрушку)
  
  // Состояние
  status: ToyStatus;
  transformed_at?: string; // ISO timestamp
  
  // Позиция в космосе (после трансформации)
  cosmos_x?: number;
  cosmos_y?: number;
  cosmos_z?: number;
  
  // Новые поля для виртуальной ёлки
  is_on_tree?: boolean; // Висит ли шар на общей ёлке
  position?: { x: number; y: number; z: number } | { position_index?: number }; // Координаты на 3D ёлке или индекс позиции (0-199)
  position_index?: number; // Индекс позиции на елке (0-199) для замены тестовых шаров
  support_count?: number; // Количество полученных «поддержек» (лайков)
  author_tg_id?: string; // ID автора (Telegram ID)
  ball_size?: number; // Размер шара
  surface_type?: 'glossy' | 'matte' | 'metal'; // Тип поверхности
  effects?: {
    sparkle?: boolean;
    gradient?: boolean;
    glow?: boolean;
    stars?: boolean;
  };
  filters?: {
    blur?: number;
    contrast?: number;
    saturation?: number;
    vignette?: number;
    grain?: number;
  };
  second_color?: string; // Второй цвет для разноцветного шара
  user_name?: string; // Имя или никнейм пользователя
  selected_country?: string; // Выбранная страна
  birth_year?: number; // Год рождения
  
  // Метаданные
  created_at: string;
  updated_at: string;
}

export interface ToyParams {
  shape: ToyShape;
  color: string;
  pattern: ToyPattern;
  wish_text?: string;
  wish_for_others?: string;
  image_file?: File;
  user_photo_file?: File;
  room_id?: string; // ID комнаты (если игрушка создаётся для комнаты)
  // Новые параметры персонализации
  ball_size?: number;
  surface_type?: 'glossy' | 'matte' | 'metal';
  effects?: {
    sparkle?: boolean;
    gradient?: boolean;
    glow?: boolean;
    stars?: boolean;
  };
  filters?: {
    blur?: number;
    contrast?: number;
    saturation?: number;
    vignette?: number;
    grain?: number;
  };
  second_color?: string;
  user_name?: string;
  selected_country?: string;
  birth_year?: number;
}

// Интерфейс для поддержки (лайка)
export interface Support {
  id: string;
  supporter_tg_id: string;
  toy_id: string;
  created_at: string;
}


