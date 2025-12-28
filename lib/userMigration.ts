/**
 * Утилиты для миграции данных пользователя при регистрации
 * Привязывает существующие шары и комнаты к новому авторизованному пользователю
 */

import { supabase } from './supabase';
import { getUserId } from './userId';

/**
 * Мигрирует данные пользователя со старого ID (localStorage) на новый (Supabase Auth)
 */
export async function migrateUserData(newUserId: string): Promise<{
  success: boolean;
  toysMigrated: number;
  roomsMigrated: number;
  error?: string;
}> {
  try {
    // Получаем старый ID из localStorage
    const oldUserId = localStorage.getItem('cosmos_of_hopes_user_id');
    
    if (!oldUserId) {
      // Нет старого ID - ничего мигрировать не нужно
      return {
        success: true,
        toysMigrated: 0,
        roomsMigrated: 0,
      };
    }

    // Вызываем функцию миграции в Supabase
    const { data, error } = await supabase.rpc('migrate_user_data', {
      p_old_user_id: oldUserId,
      p_new_user_id: newUserId,
    });

    if (error) {
      console.error('Error migrating user data:', error);
      return {
        success: false,
        toysMigrated: 0,
        roomsMigrated: 0,
        error: error.message,
      };
    }

    // Удаляем старый ID из localStorage после успешной миграции
    localStorage.removeItem('cosmos_of_hopes_user_id');

    return {
      success: true,
      toysMigrated: data?.toys_migrated || 0,
      roomsMigrated: data?.rooms_migrated || 0,
    };
  } catch (error: any) {
    console.error('Error in migrateUserData:', error);
    return {
      success: false,
      toysMigrated: 0,
      roomsMigrated: 0,
      error: error.message,
    };
  }
}

/**
 * Проверяет, нужно ли мигрировать данные пользователя
 */
export async function shouldMigrateUserData(): Promise<boolean> {
  const oldUserId = localStorage.getItem('cosmos_of_hopes_user_id');
  if (!oldUserId) {
    return false;
  }

  // Проверяем, есть ли данные для миграции
  const { data: toys } = await supabase
    .from('toys')
    .select('id')
    .eq('user_id', oldUserId)
    .limit(1);

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id')
    .eq('creator_id', oldUserId)
    .limit(1);

  return (toys?.length || 0) > 0 || (rooms?.length || 0) > 0;
}

