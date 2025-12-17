/**
 * Типы базы данных (временно упрощенные)
 * Позже можно сгенерировать автоматически из Supabase
 */

export interface Database {
  public: {
    Tables: {
      toys: {
        Row: {
          id: string;
          user_id: string;
          room_id: string | null;
          shape: string;
          color: string;
          pattern: string | null;
          sticker: string | null;
          wish_text: string | null;
          image_url: string | null;
          user_photo_url: string | null;
          status: string;
          transformed_at: string | null;
          cosmos_x: number | null;
          cosmos_y: number | null;
          cosmos_z: number | null;
          created_at: string;
          updated_at: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          creator_id: string;
          name: string;
          invite_code: string;
          timezone: string;
          midnight_utc: string;
          created_at: string;
          updated_at: string;
        };
      };
      user_profiles: {
        Row: {
          user_id: string;
          username: string | null;
          new_year_timezone: string;
          midnight_utc: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}


