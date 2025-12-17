'use client';

/**
 * Модальное окно присоединения к комнате по invite code
 */

import { useState } from 'react';
import type { Room } from '@/types/room';
import { joinRoomByInviteCode } from '@/lib/rooms';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (room: Room) => void;
  currentUserId: string;
}

export default function JoinRoomModal({
  isOpen,
  onClose,
  onJoin,
  currentUserId,
}: JoinRoomModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      setError('Введите код приглашения');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const room = await joinRoomByInviteCode(inviteCode.trim().toUpperCase(), currentUserId);
      onJoin(room);
      setInviteCode('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка присоединения к комнате');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-white/30 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-white font-bold text-2xl mb-4">Присоединиться к комнате</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm mb-2">
              Код приглашения
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                setError(null);
              }}
              placeholder="Введите 6-значный код"
              maxLength={6}
              className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-4 py-2 text-white text-center text-2xl font-mono font-bold tracking-widest placeholder-white/40 focus:outline-none focus:border-purple-500"
              disabled={isLoading}
            />
            <p className="text-white/60 text-xs mt-2 text-center">
              Введите код, который вам дал создатель комнаты
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading || inviteCode.length !== 6}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
            >
              {isLoading ? 'Присоединение...' : 'Присоединиться'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
