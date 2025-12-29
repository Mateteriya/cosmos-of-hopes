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
  const [selectedMember, setSelectedMember] = useState<RoomMember | null>(null);

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

  // Получаем инициалы из user_id (1-2 буквы)
  const getInitials = (userId: string): string => {
    // Берём последние 2 символа и делаем их заглавными, но если это цифры - берём первые буквы
    const lastChars = userId.slice(-2).toUpperCase();
    // Если последние символы - цифры, берём первые буквы из user_id
    if (/^\d+$/.test(lastChars)) {
      const letters = userId.match(/[a-zA-Z]/g);
      if (letters && letters.length > 0) {
        return letters.slice(0, 2).join('').toUpperCase();
      }
      // Если нет букв, берём первые 2 символа
      return userId.slice(0, 2).toUpperCase();
    }
    return lastChars;
  };

  // Получаем полное имя для отображения
  const getMemberName = (member: RoomMember): string => {
    if (member.user_id === currentUserId) {
      return 'Вы';
    }
    return `Участник ${member.user_id.slice(-4)}`;
  };

  // Вычисляем размер кружков в зависимости от количества участников
  const getAvatarSize = (count: number): string => {
    if (count <= 5) return 'w-10 h-10 sm:w-12 sm:h-12 text-xs sm:text-sm';
    if (count <= 10) return 'w-9 h-9 sm:w-10 sm:h-10 text-[10px] sm:text-xs';
    if (count <= 20) return 'w-8 h-8 sm:w-9 sm:h-9 text-[9px] sm:text-[10px]';
    if (count <= 30) return 'w-7 h-7 sm:w-8 sm:h-8 text-[8px] sm:text-[9px]';
    return 'w-6 h-6 sm:w-7 sm:h-7 text-[7px] sm:text-[8px]';
  };

  const getIndicatorSize = (count: number): string => {
    if (count <= 5) return 'w-3 h-3 sm:w-3.5 sm:h-3.5';
    if (count <= 10) return 'w-2.5 h-2.5 sm:w-3 sm:h-3';
    if (count <= 20) return 'w-2 h-2 sm:w-2.5 sm:h-2.5';
    return 'w-1.5 h-1.5 sm:w-2 sm:h-2';
  };

  const avatarSize = getAvatarSize(members.length);
  const indicatorSize = getIndicatorSize(members.length);

  // Вычисляем примерное количество участников в одном ряду (зависит от размера кружков)
  const getMembersPerRow = (count: number): number => {
    // Примерная ширина контейнера ~300px, учитывая gap
    if (count <= 5) return 5; // w-10/12 = ~48px + gap
    if (count <= 10) return 6; // w-9/10 = ~40px + gap
    if (count <= 20) return 7; // w-8/9 = ~36px + gap
    if (count <= 30) return 8; // w-7/8 = ~32px + gap
    return 9; // w-6/7 = ~28px + gap
  };

  const membersPerRow = getMembersPerRow(members.length);

  // Определяем, в каком ряду находится участник
  const getMemberRow = (index: number): number => {
    return Math.floor(index / membersPerRow) + 1;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg p-2 sm:p-3 lg:p-4 relative">
      <div className="text-white font-bold text-xs sm:text-sm mb-2 flex items-center justify-between">
        <span>👥 Участники ({members.length})</span>
      </div>

      {isLoading ? (
        <div className="text-white/50 text-xs sm:text-sm text-center py-3 sm:py-4">Загрузка...</div>
      ) : members.length === 0 ? (
        <div className="text-white/50 text-xs sm:text-sm text-center py-3 sm:py-4">Пока нет участников</div>
      ) : (
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {members.map((member, index) => {
            const isCurrentUser = member.user_id === currentUserId;
            const memberRow = getMemberRow(index);
            // Первый и второй ряды - вбок налево, третий и ниже - вверх
            const openToLeft = memberRow <= 2;
            
            return (
              <div key={member.id} className="relative">
                {/* Кружок с инициалами */}
                <button
                  onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
                  className={`relative ${avatarSize} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 transition-all hover:scale-110 ${
                    getAvatarColor(member.user_id)
                  } ${isCurrentUser ? 'ring-2 ring-blue-400' : ''} ${
                    selectedMember?.id === member.id ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  title={`${getMemberName(member)} | Присоединился ${new Date(member.joined_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`}
                >
                  {getInitials(member.user_id)}
                  {/* Индикатор онлайн */}
                  <div className={`absolute -bottom-0.5 -right-0.5 ${indicatorSize} rounded-full bg-green-500 border-2 border-slate-800`} title="Онлайн" />
                </button>

                {/* Выпадающая информация о участнике */}
                {selectedMember?.id === member.id && (
                  <div className={`absolute right-full mr-2 ${openToLeft ? 'top-0' : 'bottom-0'} z-[9999] bg-slate-800/95 backdrop-blur-md border-2 border-white/20 rounded-lg p-3 shadow-lg min-w-[280px] max-w-[320px]`}>
                    <div className="text-white font-bold text-xs sm:text-sm mb-1.5">
                      {getMemberName(member)}
                      {isCurrentUser && <span className="ml-2 text-blue-400">(Вы)</span>}
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-[10px] sm:text-xs whitespace-nowrap">
                      <span className="flex-shrink-0">
                        Присоединился{' '}
                        {new Date(member.joined_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Онлайн</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Закрытие выпадающего меню при клике вне его */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
