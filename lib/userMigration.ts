/**
 * Утилиты для миграции данных пользователя при регистрации
 * Привязывает существующие шары и комнаты к новому авторизованному пользователю
 */

import { supabase } from './supabase';

/**
 * Мигрирует данные пользователя со старого ID (localStorage) на новый (Supabase Auth)
 */
export async function migrateAnonymousDataToUser(
  anonymousUserId: string,
  newUserId: string
): Promise<void> {
  if (!anonymousUserId || !newUserId || anonymousUserId === newUserId) {
    console.log('[Migration] Пропуск миграции: неверные ID или ID совпадают.');
    return;
  }

  console.log(`[Migration] Начинаем миграцию данных с ${anonymousUserId} на ${newUserId}`);

  try {
    // 1. Миграция шаров (toys)
    const { data: toysData, error: toysError } = await supabase
      .from('toys')
      .update({ 
        user_id: newUserId,
        author_tg_id: newUserId,
        author_user_id: newUserId 
      } as never)
      .eq('user_id', anonymousUserId)
      .select('id');
    
    if (toysError) {
      console.error('[Migration] Ошибка миграции шаров:', toysError);
    } else {
      console.log(`[Migration] Мигрировано шаров: ${toysData?.length || 0}`);
    }

    // 2. Миграция комнат (rooms)
    const { data: roomsData, error: roomsError } = await supabase
      .from('rooms')
      .update({ 
        creator_id: newUserId,
        creator_user_id: newUserId 
      } as never)
      .eq('creator_id', anonymousUserId)
      .select('id');
    
    if (roomsError) {
      console.error('[Migration] Ошибка миграции комнат:', roomsError);
    } else {
      console.log(`[Migration] Мигрировано комнат: ${roomsData?.length || 0}`);
    }

    // 3. Миграция участников комнат (room_members)
    const { data: membersData, error: membersError } = await supabase
      .from('room_members')
      .update({ user_id: newUserId } as never)
      .eq('user_id', anonymousUserId)
      .select('id');
    
    if (membersError) {
      console.error('[Migration] Ошибка миграции участников:', membersError);
    } else {
      console.log(`[Migration] Мигрировано участников: ${membersData?.length || 0}`);
    }

    // 4. Миграция лайков (supports)
    const { data: supportsData, error: supportsError } = await supabase
      .from('supports')
      .update({ 
        supporter_tg_id: newUserId,
        supporter_user_id: newUserId 
      } as never)
      .eq('supporter_tg_id', anonymousUserId)
      .select('id');
    
    if (supportsError) {
      console.error('[Migration] Ошибка миграции лайков:', supportsError);
    } else {
      console.log(`[Migration] Мигрировано лайков: ${supportsData?.length || 0}`);
    }

    // 5. Миграция подписок на push-уведомления (push_subscriptions)
    // Проверяем, существует ли подписка для нового пользователя
    const { data: existingSubscription } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', newUserId)
      .single();

    if (!existingSubscription) {
      // Если подписки для нового пользователя нет, мигрируем
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('push_subscriptions')
        .update({ user_id: newUserId } as never)
        .eq('user_id', anonymousUserId)
        .select('id');
      
      if (subscriptionError) {
        console.error('[Migration] Ошибка миграции подписок:', subscriptionError);
      } else {
        console.log(`[Migration] Мигрировано подписок: ${subscriptionData?.length || 0}`);
      }
    } else {
      // Если подписка уже есть, удаляем старую
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', anonymousUserId);
      console.log('[Migration] Подписка для нового пользователя уже существует, старая удалена');
    }

    console.log('[Migration] Миграция данных завершена успешно.');
  } catch (error) {
    console.error('[Migration] Ошибка при миграции данных:', error);
    throw error;
  }
}

/**
 * Мигрирует данные пользователя со старого ID (localStorage) на новый (Supabase Auth)
 * @deprecated Используйте migrateAnonymousDataToUser
 */
export async function migrateUserData(newUserId: string): Promise<{
  success: boolean;
  toysMigrated: number;
  roomsMigrated: number;
  error?: string;
}> {
  try {
    // Получаем старый ID из localStorage
    const oldUserId = typeof window !== 'undefined' 
      ? localStorage.getItem('cosmos_of_hopes_user_id')
      : null;
    
    if (!oldUserId) {
      return {
        success: true,
        toysMigrated: 0,
        roomsMigrated: 0,
      };
    }

    await migrateAnonymousDataToUser(oldUserId, newUserId);

    // Удаляем старый ID из localStorage после успешной миграции
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cosmos_of_hopes_user_id');
    }

    return {
      success: true,
      toysMigrated: 0, // Подсчет можно добавить позже
      roomsMigrated: 0,
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

