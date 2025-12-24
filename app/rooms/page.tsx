'use client';

/**
 * Страница управления комнатами
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RoomCard from '@/components/rooms/RoomCard';
import CreateRoomModal from '@/components/rooms/CreateRoomModal';
import JoinRoomModal from '@/components/rooms/JoinRoomModal';
import { getUserRooms, createRoom, joinRoomByInviteCode } from '@/lib/rooms';
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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [tempUserId] = useState<string>(() => getTempUserId());

  useEffect(() => {
    loadRooms();
  }, [tempUserId]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      // Увеличиваем таймаут для мобильных устройств
      const timeout = typeof window !== 'undefined' && window.innerWidth < 768 ? 30000 : 10000;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Превышено время ожидания загрузки')), timeout)
      );
      const userRooms = await Promise.race([
        getUserRooms(tempUserId),
        timeoutPromise
      ]) as any;
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
    // Небольшая задержка перед переходом, чтобы комната успела сохраниться в БД
    await new Promise(resolve => setTimeout(resolve, 500));
    // Сразу переходим на страницу комнаты после создания
    router.push(`/room?room=${room.id}`);
  };

  const handleRoomJoined = (room: Room) => {
    setRooms(prev => {
      // Проверяем, нет ли уже этой комнаты
      if (prev.find(r => r.id === room.id)) {
        return prev;
      }
      return [...prev, room];
    });
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
        <div className="text-white text-2xl font-bold">Загрузка комнат...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-white text-4xl font-bold mb-2">Мои комнаты</h1>
          <p className="text-white/70">
            Создайте комнату для семьи или друзей, чтобы вместе украшать ёлку
          </p>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-6 py-3 rounded-lg shadow-xl transition-all transform hover:scale-105"
          >
            ➕ Создать комнату
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold px-6 py-3 rounded-lg shadow-xl transition-all transform hover:scale-105"
          >
            🔗 Присоединиться по коду
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
              У вас пока нет комнат
            </p>
            <p className="text-white/50 text-sm">
              Создайте комнату или присоединитесь к существующей по коду приглашения
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

        {/* Кнопка возврата */}
        <div className="mt-6">
          <button
            onClick={() => router.push('/tree')}
            className="bg-slate-700/50 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-lg transition-all"
          >
            ← Вернуться к общей ёлке
          </button>
        </div>
      </div>

      {/* Модальные окна */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleRoomCreated}
        currentUserId={tempUserId}
      />

      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleRoomJoined}
        currentUserId={tempUserId}
      />
    </div>
  );
}
