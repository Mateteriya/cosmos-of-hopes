/**
 * Сервис для работы с персональными комнатами
 * Комнаты - это персональные ёлки для групп друзей/семьи
 */

import { supabase } from './supabase';
import type { Room, RoomMember } from '@/types/room';

/**
 * Вычисляет время полночи в UTC для заданного timezone
 * Для 1 января следующего года
 */
function calculateMidnightUTC(timezone: string): Date {
  const now = new Date();
  const nextYear = now.getFullYear() + 1;
  
  // Создаём дату 1 января следующего года в локальном времени
  const jan1Local = new Date(nextYear, 0, 1, 0, 0, 0, 0);
  
  // Получаем строку этой даты в нужном timezone
  const tzString = jan1Local.toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // Парсим строку (формат: "MM/DD/YYYY, HH:MM:SS")
  const [datePart, timePart] = tzString.split(', ');
  const [month, day, year] = datePart.split('/');
  const [hour, minute, second] = timePart.split(':');
  
  // Создаём дату в UTC, которая соответствует этой дате/времени в нужном timezone
  // Используем простой метод: создаём дату и вычисляем смещение
  const utcNow = new Date();
  const tzNow = new Date(utcNow.toLocaleString('en-US', { timeZone: timezone }));
  const offset = utcNow.getTime() - tzNow.getTime();
  
  // Создаём дату полночи в нужном timezone
  const midnightInTz = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );
  
  // Конвертируем в UTC
  return new Date(midnightInTz.getTime() - offset);
}

/**
 * Генерирует уникальный invite code
 */
function generateInviteCode(): string {
  // Генерируем код из 6 символов (буквы и цифры)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Исключаем похожие символы (0, O, I, 1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Создаёт новую комнату
 */
export async function createRoom(
  creatorId: string,
  name: string,
  timezone: string = 'Europe/Moscow'
): Promise<Room> {
  // Вычисляем полночь в UTC для заданного timezone
  const midnightUTC = calculateMidnightUTC(timezone);
  
  // Генерируем уникальный invite code
  let inviteCode = generateInviteCode();
  let attempts = 0;
  
  // Проверяем уникальность кода (максимум 10 попыток)
  while (attempts < 10) {
    const { data: existing, error: checkError } = await supabase
      .from('rooms')
      .select('id')
      .eq('invite_code', inviteCode)
      .maybeSingle();
    
    // Если записи нет (код уникален) или ошибка не связана с отсутствием записи
    if (!existing && (checkError?.code === 'PGRST116' || !checkError)) {
      break; // Код уникален
    }
    
    inviteCode = generateInviteCode();
    attempts++;
  }
  
  if (attempts >= 10) {
    throw new Error('Не удалось создать уникальный invite code');
  }
  
  // Создаём комнату
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      creator_id: creatorId,
      name,
      invite_code: inviteCode,
      timezone,
      midnight_utc: midnightUTC.toISOString(),
      design_theme: 'classic', // Дефолтный дизайн
      event_program: 'chat', // Дефолтная программа - простой чат
    } as never)
    .select()
    .single();
  
  if (error) {
    console.error('Ошибка создания комнаты:', {
      error,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
      creatorId,
      name,
      inviteCode,
      timezone,
    });
    throw new Error(`Ошибка создания комнаты: ${error.message} (код: ${error.code})`);
  }
  
  if (!data) {
    throw new Error('Не удалось создать комнату: данные не получены');
  }
  
  const room = data as Room;
  
  // Автоматически добавляем создателя как участника
  await joinRoom(room.id, creatorId);
  
  return room;
}

/**
 * Присоединяется к комнате по invite code
 */
export async function joinRoomByInviteCode(
  inviteCode: string,
  userId: string
): Promise<Room> {
  // Находим комнату по invite code
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .maybeSingle();
  
  if (roomError) {
    throw new Error(`Ошибка поиска комнаты: ${roomError.message}`);
  }
  
  if (!room) {
    throw new Error('Комната с таким кодом не найдена');
  }
  
  const roomTyped = room as Room;
  
  // Присоединяемся к комнате
  await joinRoom(roomTyped.id, userId);
  
  return roomTyped;
}

