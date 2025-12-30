/**
 * Сервис для работы с игрушками
 */

import { supabase } from './supabase';
import { getSupabaseServer } from './supabase-server';
import type { ToyParams, Toy } from '@/types/toy';

/**
 * Загружает изображение в Supabase Storage
 */
async function uploadImage(file: File, userId: string, type: 'toy' | 'user'): Promise<string> {
  const fileExt = file.name.split('.').pop();
  // Путь внутри bucket (без названия bucket!)
  const filePath = `${userId}/${type}_${Date.now()}.${fileExt}`;

  console.log('Загрузка изображения:', { filePath, fileName: file.name, size: file.size });

  // Загружаем файл
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('toy-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Ошибка загрузки:', uploadError);
    throw new Error(`Ошибка загрузки изображения: ${uploadError.message}`);
  }

  console.log('Изображение загружено:', uploadData);

  // Получаем публичную ссылку
  const { data: urlData } = supabase.storage
    .from('toy-images')
    .getPublicUrl(filePath);

  console.log('Публичная ссылка:', urlData.publicUrl);

  return urlData.publicUrl;
}

/**
 * Создает новую игрушку
 */
export async function createToy(userId: string, params: ToyParams): Promise<Toy> {
  console.log('Создание игрушки:', { userId, hasImage: !!params.image_file, hasPhoto: !!params.user_photo_file, room_id: params.room_id });

  // Загружаем изображения, если есть
  let imageUrl: string | undefined;
  let userPhotoUrl: string | undefined;

  try {
    if (params.image_file) {
      console.log('Загрузка изображения игрушки...');
      imageUrl = await uploadImage(params.image_file, userId, 'toy');
      console.log('Изображение игрушки загружено:', imageUrl);
    }

    if (params.user_photo_file) {
      console.log('Загрузка фото пользователя...');
      userPhotoUrl = await uploadImage(params.user_photo_file, userId, 'user');
      console.log('Фото пользователя загружено:', userPhotoUrl);
    }
  } catch (error) {
    console.error('Ошибка при загрузке изображений:', error);
    // Продолжаем сохранение даже если изображения не загрузились
    // (чтобы пользователь не потерял данные)
  }

  // Сохраняем игрушку в базу
  const insertData: any = {
    user_id: userId,
    shape: params.shape,
    color: params.color,
    pattern: params.pattern || null,
    sticker: null, // Sticker больше не используется в интерфейсе
    wish_text: params.wish_text || null,
    wish_for_others: params.wish_for_others || null,
    image_url: imageUrl || null,
    user_photo_url: userPhotoUrl || null,
    status: 'on_tree',
    room_id: params.room_id || null, // Привязываем к комнате, если указана
  };
  
  console.log('Данные для вставки игрушки:', { room_id: insertData.room_id, userId, status: insertData.status });

  // Добавляем новые поля, если они есть (после миграции будут доступны)
  if (params.ball_size !== undefined) insertData.ball_size = params.ball_size;
  if (params.surface_type) insertData.surface_type = params.surface_type;
  if (params.effects) insertData.effects = params.effects;
  if (params.filters) insertData.filters = params.filters;
  if (params.second_color) insertData.second_color = params.second_color;
  if (params.user_name) insertData.user_name = params.user_name;
  if (params.selected_country) insertData.selected_country = params.selected_country;
  if (params.birth_year) insertData.birth_year = params.birth_year;

  const { data, error } = await supabase
    .from('toys')
    .insert(insertData as never)
    .select()
    .single();

  if (error) {
    console.error('Ошибка вставки игрушки в БД:', { error, insertData });
    throw new Error(`Ошибка сохранения игрушки: ${error.message}`);
  }

  if (!data) {
    throw new Error('Не удалось создать игрушку: данные не получены');
  }

  const toy = data as Toy;

  console.log('✅ Игрушка успешно создана в БД:', { 
    toyId: toy.id, 
    room_id: toy.room_id, 
    status: toy.status,
    userId: toy.user_id 
  });

  return toy;
}

/**
 * Получает все игрушки на ёлке
 */
