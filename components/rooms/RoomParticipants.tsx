'use client';

/**
 * Компонент отображения участников комнаты
 */

import { useState, useEffect } from 'react';
import { getRoomMembers } from '@/lib/rooms';
import type { RoomMember } from '@/types/room';

interface RoomParticipantsProps {
  roomId: string;
  currentUserId: string;
}

export default function RoomParticipants({ roomId, currentUserId }: RoomParticipantsProps) {
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMembers();
    // Обновляем список участников каждые 5 секунд
    const interval = setInterval(loadMembers, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  const loadMembers = async () => {
    try {
      const loadedMembers = await getRoomMembers(roomId);
      setMembers(loadedMembers);
    } catch (err) {
      console.error('Ошибка загрузки участников:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Генерируем цвет аватара на основе user_id
  const getAvatarColor = (userId: string): string => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
      'bg-gradient-to-br from-green-500 to-green-600',
      'bg-gradient-to-br from-yellow-500 to-yellow-600',
      'bg-gradient-to-br from-red-500 to-red-600',
      'bg-gradient-to-br from-indigo-500 to-indigo-600',
      'bg-gradient-to-br from-teal-500 to-teal-600',
    ];
    // Простой хэш для выбора цвета
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Получаем инициалы из user_id
  const getInitials = (userId: string): string => {
    // Берём последние 2 символа и делаем их заглавными
    const lastChars = userId.slice(-2).toUpperCase();
    return lastChars;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg p-2 sm:p-3 lg:p-4">
      <div className="text-white font-bold text-xs sm:text-sm mb-1.5 sm:mb-2 lg:mb-3 flex items-center justify-between">
        <span>👥 Участники ({members.length})</span>
      </div>

      {isLoading ? (
        <div className="text-white/50 text-xs sm:text-sm text-center py-3 sm:py-4">Загрузка...</div>
      ) : members.length === 0 ? (
        <div className="text-white/50 text-xs sm:text-sm text-center py-3 sm:py-4">Пока нет участников</div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {members.map((member) => {
            const isCurrentUser = member.user_id === currentUserId;
            return (
              <div
                key={member.id}
                className={`flex items-center gap-1.5 sm:gap-2 lg:gap-3 p-1.5 sm:p-2 rounded-lg min-w-0 ${
                  isCurrentUser ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-slate-700/30'
                }`}
              >
                {/* Аватар */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-white font-bold text-[10px] sm:text-xs lg:text-sm flex-shrink-0 ${getAvatarColor(
                    member.user_id
                  )}`}
                  title={isCurrentUser ? 'Это вы' : `Участник ${member.user_id.slice(-6)}`}
                >
                  {getInitials(member.user_id)}
                </div>

                {/* Информация */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="text-white text-[10px] sm:text-xs lg:text-sm font-semibold truncate">
                    {isCurrentUser ? 'Вы' : `Участник ${member.user_id.slice(-4)}`}
                  </div>
                  <div className="text-white/50 text-[9px] sm:text-[10px] lg:text-xs truncate">
                    Присоединился{' '}
                    {new Date(member.joined_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* Индикатор онлайн (простой) */}
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 flex-shrink-0" title="Онлайн" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
