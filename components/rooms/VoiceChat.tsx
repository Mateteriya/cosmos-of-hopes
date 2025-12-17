'use client';

/**
 * Профессиональный голосовой чат на WebRTC для комнаты
 * Поддерживает множественные соединения между участниками
 * Использует Supabase Realtime для сигналинга
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getRoomMembers } from '@/lib/rooms';
import { sendWebRTCSignal, subscribeToWebRTCSignals, cleanupOldSignals } from '@/lib/webrtcSignaling';
import type { RoomMember } from '@/types/room';

interface VoiceChatProps {
  roomId: string;
  currentUserId: string;
}

// STUN серверы (бесплатные, от Google и других)
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Дополнительные бесплатные STUN серверы
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.voiparound.com' },
    { urls: 'stun:stun.voipbuster.com' },
  ],
};

export default function VoiceChat({ roomId, currentUserId }: VoiceChatProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const remoteAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const isInitiatorRef = useRef<Map<string, boolean>>(new Map());
  const signalUnsubscribeRef = useRef<(() => void) | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      stopVoiceChat();
    };
  }, []);

  // Создает RTCPeerConnection для участника
  const createPeerConnection = useCallback((userId: string, isInitiator: boolean): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    
    // Добавляем локальный поток
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Обработка входящих потоков
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      remoteStreamsRef.current.set(userId, remoteStream);
      
      // Применяем поток к аудио элементу
      setTimeout(() => {
        const audioEl = remoteAudioRefs.current.get(userId);
        if (audioEl && remoteStream) {
          audioEl.srcObject = remoteStream;
          setConnectedUsers(prev => {
            const newSet = new Set(prev);
            newSet.add(userId);
            return newSet;
          });
        }
      }, 100);
    };

    // Обработка ICE кандидатов
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await sendWebRTCSignal(
            roomId,
            currentUserId,
            userId,
            'ice-candidate',
            (event.candidate as any).toJSON()
          );
        } catch (err) {
          console.error('Ошибка отправки ICE кандидата:', err);
        }
      }
    };

    // Обработка изменения состояния соединения
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`🔗 Соединение с ${userId.slice(-6)}: ${state}`);
      
      if (state === 'connected') {
        setConnectedUsers(prev => {
          const newSet = new Set(prev);
          newSet.add(userId);
          setTimeout(() => {
            setConnectionStatus(`✅ Подключено: ${newSet.size} ${newSet.size === 1 ? 'участник' : 'участников'}`);
          }, 0);
          return newSet;
        });
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        setConnectedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          setTimeout(() => {
            setConnectionStatus(newSet.size > 0 ? `✅ Подключено: ${newSet.size} ${newSet.size === 1 ? 'участник' : 'участников'}` : '🔄 Подключение...');
          }, 0);
          return newSet;
        });
        if (state !== 'closed') {
          pc.close();
        }
        peerConnectionsRef.current.delete(userId);
        remoteStreamsRef.current.delete(userId);
      }
    };

    return pc;
  }, [roomId, currentUserId, connectedUsers.size]);

  // Обработка входящих сигналов
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToWebRTCSignals(roomId, currentUserId, async (signal) => {
      const { from_user_id, signal_type, signal_data } = signal;

      // Игнорируем сигналы от самого себя
      if (from_user_id === currentUserId) return;

      let pc = peerConnectionsRef.current.get(from_user_id);

      try {
        if (signal_type === 'offer') {
          // Создаем peer connection для ответа
          if (!pc) {
            pc = createPeerConnection(from_user_id, false);
            peerConnectionsRef.current.set(from_user_id, pc);
            isInitiatorRef.current.set(from_user_id, false);
          }

          // Устанавливаем удаленное описание
          await pc.setRemoteDescription(new RTCSessionDescription(signal_data as RTCSessionDescriptionInit));

          // Создаем и отправляем answer
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          await sendWebRTCSignal(
            roomId,
            currentUserId,
            from_user_id,
            'answer',
            (answer as any).toJSON()
          );
        } else if (signal_type === 'answer') {
          // Устанавливаем удаленное описание
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal_data as RTCSessionDescriptionInit));
          }
        } else if (signal_type === 'ice-candidate') {
          // Добавляем ICE кандидат
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(signal_data as RTCIceCandidateInit));
          }
        }
      } catch (err) {
        console.error(`Ошибка обработки сигнала ${signal_type} от ${from_user_id}:`, err);
      }
    });

    signalUnsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
    };
  }, [isConnected, roomId, currentUserId, createPeerConnection]);

  // Подключение к другим участникам
  const connectToParticipants = useCallback(async () => {
    try {
      const members = await getRoomMembers(roomId);
      const otherMembers = members.filter(m => m.user_id !== currentUserId);

      for (const member of otherMembers) {
        const userId = member.user_id;
        
        // Пропускаем, если соединение уже существует
        if (peerConnectionsRef.current.has(userId)) continue;

        // Создаем peer connection как инициатор
        const pc = createPeerConnection(userId, true);
        peerConnectionsRef.current.set(userId, pc);
        isInitiatorRef.current.set(userId, true);

        // Создаем и отправляем offer
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        });
        await pc.setLocalDescription(offer);

        await sendWebRTCSignal(
          roomId,
          currentUserId,
          userId,
          'offer',
          (offer as any).toJSON()
        );
      }
    } catch (err) {
      console.error('Ошибка подключения к участникам:', err);
    }
  }, [roomId, currentUserId, createPeerConnection]);

  // Запуск голосового чата
  const startVoiceChat = async () => {
    try {
      // Запрашиваем доступ к микрофону
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
        video: false,
      });

      localStreamRef.current = stream;
      setIsConnected(true);
      setConnectionStatus('🔄 Подключение к участникам...');

      // Подключаемся к другим участникам
      await connectToParticipants();

      // Периодически очищаем старые сигналы и переподключаемся к новым участникам
      cleanupIntervalRef.current = setInterval(async () => {
        try {
          await cleanupOldSignals(roomId);
          await connectToParticipants();
        } catch (err) {
          console.error('Ошибка в периодической очистке:', err);
        }
      }, 15000); // Каждые 15 секунд

      setConnectionStatus('🔄 Подключение к участникам...');
    } catch (err: any) {
      console.error('Ошибка запуска голосового чата:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Не удалось получить доступ к микрофону. Пожалуйста, разрешите доступ к микрофону в настройках браузера.');
      } else {
        alert(`Ошибка запуска голосового чата: ${err.message}`);
      }
    }
  };

  // Остановка голосового чата
  const stopVoiceChat = () => {
    // Останавливаем локальный поток
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;

    // Закрываем все peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();

    // Очищаем удаленные потоки
    remoteStreamsRef.current.clear();
    remoteAudioRefs.current.clear();
    isInitiatorRef.current.clear();

    // Отписываемся от сигналов
    if (signalUnsubscribeRef.current) {
      signalUnsubscribeRef.current();
      signalUnsubscribeRef.current = null;
    }

    // Останавливаем интервал очистки
    if (cleanupIntervalRef.current) {
      clearInterval(cleanupIntervalRef.current);
      cleanupIntervalRef.current = null;
    }

    setIsConnected(false);
    setConnectedUsers(new Set());
    setConnectionStatus('');
  };

  // Переключение микрофона
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg p-2 sm:p-3 lg:p-4">
      <div className="text-white font-bold text-xs sm:text-sm mb-2 sm:mb-3">🎤 Голосовой чат</div>
      
      {/* Скрытые аудио элементы для удаленных потоков */}
      {Array.from(remoteStreamsRef.current.keys()).map((userId) => (
        <audio
          key={userId}
          ref={(el) => {
            if (el) {
              remoteAudioRefs.current.set(userId, el);
              const stream = remoteStreamsRef.current.get(userId);
              if (stream) {
                el.srcObject = stream;
              }
            }
          }}
          autoPlay
          playsInline
        />
      ))}

      {!isConnected ? (
        <button
          onClick={startVoiceChat}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-xs sm:text-sm"
        >
          🎤 Включить голосовой чат
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={toggleMute}
              className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-colors ${
                isMuted
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isMuted ? '🔇 Включить звук' : '🔊 Выключить звук'}
            </button>
            <button
              onClick={stopVoiceChat}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-xs sm:text-sm"
            >
              ❌ Отключиться
            </button>
          </div>
          
          {connectionStatus && (
            <div className="text-white/70 text-[10px] sm:text-xs text-center">
              {connectionStatus}
            </div>
          )}
          
          {connectedUsers.size > 0 && (
            <div className="text-white/60 text-[9px] sm:text-[10px] text-center">
              🔊 Слушаете: {connectedUsers.size} {connectedUsers.size === 1 ? 'участника' : 'участников'}
            </div>
          )}
        </div>
      )}

      <div className="mt-2 text-white/50 text-[9px] sm:text-[10px] text-center">
        Профессиональное качество связи
      </div>
    </div>
  );
}
