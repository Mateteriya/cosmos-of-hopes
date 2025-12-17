/**
 * Сервис для работы с сообщениями в чате комнаты
 */

import { supabase } from './supabase';
import type { RoomMessage } from '@/types/room';

/**
 * Отправляет сообщение в чат комнаты
 */
export async function sendRoomMessage(
  roomId: string,
  userId: string,
  messageText: string
): Promise<RoomMessage> {
  if (!messageText.trim()) {
    throw new Error('Сообщение не может быть пустым');
  }

  if (messageText.length > 500) {
    throw new Error('Сообщение слишком длинное (максимум 500 символов)');
  }

  const { data, error } = await supabase
    .from('room_messages')
    .insert({
      room_id: roomId,
      user_id: userId,
      message_text: messageText.trim(),
    } as never)
    .select()
    .single();

  if (error) {
    throw new Error(`Ошибка отправки сообщения: ${error.message}`);
  }

  return data as RoomMessage;
}

/**
 * Получает сообщения комнаты
 */
export async function getRoomMessages(
  roomId: string,
  limit: number = 100
): Promise<RoomMessage[]> {
  const { data, error } = await supabase
    .from('room_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Ошибка загрузки сообщений: ${error.message}`);
  }

  return (data || []) as RoomMessage[];
}

/**
 * Подписывается на новые сообщения комнаты (для Realtime)
 */
export function subscribeToRoomMessages(
  roomId: string,
  onMessage: (message: RoomMessage) => void
) {
  const channel = supabase
    .channel(`room_messages:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'room_messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        onMessage(payload.new as RoomMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