export async function getToysOnTree(roomId?: string): Promise<Toy[]> {
  console.log('Загрузка игрушек для комнаты:', { roomId });
  
  let query = supabase
    .from('toys')
    .select('*')
    .eq('status', 'on_tree')
    .order('created_at', { ascending: false });

  if (roomId) {
    query = query.eq('room_id', roomId);
    console.log('Фильтр: room_id =', roomId);
  } else {
    query = query.is('room_id', null); // Только общие игрушки
    console.log('Фильтр: room_id IS NULL (общие игрушки)');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Ошибка загрузки игрушек:', error);
    throw new Error(`Ошибка загрузки игрушек: ${error.message}`);
  }

  const toys = (data || []) as Toy[];
  
  console.log('Загружено игрушек:', toys.length, 'для комнаты:', roomId || 'общие');
  if (toys.length > 0) {
    console.log('Примеры игрушек:', toys.slice(0, 3).map(t => ({ id: t.id, room_id: t.room_id, status: t.status })));
  }

  return toys;
}

/**
 * Получает все звезды в космосе
 */
export async function getStarsInCosmos(): Promise<Toy[]> {
  const { data, error } = await supabase
    .from('toys')
    .select('*')
    .eq('status', 'in_cosmos')
    .not('cosmos_x', 'is', null)
    .order('transformed_at', { ascending: false });

  if (error) {
    throw new Error(`Ошибка загрузки звезд: ${error.message}`);
  }

  return (data || []) as Toy[];
}

/**
 * Получает игрушку по ID
 */
export async function getToyById(id: string): Promise<Toy | null> {
  const { data, error } = await supabase
    .from('toys')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Не найдено
    }
    throw new Error(`Ошибка загрузки игрушки: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return data as Toy;
}

/**
 * Проверяет, лайкнул ли пользователь хотя бы один шар
 * Пока таблица supports может не существовать (до миграции), возвращаем false
 */
export async function hasUserLikedAnyBall(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('supports')
      .select('id')
      .eq('supporter_tg_id', userId)
      .limit(1);

    if (error) {
      // Если таблица не существует (404, PGRST205, 42P01), возвращаем false без логирования
      const isTableNotFound = 
        error.code === 'PGRST205' || 
        error.code === '42P01' || 
        error.message?.includes('does not exist') || 
        error.message?.includes('schema cache') ||
        error.message?.includes('relation') && error.message?.includes('does not exist');
      
      if (isTableNotFound) {
        // Таблица еще не создана - это нормально до миграции
        // Не логируем, чтобы не засорять консоль
        return false;
      }
      // Другие ошибки логируем только в dev режиме
      if (process.env.NODE_ENV === 'development') {
        console.warn('Ошибка проверки лайков (игнорируется):', error.code);
      }
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (err: any) {
    // Если таблица не существует, просто возвращаем false без логирования
    const isTableNotFound = 
      err?.code === 'PGRST205' || 
      err?.status === 404 || 
      err?.statusCode === 404 ||
      err?.message?.includes('schema cache') ||
      err?.message?.includes('does not exist');
    
    if (isTableNotFound) {
      return false;
    }
    // Логируем только в dev режиме
    if (process.env.NODE_ENV === 'development') {
      console.warn('Ошибка проверки лайков (игнорируется):', err?.message || err);
    }
    return false;
  }
}

/**
 * Добавляет поддержку (лайк) к шару
 * Пока таблица supports может не существовать (до миграции)
 */
export async function addSupport(toyId: string, supporterId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('supports')
      .insert({
        toy_id: toyId,
        supporter_tg_id: supporterId,
      } as never);

    if (error) {
      // Если таблица не существует, просто игнорируем (миграция еще не применена)
      const isTableNotFound = 
        error.code === '42P01' || 
        error.message?.includes('does not exist') ||
        error.message?.includes('relation') && error.message?.includes('does not exist');
      
      if (isTableNotFound) {
        // Не логируем в продакшене, чтобы не засорять консоль
        if (process.env.NODE_ENV === 'development') {
          console.log('Таблица supports еще не создана, лайк не сохранен');
        }
        return;
      }
      // Если уже есть лайк от этого пользователя, игнорируем ошибку
      if (error.code === '23505') {
        return; // Unique constraint violation
      }
      throw new Error(`Ошибка добавления поддержки: ${error.message}`);
    }

    // После успешного добавления лайка отправляем push-уведомление владельцу шара
    // Делаем это асинхронно, чтобы не блокировать основной поток
    try {
      // Получаем информацию о шаре и его владельце
      const { data: toyData, error: toyError } = await supabase
        .from('toys')
        .select('user_id')
        .eq('id', toyId)
        .maybeSingle();

      const toy = toyData as { user_id: string } | null;

      if (!toyError && toy && toy.user_id && toy.user_id !== supporterId) {
        // Отправляем уведомление через Edge Function (не блокируем основной поток)
        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-like-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            toyOwnerId: toy.user_id,
            toyId: toyId,
          }),
        }).catch((err) => {
          // Игнорируем ошибки отправки уведомлений, чтобы не блокировать добавление лайка
          if (process.env.NODE_ENV === 'development') {
            console.warn('Ошибка отправки push-уведомления о лайке:', err);
          }
        });
      }
    } catch (notifError) {
      // Игнорируем ошибки отправки уведомлений
      if (process.env.NODE_ENV === 'development') {
        console.warn('Ошибка при попытке отправить уведомление о лайке:', notifError);
      }
    }
  } catch (err: any) {
    // Если таблица не существует, просто игнорируем
    const isTableNotFound = 
      err?.message?.includes('does not exist') || 
      err?.code === '42P01' ||
      err?.status === 404 ||
      err?.statusCode === 404;
    
    if (isTableNotFound) {
      // Не логируем в продакшене
      if (process.env.NODE_ENV === 'development') {
        console.log('Таблица supports еще не создана, лайк не сохранен');
      }
      return;
    }
    throw err;
  }
}

/**
 * Получает все шары на общей ёлке
 * ВАЖНО: Оптимизировано для миллионов шаров - возвращает только видимые/популярные
 * @param limit - Максимальное количество шаров для загрузки (по умолчанию 1000)
 * @param offset - Смещение для пагинации
 */
export async function getToysOnVirtualTree(limit: number = 1000, offset: number = 0): Promise<Toy[]> {
  // Пока используем status='on_tree', после миграции будет is_on_tree
  // Сначала загружаем самые популярные (с поддержками), затем новые
  const { data, error } = await supabase
    .from('toys')
    .select('*')
    .eq('status', 'on_tree')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Ошибка загрузки шаров на ёлке: ${error.message}`);
  }

  return (data || []) as Toy[];
}

