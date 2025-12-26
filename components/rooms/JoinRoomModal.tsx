'use client';

/**
 * Модальное окно присоединения к комнате по invite code
 */

import { useState } from 'react';
import type { Room } from '@/types/room';
import { joinRoomByInviteCode } from '@/lib/rooms';
import { useLanguage } from '@/components/constructor/LanguageProvider';

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
  const { t } = useLanguage();
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      setError(t('enterInviteCode'));
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
      setError(err.message || t('joinRoomError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-white/30 rounded-xl p-4 sm:p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-white font-bold text-xl sm:text-2xl mb-3 sm:mb-4">{t('joinRoomTitle')}</h2>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-white/80 text-xs sm:text-sm mb-1.5 sm:mb-2">
              {t('inviteCode')}
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                setError(null);
              }}
              placeholder={t('enterCodePlaceholder')}
              maxLength={6}
              className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 sm:px-4 py-2 text-white text-center text-xl sm:text-2xl font-mono font-bold tracking-widest placeholder-white/40 focus:outline-none focus:border-purple-500"
              disabled={isLoading}
            />
            <p className="text-white/60 text-[10px] sm:text-xs mt-1.5 sm:mt-2 text-center">
              {t('enterCodeHint')}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-3 sm:px-4 py-2 text-red-200 text-xs sm:text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-white font-bold px-3 sm:px-4 py-2 rounded-lg transition-all disabled:opacity-50 text-sm sm:text-base"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || inviteCode.length !== 6}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-3 sm:px-4 py-2 rounded-lg transition-all disabled:opacity-50 text-sm sm:text-base"
            >
              {isLoading ? t('joining') : t('join')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
