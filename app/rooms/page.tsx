'use client';

/**
 * Страница управления комнатами
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RoomCard from '@/components/rooms/RoomCard';
import CreateRoomModal from '@/components/rooms/CreateRoomModal';
import JoinRoomByCode from '@/components/rooms/JoinRoomByCode';
import NotificationPrompt from '@/components/notifications/NotificationPrompt';
import { getUserRooms } from '@/lib/rooms';
import { useLanguage } from '@/components/constructor/LanguageProvider';
import type { Room } from '@/types/room';

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

export default function RoomsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [tempUserId] = useState<string>(() => getTempUserId());

  useEffect(() => {
    loadRooms();
  }, [tempUserId]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      // Убираем таймаут - пусть загружается сколько нужно
      const userRooms = await getUserRooms(tempUserId);
      setRooms(userRooms || []);
    } catch (err: any) {
      console.error('Ошибка загрузки комнат:', err);
      setError(err.message || 'Не удалось загрузить комнаты');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomCreated = async (room: Room) => {
    setRooms(prev => [...prev, room]);
    // Комната создана, но не переходим автоматически
    // Пользователь может сам выбрать когда войти в комнату
    
    // Показываем запрос уведомлений после создания комнаты
    const hasSeenNotificationPrompt = localStorage.getItem('has_seen_notification_prompt_after_room');
    if (!hasSeenNotificationPrompt) {
      setTimeout(() => {
        setShowNotificationPrompt(true);
        localStorage.setItem('has_seen_notification_prompt_after_room', 'shown');
      }, 300);
    }
  };


  const handleRoomDeleted = () => {
    loadRooms();
  };

  const handleRoomLeft = () => {
    loadRooms();
  };

  const handleRoomClick = (room: Room) => {
    // Переходим на страницу комнаты для совместного празднования
    router.push(`/room?room=${room.id}`);
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">{t('loadingRooms')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок и кнопки возврата */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-white text-4xl font-bold mb-2">{t('myRooms')}</h1>
            <p className="text-white/70">
              {t('createRoomDescription')}
            </p>
          </div>
          {/* Кнопки возврата в правом верхнем углу */}
          {/* ПК версия - горизонтально */}
          <div className="hidden md:flex gap-2 flex-shrink-0">
            <button
              onClick={() => router.push('/')}
              className="bg-slate-700/50 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg transition-all text-sm"
            >
              {t('backToHome')}
            </button>
          </div>
          {/* Мобильная версия - круглая кнопка с неоном */}
          <div className="md:hidden flex flex-col gap-3 flex-shrink-0">
            <button
              onClick={() => router.push('/')}
              className="w-12 h-12 bg-slate-800/60 hover:bg-slate-700/80 text-white font-semibold rounded-full transition-all text-xs whitespace-nowrap border-2 border-white/20 hover:border-cyan-400/80 shadow-lg hover:shadow-cyan-400/50 flex items-center justify-center touch-manipulation relative overflow-hidden group"
              style={{
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 211, 238, 0.6), 0 0 40px rgba(34, 211, 238, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
              }}
              title="На Главную"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Кнопки создания и присоединения */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-6 py-3 rounded-lg shadow-xl transition-all transform hover:scale-105"
          >
            ➕ {t('createRoom')}
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold px-6 py-3 rounded-lg shadow-xl transition-all transform hover:scale-105"
          >
            🔑 {t('joinRoomByCode')}
          </button>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 text-red-200 mb-6">
            {error}
          </div>
        )}

        {/* Список комнат */}
        {rooms.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-xl p-8 text-center">
            <p className="text-white/70 text-lg mb-4">
              {t('noRoomsYet') || 'У вас пока нет комнат'}
            </p>
            <p className="text-white/50 text-sm">
              {t('createRoomToStart') || 'Создайте комнату, чтобы начать'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map(room => (
              <RoomCard
                key={room.id}
                room={room}
                currentUserId={tempUserId}
                onRoomClick={handleRoomClick}
                onRoomDeleted={handleRoomDeleted}
                onRoomLeft={handleRoomLeft}
              />
            ))}
          </div>
        )}

      </div>

      {/* Модальные окна */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleRoomCreated}
        currentUserId={tempUserId}
      />
      <JoinRoomByCode
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        currentUserId={tempUserId}
        onJoined={loadRooms}
      />

      {/* Запрос уведомлений после создания комнаты */}
      {showNotificationPrompt && (
        <NotificationPrompt
          title="Включить уведомления?"
          message={t('enableNotificationsMessage')}
          onClose={() => setShowNotificationPrompt(false)}
          showCloseButton={true}
        />
      )}
    </div>
  );
}