/**
 * Получает количество шаров на ёлке (для статистики)
 */
export async function getToysOnTreeCount(): Promise<number> {
  const { count, error } = await supabase
    .from('toys')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'on_tree');

  if (error) {
    console.error('Ошибка подсчёта шаров:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Получает количество лайков у конкретного шара
 */
export async function getToyLikesCount(toyId: string): Promise<number> {
  // Тестовые шары не имеют лайков в БД
  if (toyId.startsWith('test-ball-')) {
    return 0;
  }
  
  try {
    const { count, error } = await supabase
      .from('supports')
      .select('*', { count: 'exact', head: true })
      .eq('toy_id', toyId);

    if (error) {
      // Если таблица не существует, возвращаем 0
      const isTableNotFound = 
        error.code === 'PGRST205' || 
        error.code === '42P01' || 
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache');
      
      if (isTableNotFound) {
        return 0;
      }
      console.warn('Ошибка подсчета лайков:', error);
      return 0;
    }

    return count || 0;
  } catch (err: any) {
    const isTableNotFound = 
      err?.code === 'PGRST205' || 
      err?.status === 404 ||
      err?.message?.includes('does not exist') ||
      err?.message?.includes('schema cache');
    
    if (isTableNotFound) {
      return 0;
    }
    console.warn('Ошибка подсчета лайков:', err);
    return 0;
  }
}

/**
 * Проверяет, лайкнул ли пользователь конкретный шар
 */
export async function hasUserLikedToy(toyId: string, userId: string): Promise<boolean> {
  // Тестовые шары не могут быть лайкнуты
  if (toyId.startsWith('test-ball-')) {
    return false;
  }
  
  try {
    const { data, error } = await supabase
      .from('supports')
      .select('id')
      .eq('toy_id', toyId)
      .eq('supporter_tg_id', userId)
      .maybeSingle();

    if (error) {
      // Если таблица не существует или запись не найдена, возвращаем false
      const isTableNotFound = 
        error.code === 'PGRST205' || 
        error.code === '42P01' || 
        error.code === 'PGRST116' || // PGRST116 = no rows returned
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache');
      
      if (isTableNotFound) {
        return false;
      }
      if (process.env.NODE_ENV === 'development') {
        console.warn('Ошибка проверки лайка:', error);
      }
      return false;
    }

    return !!data;
  } catch (err: any) {
    const isTableNotFound = 
      err?.code === 'PGRST205' || 
      err?.status === 404 ||
      err?.code === 'PGRST116' ||
      err?.message?.includes('does not exist') ||
      err?.message?.includes('schema cache');
    
    if (isTableNotFound) {
      return false;
    }
    if (process.env.NODE_ENV === 'development') {
      console.warn('Ошибка проверки лайка:', err);
    }
    return false;
  }
}

/**
 * Удаляет поддержку (лайк) у шара
 */
export async function removeSupport(toyId: string, supporterId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('supports')
      .delete()
      .eq('toy_id', toyId)
      .eq('supporter_tg_id', supporterId);

    if (error) {
      // Если таблица не существует, просто игнорируем
      const isTableNotFound = 
        error.code === 'PGRST205' || 
        error.code === '42P01' || 
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache');
      
      if (isTableNotFound) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Таблица supports еще не создана, лайк не удален');
        }
        return;
      }
      throw new Error(`Ошибка удаления поддержки: ${error.message}`);
    }
  } catch (err: any) {
    const isTableNotFound = 
      err?.code === 'PGRST205' || 
      err?.status === 404 ||
      err?.message?.includes('does not exist') ||
      err?.message?.includes('schema cache');
    
    if (isTableNotFound) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Таблица supports еще не создана, лайк не удален');
      }
      return;
    }
    throw err;
  }
}

