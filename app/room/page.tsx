'use client';

/**
 * Страница комнаты для совместного празднования Нового года
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRoomById, updateRoomDesign, updateRoomProgram } from '@/lib/rooms';
import type { Room, DesignTheme, EventProgram } from '@/types/room';
import RoomChat from '@/components/rooms/RoomChat';
import NewYearTimer from '@/components/rooms/NewYearTimer';
import RoomDesignSelector from '@/components/rooms/RoomDesignSelector';
import EventProgramSelector from '@/components/rooms/EventProgramSelector';
import RoomParticipants from '@/components/rooms/RoomParticipants';
import InviteLink from '@/components/rooms/InviteLink';
import VoiceChat from '@/components/rooms/VoiceChat';

// Route segment config
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

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

function RoomPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');
  
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tempUserId] = useState<string>(() => getTempUserId());

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

  const loadRoom = async () => {
    if (!roomId) return;
    
    try {
      setLoading(true);
      const roomData = await getRoomById(roomId);
      if (!roomData) {
        setError('Комната не найдена');
        return;
      }
      setRoom(roomData);
    } catch (err) {
      console.error('Ошибка загрузки комнаты:', err);
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
        <div className="text-white text-2xl font-bold">Загрузка комнаты...</div>
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
          Вернуться к списку комнат
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
      className={`w-full h-screen relative overflow-hidden ${getBackgroundClassName()}`}
      style={getBackgroundStyle()}
    >
      {/* Overlay для читаемости */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Контент */}
      <div className="relative z-10 w-full h-full flex flex-col p-2 sm:p-3 lg:p-4 gap-2 sm:gap-3 lg:gap-4">
        {/* Заголовок */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold truncate">🏠 {room.name}</h1>
            <p className="text-white/70 text-xs sm:text-sm">Код приглашения: {room.invite_code}</p>
          </div>
          <button
            onClick={() => router.push('/rooms')}
            className="bg-slate-700/80 hover:bg-slate-700 text-white font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all text-sm sm:text-base whitespace-nowrap"
          >
            ← Назад к комнатам
          </button>
        </div>

        {/* Основной контент - сетка */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 overflow-hidden min-h-0">
          {/* Левая колонка: Таймер, настройки, участники и приглашение */}
          <div className="space-y-2 sm:space-y-3 lg:space-y-4 overflow-y-auto max-h-full min-h-0">
            <NewYearTimer midnightUTC={room.midnight_utc} timezone={room.timezone} />
            
            {/* Ссылка приглашения */}
            <InviteLink inviteCode={room.invite_code} roomId={room.id} />
            
            {/* Участники комнаты */}
            <RoomParticipants roomId={room.id} currentUserId={tempUserId} />
            
            {/* Голосовой чат */}
            <VoiceChat roomId={room.id} currentUserId={tempUserId} />
            
            {/* Селекторы дизайна и программы (только для создателя) */}
            {isCreator && (
              <>
                <RoomDesignSelector
                  currentTheme={room.design_theme || 'classic'}
                  currentCustomUrl={room.custom_background_url}
                  onThemeChange={handleDesignChange}
                  isCreator={isCreator}
                />
                
                <EventProgramSelector
                  currentProgram={room.event_program || 'chat'}
                  onProgramChange={handleProgramChange}
                  isCreator={isCreator}
                />
              </>
            )}
            
            {/* Только просмотр для не-создателей */}
            {!isCreator && (
              <>
                <RoomDesignSelector
                  currentTheme={room.design_theme || 'classic'}
                  currentCustomUrl={room.custom_background_url}
                  onThemeChange={handleDesignChange}
                  isCreator={false}
                />
                
                <EventProgramSelector
                  currentProgram={room.event_program || 'chat'}
                  onProgramChange={handleProgramChange}
                  isCreator={false}
                />
              </>
            )}
          </div>

          {/* Центральная колонка: Основной контент (программа мероприятия) */}
          <div className="md:col-span-2 lg:col-span-2 overflow-y-auto max-h-full min-h-0">
            {room.event_program === 'chat' && (
              <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg p-4 h-full flex items-center justify-center">
                <div className="text-center text-white/70">
                  <div className="text-4xl mb-4">💬</div>
                  <div className="text-lg">Общайтесь в чате справа!</div>
                </div>
              </div>
            )}
            
            {room.event_program === 'video_watch' && (
              <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg p-4 h-full">
                <div className="text-white font-bold text-sm mb-4">🎬 Совместный просмотр</div>
                {isCreator ? (
                  <div className="space-y-4">
                    <div className="text-white/70 text-sm">
                      Загрузите видео для совместного просмотра
                    </div>
                    <input
                      type="text"
                      placeholder="YouTube URL или ссылка на видео"
                      className="w-full bg-slate-700/50 text-white px-4 py-2 rounded-lg border border-white/20"
                    />
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg">
                      Загрузить видео
                    </button>
                  </div>
                ) : (
                  <div className="text-white/70 text-sm text-center">
                    Ожидаем, пока создатель загрузит видео...
                  </div>
                )}
              </div>
            )}
            
            {(room.event_program === 'quiz' || room.event_program === 'music_guess' || room.event_program === 'truth_or_dare') && (
              <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg p-4 h-full flex items-center justify-center">
                <div className="text-center text-white/70">
                  <div className="text-4xl mb-4">🚧</div>
                  <div className="text-lg">Эта программа скоро появится!</div>
                  <div className="text-sm mt-2">Пока общайтесь в чате 💬</div>
                </div>
              </div>
            )}
          </div>

          {/* Правая колонка: Чат */}
          <div className="md:col-span-1 lg:col-span-1 h-full min-h-[300px] sm:min-h-[400px] md:min-h-0 max-h-full flex flex-col">
            <RoomChat roomId={room.id} currentUserId={tempUserId} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen">Загрузка...</div>}>
      <RoomPageContent />
    </Suspense>
  );
}