/**
 * Присоединяется к комнате (добавляет участника)
 */
export async function joinRoom(roomId: string, userId: string): Promise<void> {
  // Проверяем, не является ли пользователь уже участником
  const { data: existing, error: checkError } = await supabase
    .from('room_members')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle();
  
  // Если запись найдена (уже участник) или ошибка не связана с отсутствием записи
  if (existing) {
    return; // Уже участник
  }
  
  // Если ошибка не связана с отсутствием записи, пробрасываем её
  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error(`Ошибка проверки участника: ${checkError.message}`);
  }
  
  // Добавляем участника
  const { data: insertData, error } = await supabase
    .from('room_members')
    .insert({
      room_id: roomId,
      user_id: userId,
    } as never)
    .select();
  
  if (error) {
    console.error('Ошибка вставки в room_members:', {
      error,
      roomId,
      userId,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
    });
    throw new Error(`Ошибка присоединения к комнате: ${error.message} (код: ${error.code})`);
  }
  
  console.log('Участник успешно добавлен:', insertData);
}

/**
 * Покидает комнату
 */
export async function leaveRoom(roomId: string, userId: string): Promise<void> {
  // Нельзя покинуть комнату, если ты создатель
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('creator_id')
    .eq('id', roomId)
    .maybeSingle();
  
  if (roomError && roomError.code !== 'PGRST116') {
    throw new Error(`Ошибка проверки комнаты: ${roomError.message}`);
  }
  
  if (room && room.creator_id === userId) {
    throw new Error('Создатель комнаты не может её покинуть');
  }
  
  // Удаляем участника
  const { error } = await supabase
    .from('room_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);
  
  if (error) {
    throw new Error(`Ошибка выхода из комнаты: ${error.message}`);
  }
}

/**
 * Получает комнату по ID
 */
export async function getRoomById(roomId: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .maybeSingle();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Не найдено
    }
    throw new Error(`Ошибка загрузки комнаты: ${error.message}`);
  }
  
  return data as Room | null;
}

/**
 * Получает все комнаты пользователя (где он участник или создатель)
 */
export async function getUserRooms(userId: string): Promise<Room[]> {
  try {
    // Получаем комнаты, где пользователь является участником
    const { data: memberRooms, error: memberError } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', userId);
    
    if (memberError) {
      console.error('Ошибка загрузки участников комнат:', {
        error: memberError,
        errorCode: memberError.code,
        errorMessage: memberError.message,
        userId,
      });
      // Продолжаем выполнение, даже если есть ошибка - возможно, пользователь просто не участник ни в одной комнате
    }
    
    // Получаем комнаты, где пользователь является создателем
    const { data: createdRooms, error: createdError } = await supabase
      .from('rooms')
      .select('*')
      .eq('creator_id', userId);
    
    if (createdError) {
      console.error('Ошибка загрузки созданных комнат:', {
        error: createdError,
        errorCode: createdError.code,
        errorMessage: createdError.message,
        userId,
      });
      // Продолжаем выполнение
    }
    
    // Объединяем и убираем дубликаты
    const roomIds = new Set<string>();
    if (createdRooms) {
      createdRooms.forEach(room => roomIds.add(room.id));
    }
    if (memberRooms) {
      memberRooms.forEach(member => {
        if (member.room_id) {
          roomIds.add(member.room_id);
        }
      });
    }
    
    if (roomIds.size === 0) {
      return [];
    }
    
    // Загружаем все комнаты
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .in('id', Array.from(roomIds));
    
    if (roomsError) {
      console.error('Ошибка загрузки деталей комнат:', {
        error: roomsError,
        errorCode: roomsError.code,
        errorMessage: roomsError.message,
        roomIds: Array.from(roomIds),
      });
      throw new Error(`Ошибка загрузки комнат: ${roomsError.message || 'Неизвестная ошибка'} (код: ${roomsError.code || 'N/A'})`);
    }
    
    return (rooms || []) as Room[];
  } catch (error: any) {
    // Безопасная обработка ошибок - избегаем проблем с URL конструктором
    const errorMessage = error?.message || String(error) || 'Неизвестная ошибка';
    const errorCode = error?.code || 'N/A';
    console.error('Критическая ошибка в getUserRooms:', {
      error,
      errorMessage,
      errorCode,
      userId,
    });
    throw new Error(`Ошибка загрузки комнат: ${errorMessage} (код: ${errorCode})`);
  }
}