/**
 * Получает игрушку пользователя (если существует)
 */
export async function getUserToy(userId: string, roomId?: string): Promise<Toy | null> {
  try {
    let query = supabase
      .from('toys')
      .select('*')
      .eq('user_id', userId);

    if (roomId) {
      query = query.eq('room_id', roomId);
    } else {
      query = query.is('room_id', null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Не найдено - это нормально
      }
      console.error('Ошибка загрузки игрушки пользователя:', error);
      return null;
    }

    return data as Toy | null;
  } catch (err: any) {
    console.error('Ошибка загрузки игрушки пользователя:', err);
    return null;
  }
}

/**
 * ID разработчика для автоматических лайков
 */
const DEVELOPER_USER_ID = 'developer_auto_like';

/**
 * Проверяет и добавляет автоматический лайк разработчика к шару пользователя
 */
export async function checkAndAddDeveloperLikes(userId: string): Promise<void> {
  try {
    // Получаем шар пользователя
    const userToy = await getUserToy(userId);
    if (!userToy) return;

    // Проверяем, лайкнул ли разработчик этот шар
    const hasLiked = await hasUserLikedToy(userToy.id, DEVELOPER_USER_ID);
    if (!hasLiked) {
      // Добавляем автоматический лайк
      await addSupport(userToy.id, DEVELOPER_USER_ID);
    }
  } catch (err: any) {
    // Игнорируем ошибки - это не критично для работы приложения
    if (process.env.NODE_ENV === 'development') {
      console.warn('Ошибка добавления автоматического лайка разработчика:', err);
    }
  }
}

/**
 * Результат проверки новых лайков
 */
export interface NewLikesInfo {
  hasNewLikes: boolean;
  toysWithNewLikes: Array<{ toyId: string; likesCount: number }>;
}

/**
 * Проверяет новые лайки для шаров пользователя с момента lastCheckedTimestamp
 */
export async function checkNewLikes(userId: string, lastCheckedTimestamp: number | null): Promise<NewLikesInfo> {
  try {
    // Получаем шар пользователя
    const userToy = await getUserToy(userId);
    if (!userToy) {
      return { hasNewLikes: false, toysWithNewLikes: [] };
    }

    // Получаем текущее количество лайков
    const currentLikesCount = await getToyLikesCount(userToy.id);

    // Если не было предыдущей проверки, возвращаем текущее состояние
    if (lastCheckedTimestamp === null) {
      return {
        hasNewLikes: currentLikesCount > 0,
        toysWithNewLikes: currentLikesCount > 0 ? [{ toyId: userToy.id, likesCount: currentLikesCount }] : [],
      };
    }

    // Получаем лайки, добавленные после lastCheckedTimestamp
    const { data: newLikes, error } = await supabase
      .from('supports')
      .select('id')
      .eq('toy_id', userToy.id)
      .gt('created_at', new Date(lastCheckedTimestamp).toISOString());

    if (error) {
      // Если таблица не существует, возвращаем пустой результат
      const isTableNotFound = 
        error.code === 'PGRST205' || 
        error.code === '42P01' || 
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache');
      
      if (isTableNotFound) {
        return { hasNewLikes: false, toysWithNewLikes: [] };
      }
      console.warn('Ошибка проверки новых лайков:', error);
      return { hasNewLikes: false, toysWithNewLikes: [] };
    }

    const hasNewLikes = (newLikes?.length || 0) > 0;

    return {
      hasNewLikes,
      toysWithNewLikes: hasNewLikes ? [{ toyId: userToy.id, likesCount: currentLikesCount }] : [],
    };
  } catch (err: any) {
    const isTableNotFound = 
      err?.code === 'PGRST205' || 
      err?.status === 404 ||
      err?.message?.includes('does not exist') ||
      err?.message?.includes('schema cache');
    
    if (isTableNotFound) {
      return { hasNewLikes: false, toysWithNewLikes: [] };
    }
    console.warn('Ошибка проверки новых лайков:', err);
    return { hasNewLikes: false, toysWithNewLikes: [] };
  }
}

