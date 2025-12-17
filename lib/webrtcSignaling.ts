/**
 * Сервис для WebRTC сигналинга через Supabase Realtime
 * Используется для обмена SDP offers/answers и ICE candidates между участниками
 */

import { supabase } from './supabase';

export type SignalType = 'offer' | 'answer' | 'ice-candidate';

export interface WebRTCSignal {
  id: string;
  room_id: string;
  from_user_id: string;
  to_user_id: string;
  signal_type: SignalType;
  signal_data: RTCSessionDescriptionInit | RTCIceCandidateInit;
  created_at: string;
}

/**
 * Отправляет WebRTC сигнал другому участнику
 */
export async function sendWebRTCSignal(
  roomId: string,
  fromUserId: string,
  toUserId: string,
  signalType: SignalType,
  signalData: RTCSessionDescriptionInit | RTCIceCandidateInit
): Promise<void> {
  const { error } = await supabase
    .from('webrtc_signaling')
    .insert({
      room_id: roomId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      signal_type: signalType,
      signal_data: signalData as any,
    });

  if (error) {
    console.error('Ошибка отправки WebRTC сигнала:', error);
    throw new Error(`Не удалось отправить сигнал: ${error.message}`);
  }
}

/**
 * Подписывается на входящие WebRTC сигналы для текущего пользователя
 */
export function subscribeToWebRTCSignals(
  roomId: string,
  currentUserId: string,
  onSignal: (signal: WebRTCSignal) => void
): () => void {
  const channel = supabase
    .channel(`webrtc_signaling:${roomId}:${currentUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'webrtc_signaling',
        filter: `room_id=eq.${roomId} AND to_user_id=eq.${currentUserId}`,
      },
      (payload) => {
        const signal = payload.new as WebRTCSignal;
        // Игнорируем старые сигналы (старше 30 секунд)
        const signalAge = Date.now() - new Date(signal.created_at).getTime();
        if (signalAge < 30000) {
          onSignal(signal);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Очищает старые сигналы для комнаты (вызывается периодически)
 */
export async function cleanupOldSignals(roomId: string): Promise<void> {
  const { error } = await supabase
    .from('webrtc_signaling')
    .delete()
    .eq('room_id', roomId)
    .lt('created_at', new Date(Date.now() - 60000).toISOString()); // Старше 1 минуты

  if (error) {
    console.error('Ошибка очистки старых сигналов:', error);
  }
}
