'use client';

/**
 * Страница комнаты для совместного празднования Нового года
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRoomById, updateRoomDesign, updateRoomProgram } from '@/lib/rooms';
import { useLanguage } from '@/components/constructor/LanguageProvider';
import type { Room, DesignTheme, EventProgram } from '@/types/room';
import RoomChat from '@/components/rooms/RoomChat';
import NewYearTimer from '@/components/rooms/NewYearTimer';
import RoomDesignSelector from '@/components/rooms/RoomDesignSelector';
import EventProgramSelector from '@/components/rooms/EventProgramSelector';
import RoomParticipants from '@/components/rooms/RoomParticipants';
import InviteLink from '@/components/rooms/InviteLink';
import VoiceChat from '@/components/rooms/VoiceChat';
import VideoRoom from '@/components/rooms/VideoRoom';

// Временный userId для тестирования (позже будет из Telegram)
// Используем localStorage для сохранения ID между перезагрузками
const getTempUserId = (): string => {
  if (typeof window === 'undefined') return 'test_user_default';
  const stored = localStorage.getItem('temp_user_id');
  if (stored) return stored;
  const newId = 'test_user_' + Date.now();
  localStorage.setItem('temp_user_id', newId);
  return newId;
};

export default function RoomPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tempUserId] = useState<string>(() => getTempUserId());
  const [videoChatEnabled, setVideoChatEnabled] = useState(false);

  // Получаем roomId из URL параметров после монтирования
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomIdParam = params.get('room');
      console.log('🔍 Загрузка roomId из URL:', { roomIdParam, fullUrl: window.location.href, search: window.location.search });
      if (roomIdParam) {
        setRoomId(roomIdParam);
      } else {
        // Если roomId не найден в параметрах, проверяем hash или другие варианты
        const hashMatch = window.location.hash.match(/room=([^&]+)/);
        if (hashMatch) {
          setRoomId(hashMatch[1]);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (roomId) {
      loadRoom();
    } else {
      setError('Комната не указана');
      setLoading(false);
    }
  }, [roomId]);

  // Отладка для проверки isCreator (должен быть до условных возвратов!)
  useEffect(() => {
    if (room) {
      const isCreatorCheck = room.creator_id === tempUserId;
      console.log('🔍 Отладка комнаты:', {
        roomCreatorId: room.creator_id,
        tempUserId,
        isCreator: isCreatorCheck,
        match: room.creator_id === tempUserId,
        roomId: room.id,
      });
    }
  }, [room, tempUserId]);

  const loadRoom = async (retryCount = 0) => {
    if (!roomId) return;
    
    try {
      setLoading(true);
      setError(null);
      const roomData = await getRoomById(roomId);
      if (!roomData) {
        // Если комната не найдена и это первая попытка, пробуем еще раз через 1 секунду
        if (retryCount < 3) {
          console.log(`Повторная попытка загрузки комнаты (${retryCount + 1}/3)...`);
          setTimeout(() => loadRoom(retryCount + 1), 1000);
          return;
        }
        setError('Комната не найдена');
        return;
      }
      setRoom(roomData);
    } catch (err) {
      console.error('Ошибка загрузки комнаты:', err);
      // Если ошибка и это первая попытка, пробуем еще раз
      if (retryCount < 3) {
        setTimeout(() => loadRoom(retryCount + 1), 1000);
        return;
      }
      setError('Не удалось загрузить комнату');
    } finally {
      setLoading(false);
    }
  };

  const handleDesignChange = async (theme: DesignTheme, customUrl?: string) => {
    if (!room || !roomId) return;
    
    try {
      await updateRoomDesign(roomId, tempUserId, theme, customUrl);
      setRoom({ ...room, design_theme: theme, custom_background_url: customUrl || null });
    } catch (err: any) {
      alert(err.message || 'Не удалось изменить дизайн');
    }
  };

  const handleProgramChange = async (program: EventProgram) => {
    if (!room || !roomId) return;
    
    try {
      await updateRoomProgram(roomId, tempUserId, program);
      setRoom({ ...room, event_program: program });
    } catch (err: any) {
      alert(err.message || 'Не удалось изменить программу');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">{t('loadingRoom')}</div>
      </div>
    );
  }

  // Вычисляем isCreator ДО условных возвратов (чтобы не нарушать правила хуков)
  const isCreator = room?.creator_id === tempUserId;

  if (error || !room) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">{error || 'Комната не найдена'}</div>
        <button
          onClick={() => router.push('/rooms')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg"
        >
          {t('backToRoomsList')}
        </button>
      </div>
    );
  }

  // Определяем фон в зависимости от темы дизайна
  const getBackgroundStyle = (): React.CSSProperties => {
    if (room.design_theme === 'custom' && room.custom_background_url) {
      return {
        backgroundImage: `url(${room.custom_background_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    
    // Для остальных тем возвращаем пустой объект (используем className)
    return {};
  };

  const getBackgroundClassName = (): string => {
    const themeStyles: Record<DesignTheme, string> = {
      classic: 'bg-gradient-to-br from-green-900 via-red-900 to-yellow-900',
      cosmic: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-black',
      minimal: 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300',
      urban: 'bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900',
      custom: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
    };
    
    return themeStyles[room.design_theme || 'classic'];
  };

  return (
    <div
      className={`w-full min-h-screen relative overflow-hidden ${getBackgroundClassName()}`}
      style={getBackgroundStyle()}
    >
      {/* Overlay для читаемости */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Контент */}
      <div className="relative z-10 w-full h-screen flex flex-col">
        {/* Заголовок с таймером */}
        <div className="flex-shrink-0 p-2 sm:p-3 bg-slate-900/80 backdrop-blur-sm border-b border-white/10 relative">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Левая часть: кнопка назад и название комнаты */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={() => router.push('/')}
                className="bg-slate-700/80 hover:bg-slate-700 text-white font-bold p-2 sm:p-2.5 rounded-lg transition-all flex-shrink-0"
                title={t('home')}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
              <button
                onClick={() => router.push('/rooms')}
                className="bg-slate-700/80 hover:bg-slate-700 text-white font-bold px-2 sm:px-3 py-1 sm:py-2 rounded-lg transition-all text-sm whitespace-nowrap flex-shrink-0"
              >
                ←
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-white text-lg sm:text-xl lg:text-2xl font-bold truncate flex items-center gap-2">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {room.name}
                </h1>
                <p className="text-white/70 text-xs">Код: {room.invite_code}</p>
              </div>
            </div>
            
            {/* Правая часть: таймер (только на ПК) */}
            <div className="hidden md:flex justify-end items-center mr-2 sm:mr-4">
              <NewYearTimer midnightUTC={room.midnight_utc} timezone={room.timezone} />
            </div>
          </div>
        </div>

        {/* Таймер в центре страницы (только на мобильных) */}
        <div className="flex-shrink-0 flex md:hidden justify-center items-center p-4 z-20">
          <div className="w-full max-w-md px-4">
            <NewYearTimer midnightUTC={room.midnight_utc} timezone={room.timezone} />
          </div>
        </div>

        {/* Основной контент - три колонки */}
        <div className="flex-1 flex p-3 sm:p-4 pb-20 overflow-y-auto overflow-x-hidden">
          {/* Левая колонка: Видеочат */}
          <div className="flex-1 flex flex-col gap-2.5 sm:gap-3 mr-3 sm:mr-4">
            {/* Переключатель видео/голоса */}
            <div className="bg-slate-800/60 backdrop-blur-md border border-white/20 rounded-lg p-2 sm:p-2.5 flex-shrink-0">
              <div className="text-white font-bold text-xs sm:text-sm mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Коммуникация
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setVideoChatEnabled(false)}
                  className={`flex-1 px-3 py-1.5 rounded-lg font-bold text-xs transition-all touch-manipulation ${
                    !videoChatEnabled
                      ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg'
                      : 'bg-slate-700/80 hover:bg-slate-600 active:bg-slate-500 text-white/70'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Голос
                </button>
                <button
                  onClick={() => setVideoChatEnabled(true)}
                  className={`flex-1 px-3 py-1.5 rounded-lg font-bold text-xs transition-all touch-manipulation ${
                    videoChatEnabled
                      ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg'
                      : 'bg-slate-700/80 hover:bg-slate-600 active:bg-slate-500 text-white/70'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Видео
                </button>
              </div>
            </div>

            {/* Видеочат */}
            <div className="flex-1 bg-slate-800/40 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden min-h-[333px] sm:min-h-[417px]">
              {videoChatEnabled ? (
                <VideoRoom roomId={room.id} currentUserId={tempUserId} />
              ) : (
                <VoiceChat roomId={room.id} currentUserId={tempUserId} />
              )}
            </div>
          </div>

          {/* Средняя колонка: Приглашение + Селекторы (только для создателя) */}
          <div className="flex-shrink-0 flex flex-col gap-3 sm:gap-4 w-[246px] sm:w-[295px] mr-1.5 sm:mr-2 overflow-visible">
            {/* Приглашение */}
            <div className="flex-shrink-0">
              <InviteLink inviteCode={room.invite_code} roomId={room.id} />
            </div>

            {/* Селекторы (только для создателя) */}
            {isCreator && (
              <>
                <RoomDesignSelector
                  currentTheme={room.design_theme || 'classic'}
                  currentCustomUrl={room.custom_background_url}
                  onThemeChange={handleDesignChange}
                  isCreator={true}
                />
                <EventProgramSelector
                  currentProgram={room.event_program || 'chat'}
                  onProgramChange={handleProgramChange}
                  isCreator={true}
                />
              </>
            )}
          </div>

          {/* Правая колонка: Компактный чат + панельки */}
          <div className="flex-1 flex flex-col gap-3 sm:gap-4 mr-2 sm:mr-4">
            {/* Участники */}
            <div className="flex-shrink-0">
              <RoomParticipants roomId={room.id} currentUserId={tempUserId} />
            </div>

            {/* Компактный чат */}
            <div className="flex-1 min-h-[300px]">
              <RoomChat roomId={room.id} currentUserId={tempUserId} />
            </div>

            {/* Селекторы для просмотра (не создатели) */}
            {!isCreator && (
              <div className="flex-shrink-0 space-y-3">
                <RoomDesignSelector
                  currentTheme={room.design_theme || 'classic'}
                  currentCustomUrl={room.custom_background_url}
                  onThemeChange={() => {}}
                  isCreator={false}
                />
                <EventProgramSelector
                  currentProgram={room.event_program || 'chat'}
                  onProgramChange={() => {}}
                  isCreator={false}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

