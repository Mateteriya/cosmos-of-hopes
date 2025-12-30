'use client';

/**
 * Компактный компонент участников для встраивания в чат/видеоЧат
 */

import { useState, useEffect } from 'react';
import { getRoomMembers } from '@/lib/rooms';
import { useLanguage } from '@/components/constructor/LanguageProvider';
import { ParticipantsIcon, ParticipantsListIcon } from '@/components/icons/RoomIcons';
import type { RoomMember } from '@/types/room';

interface CompactParticipantsProps {
  roomId: string;
  currentUserId: string;
  isCreator?: boolean;
  maxInvites?: number;
}

export default function CompactParticipants({ 
  roomId, 
  currentUserId, 
  isCreator = false,
  maxInvites = 10 
}: CompactParticipantsProps) {
  const { t } = useLanguage();
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadMembers();
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
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (userId: string): string => {
    const lastChars = userId.slice(-2).toUpperCase();
    if (/^\d+$/.test(lastChars)) {
      const letters = userId.match(/[a-zA-Z]/g);
      if (letters && letters.length > 0) {
        return letters.slice(0, 2).join('').toUpperCase();
      }
      return userId.slice(0, 2).toUpperCase();
    }
    return lastChars;
  };

  const getMemberName = (member: RoomMember): string => {
    if (member.user_id === currentUserId) {
      return t('you');
    }
    return `${t('participant')} ${member.user_id.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-white/50 text-xs">
        <div className="animate-spin w-3 h-3 border border-white/30 border-t-white rounded-full"></div>
        {t('loading')}
      </div>
    );
  }

  const displayCount = isCreator ? `${members.length}/${maxInvites}` : `${members.length}`;

  return (
    <div className="border-b border-white/10 pb-2 mb-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-white/5 rounded transition-colors"
      >
        <div className="flex items-center gap-2">
          <ParticipantsListIcon size={16} className="text-white/70" />
          <span className="text-white/90 text-xs font-semibold">
            {displayCount}
          </span>
        </div>
        <span className="text-white/50 text-xs">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {isExpanded && (
        <div className="flex flex-wrap gap-1.5 px-2 pt-2">
          {members.map((member) => {
            const isCurrentUser = member.user_id === currentUserId;
            return (
              <div
                key={member.id}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 ${
                  getAvatarColor(member.user_id)
                } ${isCurrentUser ? 'ring-2 ring-blue-400' : ''}`}
                title={getMemberName(member)}
              >
                {getInitials(member.user_id)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