/**
 * Удаляет все кастомные шары из БД, оставляя только 7 (любых)
 * ВАЖНО: Используется для очистки тестовых данных
 */
export async function deleteAllCustomToysExceptSeven(roomId?: string): Promise<number> {
  try {
    // Получаем ВСЕ шары на елке
    let query = supabase
      .from('toys')
      .select('id')
      .eq('status', 'on_tree');

    if (roomId) {
      query = query.eq('room_id', roomId);
    } else {
      query = query.is('room_id', null); // Только общие шары
    }

    const { data: allToys, error: fetchError } = await query;

    if (fetchError) {
      console.error('Ошибка загрузки шаров:', fetchError);
      throw new Error(`Ошибка загрузки шаров: ${fetchError.message}`);
    }

    if (!allToys || allToys.length === 0) {
      console.log('Шары не найдены. Удаление не требуется.');
      return 0;
    }

    // Фильтруем тестовые шары на клиенте (id начинается с 'test-ball-')
    // Но так как id это UUID, тестовые шары не будут в БД - они генерируются на клиенте
    // Поэтому просто берем все шары из БД - это и есть кастомные
    const customToys: Array<{ id: string }> = allToys; // Все шары из БД - это кастомные

    if (customToys.length <= 7) {
      console.log(`Найдено ${customToys.length} кастомных шаров. Удаление не требуется.`);
      return 0;
    }

    // Оставляем любые 7, остальные удаляем
    const toysToDelete = customToys.slice(7);
    const toyIdsToDelete = toysToDelete.map(toy => toy.id);

    console.log(`Найдено ${customToys.length} кастомных шаров. Оставляем 7, удаляем ${toyIdsToDelete.length}`);
    console.log(`ID для удаления:`, toyIdsToDelete.slice(0, 5), '...');

    // Удаляем шары используя серверный клиент (обходит RLS)
    // Получаем серверный клиент только на сервере
    const supabaseServer = getSupabaseServer();
    
    // Разбиваем на батчи по 10 для надежности
    let deletedCount = 0;
    const batchSize = 10;
    
    for (let i = 0; i < toyIdsToDelete.length; i += batchSize) {
      const batch = toyIdsToDelete.slice(i, i + batchSize);
      
      const { error: deleteError, count } = await supabaseServer
        .from('toys')
        .delete({ count: 'exact' })
        .in('id', batch);

      if (deleteError) {
        console.error(`Ошибка удаления батча шаров:`, deleteError);
        // Пробуем удалить по одному
        for (const toyId of batch) {
          const { error: singleError, count: singleCount } = await supabaseServer
            .from('toys')
            .delete({ count: 'exact' })
            .eq('id', toyId);
          
          if (singleError) {
            console.error(`Ошибка удаления шара ${toyId}:`, singleError);
          } else {
            deletedCount += singleCount || 0;
          }
        }
      } else {
        deletedCount += count || 0;
      }
    }

    console.log(`Успешно удалено ${deletedCount} из ${toyIdsToDelete.length} шаров`);

    // Удаляем связанные лайки (supports) для удаленных шаров
    try {
      await supabase
        .from('supports')
        .delete()
        .in('toy_id', toyIdsToDelete);
    } catch (supportsError) {
      // Игнорируем ошибки удаления лайков (таблица может не существовать)
      console.warn('Не удалось удалить связанные лайки:', supportsError);
    }

    console.log(`✅ Успешно удалено ${toyIdsToDelete.length} шаров. Оставлено 7.`);
    return toyIdsToDelete.length;
  } catch (err: any) {
    console.error('Ошибка при удалении шаров:', err);
    throw err;
  }
}

