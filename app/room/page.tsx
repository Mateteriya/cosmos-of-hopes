'use client';

/**
 * Страница комнаты для совместного празднования Нового года
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRoomById, updateRoomDesign, updateRoomProgram, joinRoom } from '@/lib/rooms';
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
import CompactParticipants from '@/components/rooms/CompactParticipants';
import { BackIcon, HomeIcon, ShareIcon, DesignIcon, ArrowDownIcon } from '@/components/icons/RoomIcons';

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
  const [roomNameExpanded, setRoomNameExpanded] = useState(false);
  const [designSelectorOpen, setDesignSelectorOpen] = useState(false);
  const [inviteExpanded, setInviteExpanded] = useState(false);
  const [programExpanded, setProgramExpanded] = useState(false);
  const [videoChatCollapsed, setVideoChatCollapsed] = useState(false);
  const [textChatCollapsed, setTextChatCollapsed] = useState(false);

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

  // Прокрутка вверх при загрузке страницы - только один раз при монтировании
  useEffect(() => {
    if (typeof window !== 'undefined' && room) {
      // Прокручиваем только один раз при первой загрузке комнаты
      const scrollToTop = () => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };
      scrollToTop();
      // Одна дополнительная попытка через небольшую задержку
      const timeoutId = setTimeout(scrollToTop, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [room?.id]); // Только при изменении ID комнаты, а не при каждом изменении room

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
      
      // Автоматически присоединяем пользователя к комнате, если он еще не участник
      try {
        await joinRoom(roomId, tempUserId);
        console.log('Пользователь автоматически присоединен к комнате');
      } catch (joinErr: any) {
        // Игнорируем ошибку, если пользователь уже участник
        if (!joinErr.message.includes('уже участник')) {
          console.log('Пользователь уже участник комнаты или ошибка присоединения:', joinErr.message);
        }
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
    
    if (room.design_theme === 'urban') {
      return {
        backgroundImage: 'url(/Tokyo.jpg)',
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
      urban: '', // Теперь используем изображение через getBackgroundStyle
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
        {/* ПК ВЕРСИЯ - Заголовок с таймером */}
        <div className="hidden md:block flex-shrink-0 p-2 sm:p-3 bg-slate-900/80 backdrop-blur-sm border-b border-white/10 relative" style={{ zIndex: 10 }}>
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Левая часть: кнопки назад, главная и название комнаты */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={() => router.push('/rooms')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={t('back')}
              >
                <BackIcon size={20} className="text-white" />
              </button>
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={t('home')}
              >
                <HomeIcon size={20} className="text-white" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-white text-lg sm:text-xl lg:text-2xl font-bold truncate flex items-center gap-2">
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

        {/* ВЕРХНЯЯ ПАНЕЛЬ - Мобильная и ПК версии */}
        {/* МОБИЛЬНАЯ ВЕРСИЯ - Верхняя панель */}
        <div className="md:hidden flex-shrink-0 bg-slate-900/80 backdrop-blur-sm border-b border-white/10">
          {/* Строка 1: Навигация и кнопки */}
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            {/* Левая часть: Назад и Главная */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/rooms')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
                title={t('back')}
              >
                <BackIcon size={20} className="text-white" />
              </button>
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
                title={t('home')}
              >
                <HomeIcon size={20} className="text-white" />
              </button>
            </div>

            {/* Центр: Название комнаты (сворачиваемое) */}
            <button
              onClick={() => setRoomNameExpanded(!roomNameExpanded)}
              className="flex-1 min-w-0 px-2 py-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <div className="text-white font-semibold text-sm truncate">
                {roomNameExpanded ? room.name : room.name.slice(0, 2).toUpperCase()}
              </div>
            </button>

            {/* Правая часть: Поделиться (только для создателя) */}
            <div className="flex items-center gap-2">
              {isCreator && (
                <button
                  onClick={() => {
                    // Логика поделиться
                    const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/rooms?invite=${room.invite_code}`;
                    navigator.clipboard.writeText(inviteUrl).then(() => {
                      alert(t('copied') || 'Скопировано!');
                    });
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
                  title={t('share')}
                >
                  <ShareIcon size={20} className="text-white" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* МОБИЛЬНАЯ ВЕРСИЯ - Таймер под верхней панелью */}
        <div className="md:hidden flex-shrink-0 px-3 py-3">
          <div className="text-white/90 text-sm font-semibold mb-2 text-center">
            {t('timerUntilNewYear')}
          </div>
          <NewYearTimer midnightUTC={room.midnight_utc} timezone={room.timezone} />
        </div>

        {/* Таймер в центре страницы (только на мобильных) - УДАЛЕНО, теперь вверху */}

        {/* ПК ВЕРСИЯ - Основной контент - три колонки */}
        <div className="hidden md:flex flex-1 p-3 sm:p-4 pb-20 overflow-y-auto overflow-x-hidden">
          {/* Левая колонка: Приглашение + Дизайн + Видеочат */}
          <div className="flex-[1.3] flex flex-col gap-2.5 sm:gap-3 mr-3 sm:mr-4">
            {/* Приглашение друзей и Селектор дизайна в одной строке */}
            <div className="flex-shrink-0 flex flex-row gap-1.5 sm:gap-2">
              <div className="flex-1" style={{ minWidth: 0 }}>
                <InviteLink inviteCode={room.invite_code} roomId={room.id} roomName={room.name} />
              </div>
              <div className="flex-1" style={{ zIndex: 100, minWidth: 0 }}>
                <RoomDesignSelector
                  currentTheme={room.design_theme || 'classic'}
                  currentCustomUrl={room.custom_background_url}
                  onThemeChange={handleDesignChange}
                  isCreator={isCreator}
                />
              </div>
            </div>

            {/* Видеочат */}
            <div className={`flex-1 bg-slate-800/40 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden p-[1px] transition-all duration-300 ${
              videoChatCollapsed ? 'min-h-0 max-h-[60px]' : 'min-h-[333px] sm:min-h-[417px]'
            }`}>
              <VideoRoom 
                roomId={room.id} 
                currentUserId={tempUserId} 
                isCollapsed={videoChatCollapsed}
                onToggleCollapse={() => setVideoChatCollapsed(!videoChatCollapsed)}
              />
            </div>
          </div>

          {/* Средняя колонка: Селекторы (только для создателя) - пока пустая */}
          <div className="flex-shrink-0 flex flex-col gap-3 sm:gap-4 w-[90px] sm:w-[110px] mr-1.5 sm:mr-2 overflow-visible" style={{ zIndex: 1 }}>

            {/* Селекторы (только для создателя) */}
            {isCreator && (
              <>
                {/* Закомментировано для следующей версии
                <EventProgramSelector
                  currentProgram={room.event_program || 'chat'}
                  onProgramChange={handleProgramChange}
                  isCreator={true}
                />
                */}
                <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg p-1.5 sm:p-2 opacity-60">
                  <div className="text-white/70 font-bold text-[10px] sm:text-xs mb-0.5 text-center">🎮 {t('eventProgram')}</div>
                  <div className="text-white/50 text-[9px] sm:text-[10px] text-center">
                    {t('comingInNextVersion')}
                  </div>
                </div>
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
            <div className={`flex-1 transition-all duration-300 ${
              textChatCollapsed ? 'min-h-0 max-h-[60px]' : 'min-h-[300px]'
            }`}>
              <RoomChat 
                roomId={room.id} 
                currentUserId={tempUserId}
                isCollapsed={textChatCollapsed}
                onToggleCollapse={() => setTextChatCollapsed(!textChatCollapsed)}
              />
            </div>

            {/* Селекторы для просмотра (не создатели) */}
            {!isCreator && (
              <div className="flex-shrink-0 space-y-3">
                {/* Закомментировано для следующей версии
                <EventProgramSelector
                  currentProgram={room.event_program || 'chat'}
                  onProgramChange={() => {}}
                  isCreator={false}
                />
                */}
                <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg p-1.5 sm:p-2 opacity-60">
                  <div className="text-white/70 font-bold text-[10px] sm:text-xs mb-0.5 text-center">🎮 {t('eventProgram')}</div>
                  <div className="text-white/50 text-[9px] sm:text-[10px] text-center">
                    {t('comingInNextVersion')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* МОБИЛЬНАЯ ВЕРСИЯ - Основной контент */}
        <div className="md:hidden flex-1 flex flex-col overflow-y-auto overflow-x-hidden px-3 py-3 gap-3">
          {/* Селектор дизайна комнаты - длинная тонкая кнопка над чатом */}
          <div className="flex-shrink-0 relative">
            <button
              onClick={() => setDesignSelectorOpen(!designSelectorOpen)}
              className="w-full bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg px-4 py-2 flex items-center justify-between hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <DesignIcon size={18} className="text-white" />
                <span className="text-white font-semibold text-sm">{t('roomDesign')}</span>
              </div>
              <span className="text-white/50 text-xs">{designSelectorOpen ? '▼' : '▶'}</span>
            </button>
            {designSelectorOpen && (
              <>
                <div
                  className="fixed inset-0 z-[99998]"
                  onClick={() => setDesignSelectorOpen(false)}
                />
                <div className="absolute top-full left-3 right-3 mt-2 z-[99999] bg-slate-800/95 backdrop-blur-md border-2 border-white/20 rounded-lg shadow-lg max-h-[60vh] overflow-y-auto p-3">
                  {/* Упрощенный селектор для мобильной версии - сразу показывает все варианты */}
                  <div className="text-white font-bold text-sm mb-3">{t('selectRoomDesign')}</div>
                  <div className="space-y-2">
                    {[
                      { value: 'classic', emoji: '🎄', nameKey: 'designClassic', descKey: 'designClassicDesc' },
                      { value: 'cosmic', emoji: '🌌', nameKey: 'designCosmic', descKey: 'designCosmicDesc' },
                      { value: 'minimal', emoji: '✨', nameKey: 'designMinimal', descKey: 'designMinimalDesc' },
                      { value: 'urban', emoji: '🏙️', nameKey: 'designUrban', descKey: 'designUrbanDesc' },
                      { value: 'custom', emoji: '🎨', nameKey: 'designCustom', descKey: 'designCustomDesc' },
                    ].map((theme) => {
                      const isSelected = (room.design_theme || 'classic') === theme.value;
                      return (
                        <button
                          key={theme.value}
                          onClick={() => {
                            if (theme.value === 'custom') {
                              // Для custom нужно загрузить изображение
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/png,image/jpeg,image/jpg';
                              input.onchange = (e: any) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = URL.createObjectURL(file);
                                  handleDesignChange('custom', url);
                                  setDesignSelectorOpen(false);
                                }
                              };
                              input.click();
                            } else {
                              handleDesignChange(theme.value as DesignTheme);
                              setDesignSelectorOpen(false);
                            }
                          }}
                          className={`w-full p-3 flex items-start gap-2 transition-all text-left rounded-lg ${
                            isSelected ? 'bg-blue-500/20 border-2 border-blue-400' : 'bg-slate-700/50 border-2 border-white/10'
                          } hover:bg-blue-600/60 hover:border-blue-400`}
                        >
                          <span className="text-lg flex-shrink-0">{theme.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-white font-semibold text-sm">{t(theme.nameKey as any)}</div>
                            <div className="text-white/60 text-xs mt-0.5">{t(theme.descKey as any)}</div>
                          </div>
                          {isSelected && (
                            <span className="text-blue-400 text-sm">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Чат текстовый */}
          <div className="flex-shrink-0 relative">
            <div className={`bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg overflow-hidden flex flex-col transition-all duration-300 ${
              textChatCollapsed ? 'max-h-[60px]' : ''
            }`} style={textChatCollapsed ? {} : { height: '450px' }}>
              {/* Заголовок с кнопкой свернуть (для мобильной версии) */}
              <div className={`flex-shrink-0 px-3 pt-2 pb-1 border-b border-white/10 flex items-center justify-between transition-all duration-300 ${
                textChatCollapsed ? '' : 'hidden'
              }`}>
                <h3 className="text-white font-bold text-xs sm:text-sm">💬 {t('roomChat')}</h3>
                <button
                  onClick={() => setTextChatCollapsed(!textChatCollapsed)}
                  className="bg-gradient-to-b from-purple-700/90 via-purple-800/90 to-purple-900/90 hover:from-purple-600/90 hover:via-purple-700/90 hover:to-purple-800/90 text-white px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 touch-manipulation border border-white/20 backdrop-blur-sm shadow-md"
                  style={{
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 1px 2px rgba(0, 0, 0, 0.2)',
                    textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)',
                  }}
                  title={textChatCollapsed ? t('expand') || 'Развернуть' : t('collapse') || 'Свернуть'}
                >
                  {textChatCollapsed ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {t('expand') || 'Развернуть'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      {t('collapse') || 'Свернуть'}
                    </span>
                  )}
                </button>
              </div>
              {/* Участники внутри чата */}
              <div className={`flex-shrink-0 px-3 pt-2 pb-1 border-b border-white/10 transition-all duration-300 ${
                textChatCollapsed ? 'max-h-0 opacity-0 overflow-hidden p-0 border-0' : 'opacity-100'
              }`}>
                <CompactParticipants 
                  roomId={room.id} 
                  currentUserId={tempUserId} 
                  isCreator={isCreator}
                  maxInvites={10}
                />
              </div>
              {/* Кнопка свернуть вверху (когда развернуто) */}
              <div className={`flex-shrink-0 px-3 pt-2 pb-1 border-b border-white/10 flex items-center justify-between transition-all duration-300 ${
                textChatCollapsed ? 'hidden' : ''
              }`}>
                <h3 className="text-white font-bold text-xs sm:text-sm">💬 {t('roomChat')}</h3>
                <button
                  onClick={() => setTextChatCollapsed(!textChatCollapsed)}
                  className="bg-gradient-to-b from-purple-700/90 via-purple-800/90 to-purple-900/90 hover:from-purple-600/90 hover:via-purple-700/90 hover:to-purple-800/90 text-white px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 touch-manipulation border border-white/20 backdrop-blur-sm shadow-md"
                  style={{
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 1px 2px rgba(0, 0, 0, 0.2)',
                    textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)',
                  }}
                  title={t('collapse') || 'Свернуть'}
                >
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    {t('collapse') || 'Свернуть'}
                  </span>
                </button>
              </div>
              {/* Окно чата (без заголовка, т.к. участники уже есть) */}
              <div className={`flex-1 min-h-0 flex flex-col overflow-hidden transition-all duration-300 ${
                textChatCollapsed ? 'max-h-0 opacity-0' : 'opacity-100'
              }`}>
                <RoomChat 
                  roomId={room.id} 
                  currentUserId={tempUserId} 
                  hideHeader={true}
                  isCollapsed={textChatCollapsed}
                  onToggleCollapse={() => setTextChatCollapsed(!textChatCollapsed)}
                />
              </div>
            </div>
            {/* Стрелочка вниз сбоку от чата */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full ml-2 text-white/40 pointer-events-none">
              <ArrowDownIcon size={16} />
            </div>
          </div>

          {/* ВидеоЧат */}
          <div className="flex-shrink-0 bg-slate-800/40 backdrop-blur-md border-2 border-white/20 rounded-lg overflow-hidden" style={{ minHeight: '375px', maxHeight: '525px' }}>
            <div className="flex flex-col h-full">
              {/* Участники внутри видеоЧата */}
              <div className="flex-shrink-0 px-3 pt-2 pb-1">
                <CompactParticipants 
                  roomId={room.id} 
                  currentUserId={tempUserId} 
                  isCreator={isCreator}
                  maxInvites={10}
                />
              </div>
              {/* Окно видеоЧата */}
              <div className="flex-1 min-h-0 overflow-visible" style={{ zIndex: 5 }}>
                <VideoRoom 
                  roomId={room.id} 
                  currentUserId={tempUserId} 
                  hideHeader={true}
                />
              </div>
            </div>
          </div>

          {/* Аккордеон для создателя */}
          {isCreator ? (
            <div className="flex-shrink-0 flex flex-col gap-3">
              {/* Пригласить друзей */}
              <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg overflow-hidden">
                <button
                  onClick={() => setInviteExpanded(!inviteExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <span className="text-white font-bold text-sm">{t('inviteFriends')}</span>
                  <span className="text-white/50 text-xs">{inviteExpanded ? '▼' : '▶'}</span>
                </button>
                {inviteExpanded && (
                  <div className="px-4 pb-4">
                    <InviteLink inviteCode={room.invite_code} roomId={room.id} roomName={room.name} />
                  </div>
                )}
              </div>

              {/* Программа мероприятия - будет в следующей версии */}
              <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg overflow-hidden opacity-60">
                <div className="w-full flex items-center justify-between px-4 py-3 cursor-not-allowed">
                  <span className="text-white/70 font-bold text-sm">{t('eventProgram') || 'Программа мероприятия'}</span>
                  <span className="text-white/30 text-xs">🔒</span>
                </div>
                <div className="px-4 pb-4 text-white/50 text-xs text-center">
                  {t('comingInNextVersion')}
                </div>
                {/* Закомментировано для следующей версии
                <button
                  onClick={() => setProgramExpanded(!programExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <span className="text-white font-bold text-sm">{t('eventProgram') || 'Программа мероприятия'}</span>
                  <span className="text-white/50 text-xs">{programExpanded ? '▼' : '▶'}</span>
                </button>
                {programExpanded && (
                  <div className="px-4 pb-4">
                    <EventProgramSelector
                      currentProgram={room.event_program || 'chat'}
                      onProgramChange={handleProgramChange}
                      isCreator={true}
                    />
                  </div>
                )}
                */}
              </div>
            </div>
          ) : (
            /* Новогодняя картинка для не-создателя */
            <div className="flex-shrink-0 w-full h-32 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-purple-600/30 backdrop-blur-md border-2 border-white/20 rounded-lg flex items-center justify-center overflow-hidden">
              <div className="text-white/80 text-sm text-center px-4">
                {t('newYearGreeting') || '🎄 С Новым годом! 🎄'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

