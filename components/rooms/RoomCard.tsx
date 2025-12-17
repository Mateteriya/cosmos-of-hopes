'use client';

/**
 * Карточка комнаты
 */

import { useState, useEffect } from 'react';
import type { Room } from '@/types/room';
import { getRoomMembers, leaveRoom, deleteRoom } from '@/lib/rooms';

interface RoomCardProps {
  room: Room;
  currentUserId: string;
  onRoomClick: (room: Room) => void;
  onRoomDeleted: () => void;
  onRoomLeft: () => void;
}

export default function RoomCard({
  room,
  currentUserId,
  onRoomClick,
  onRoomDeleted,
  onRoomLeft,
}: RoomCardProps) {
  const [membersCount, setMembersCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isCreator = room.creator_id === currentUserId;

  // Загружаем количество участников
  useEffect(() => {
    getRoomMembers(room.id)
      .then(members => setMembersCount(members.length))
      .catch(console.error);
  }, [room.id]);

  const handleLeave = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsLoading(true);
    try {
      await leaveRoom(room.id, currentUserId);
      onRoomLeft();
    } catch (error: any) {
      alert(error.message || 'Ошибка выхода из комнаты');
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    if (!confirm('Вы уверены, что хотите удалить комнату? Все игрушки в ней будут удалены.')) {
      setShowConfirm(false);
      return;
    }

    setIsLoading(true);
    try {
      await deleteRoom(room.id, currentUserId);
      onRoomDeleted();
    } catch (error: any) {
      alert(error.message || 'Ошибка удаления комнаты');
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(room.invite_code);
    alert(`Код приглашения ${room.invite_code} скопирован!`);
  };

  return (
    <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-md border-2 border-white/30 rounded-xl p-4 shadow-xl hover:shadow-2xl transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1" title={`Название комнаты: ${room.name}. Создана ${new Date(room.created_at).toLocaleString('ru-RU')}`}>
            {room.name}
          </h3>
          {isCreator && (
            <span 
              className="inline-block bg-yellow-500/30 text-yellow-200 text-xs px-2 py-1 rounded"
              title="Вы создали эту комнату. Только вы можете удалить её или изменить название"
            >
              👑 Создатель
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-white/80 text-sm" title="Код приглашения: поделитесь этим кодом с друзьями, чтобы они могли присоединиться к вашей комнате">
          <span className="mr-2" title="Код приглашения">🔑</span>
          <span className="font-mono font-bold">{room.invite_code}</span>
          <button
            onClick={handleCopyInviteCode}
            className="ml-2 text-purple-300 hover:text-purple-200 transition-colors"
            title="Скопировать код приглашения в буфер обмена"
          >
            📋
          </button>
        </div>
        
        {membersCount !== null && (
          <div className="flex items-center text-white/80 text-sm" title={`Количество участников комнаты: ${membersCount} ${membersCount === 1 ? 'человек' : 'человек'}`}>
            <span className="mr-2" title="Участники">👥</span>
            <span>{membersCount} {membersCount === 1 ? 'участник' : 'участников'}</span>
          </div>
        )}

        <div className="flex items-center text-white/80 text-sm" title={`Часовой пояс комнаты: ${room.timezone}. Полночь наступает в ${new Date(room.midnight_utc).toLocaleString('ru-RU', { timeZone: room.timezone, dateStyle: 'long', timeStyle: 'short' })}`}>
          <span className="mr-2" title="Часовой пояс">🌍</span>
          <span>{room.timezone}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onRoomClick(room)}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-4 py-2 rounded-lg transition-all transform hover:scale-105"
          title="Открыть комнату для совместного празднования Нового года"
        >
          Открыть комнату
        </button>
        
        {isCreator ? (
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600/80 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
            title="Удалить комнату. Внимание: все игрушки в этой комнате будут удалены!"
          >
            {showConfirm ? 'Подтвердить' : '🗑️'}
          </button>
        ) : (
          <button
            onClick={handleLeave}
            disabled={isLoading}
            className="bg-red-600/80 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
            title="Покинуть комнату. Вы больше не будете видеть эту комнату, но ваши игрушки останутся"
          >
            {showConfirm ? 'Подтвердить' : 'Выйти'}
          </button>
        )}
      </div>
    </div>
  );
}