/**
 * Получает участников комнаты
 */
export async function getRoomMembers(roomId: string): Promise<RoomMember[]> {
  const { data, error } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });
  
  if (error) {
    throw new Error(`Ошибка загрузки участников: ${error.message}`);
  }
  
  return (data || []) as RoomMember[];
}

/**
 * Обновляет название комнаты (только для создателя)
 */
export async function updateRoomName(
  roomId: string,
  userId: string,
  newName: string
): Promise<Room> {
  // Проверяем, что пользователь - создатель
  const { data: room, error: checkError } = await supabase
    .from('rooms')
    .select('creator_id')
    .eq('id', roomId)
    .maybeSingle();
  
  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error(`Ошибка проверки комнаты: ${checkError.message}`);
  }
  
  if (!room || room.creator_id !== userId) {
    throw new Error('Только создатель может изменять комнату');
  }
  
  // Обновляем название
  const { data, error } = await supabase
    .from('rooms')
    .update({ name: newName } as never)
    .eq('id', roomId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Ошибка обновления комнаты: ${error.message}`);
  }
  
  return data as Room;
}

/**
 * Удаляет комнату (только для создателя)
 */
export async function deleteRoom(roomId: string, userId: string): Promise<void> {
  // Проверяем, что пользователь - создатель
  const { data: room, error: checkError } = await supabase
    .from('rooms')
    .select('creator_id')
    .eq('id', roomId)
    .maybeSingle();
  
  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error(`Ошибка проверки комнаты: ${checkError.message}`);
  }
  
  if (!room || room.creator_id !== userId) {
    throw new Error('Только создатель может удалить комнату');
  }
  
  // Удаляем комнату (каскадное удаление участников и игрушек)
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId);
  
  if (error) {
    throw new Error(`Ошибка удаления комнаты: ${error.message}`);
  }
}

/**
 * Обновляет дизайн комнаты (только для создателя)
 */
export async function updateRoomDesign(
  roomId: string,
  userId: string,
  designTheme: string,
  customBackgroundUrl?: string
): Promise<Room> {
  // Проверяем, что пользователь - создатель
  const { data: room, error: checkError } = await supabase
    .from('rooms')
    .select('creator_id')
    .eq('id', roomId)
    .maybeSingle();
  
  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error(`Ошибка проверки комнаты: ${checkError.message}`);
  }
  
  if (!room || room.creator_id !== userId) {
    throw new Error('Только создатель может изменять дизайн комнаты');
  }
  
  // Обновляем дизайн
  const updateData: any = {
    design_theme: designTheme,
  };
  
  if (designTheme === 'custom' && customBackgroundUrl) {
    updateData.custom_background_url = customBackgroundUrl;
  } else if (designTheme !== 'custom') {
    updateData.custom_background_url = null;
  }
  
  const { data, error } = await supabase
    .from('rooms')
    .update(updateData as never)
    .eq('id', roomId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Ошибка обновления дизайна: ${error.message}`);
  }
  
  return data as Room;
}

/**
 * Обновляет программу мероприятия (только для создателя)
 */
export async function updateRoomProgram(
  roomId: string,
  userId: string,
  eventProgram: string
): Promise<Room> {
  // Проверяем, что пользователь - создатель
  const { data: room, error: checkError } = await supabase
    .from('rooms')
    .select('creator_id')
    .eq('id', roomId)
    .maybeSingle();
  
  if (checkError && checkError.code !== 'PGRST116') {
    throw new Error(`Ошибка проверки комнаты: ${checkError.message}`);
  }
  
  if (!room || room.creator_id !== userId) {
    throw new Error('Только создатель может изменять программу мероприятия');
  }
  
  // Обновляем программу
  const { data, error } = await supabase
    .from('rooms')
    .update({ event_program: eventProgram } as never)
    .eq('id', roomId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Ошибка обновления программы: ${error.message}`);
  }
  
  return data as Room;
}
