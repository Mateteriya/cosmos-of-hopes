'use client';

/**
 * Карточка комнаты
 */

import { useState, useEffect } from 'react';
import type { Room } from '@/types/room';
import { getRoomMembers, leaveRoom, deleteRoom } from '@/lib/rooms';
import { useLanguage } from '@/components/constructor/LanguageProvider';

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
  const { t } = useLanguage();
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
      alert(error.message || t('leaveRoomError'));
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

    if (!confirm(t('confirmDeleteRoom'))) {
      setShowConfirm(false);
      return;
    }

    setIsLoading(true);
    try {
      await deleteRoom(room.id, currentUserId);
      onRoomDeleted();
    } catch (error: any) {
      alert(error.message || t('deleteRoomError'));
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(room.invite_code);
    alert(`${t('inviteCode')} ${room.invite_code} ${t('inviteCodeCopied').toLowerCase()}`);
  };

  return (
    <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-md border-2 border-white/30 rounded-xl p-3 sm:p-4 shadow-xl hover:shadow-2xl transition-all">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base sm:text-lg mb-1 truncate" title={`${t('roomName')}: ${room.name}. ${t('roomCreatedAt')} ${new Date(room.created_at).toLocaleString()}`}>
            {room.name}
          </h3>
          {isCreator && (
            <span 
              className="inline-block bg-yellow-500/30 text-yellow-200 text-xs px-2 py-1 rounded"
              title={t('youCreatedRoom')}
            >
              👑 {t('creator')}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-3 sm:mb-4">
        <div className="flex items-center text-white/80 text-xs sm:text-sm" title={t('shareInviteCodeHint')}>
          <span className="mr-1.5 sm:mr-2" title={t('inviteCode')}>🔑</span>
          <span className="font-mono font-bold text-xs sm:text-sm">{room.invite_code}</span>
          <button
            onClick={handleCopyInviteCode}
            className="ml-1.5 sm:ml-2 text-purple-300 hover:text-purple-200 transition-colors touch-manipulation p-1"
            title={t('copyInviteCodeTooltip')}
          >
            📋
          </button>
        </div>
        
        {membersCount !== null && (
          <div className="flex items-center text-white/80 text-xs sm:text-sm" title={`${t('participantsCountTooltip')}: ${membersCount} ${membersCount === 1 ? t('person') : t('people')}`}>
            <span className="mr-1.5 sm:mr-2" title={t('participants')}>👥</span>
            <span>{membersCount} {membersCount === 1 ? t('participantsCount') : t('participantsCountPlural')}</span>
          </div>
        )}

        <div className="flex items-center text-white/80 text-xs sm:text-sm" title={`Часовой пояс комнаты: ${room.timezone}. Полночь наступает в ${new Date(room.midnight_utc).toLocaleString('ru-RU', { timeZone: room.timezone, dateStyle: 'long', timeStyle: 'short' })}`}>
          <span className="mr-1.5 sm:mr-2" title="Часовой пояс">🌍</span>
          <span className="truncate">{room.timezone}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onRoomClick(room)}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-3 sm:px-4 py-2 rounded-lg transition-all transform hover:scale-105 text-xs sm:text-sm touch-manipulation"
          title={t('openRoomTooltip')}
        >
          {t('openRoom')}
        </button>
        
        {isCreator ? (
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600/80 hover:bg-red-700 text-white font-bold px-3 sm:px-4 py-2 rounded-lg transition-all disabled:opacity-50 text-xs sm:text-sm touch-manipulation"
            title={t('deleteRoomTooltip')}
          >
            {showConfirm ? t('confirm') : '🗑️'}
          </button>
        ) : (
          <button
            onClick={handleLeave}
            disabled={isLoading}
            className="bg-red-600/80 hover:bg-red-700 text-white font-bold px-3 sm:px-4 py-2 rounded-lg transition-all disabled:opacity-50 text-xs sm:text-sm touch-manipulation"
            title={t('leaveRoomTooltip')}
          >
            {showConfirm ? t('confirm') : t('exit')}
          </button>
        )}
      </div>
    </div>
  );
}
