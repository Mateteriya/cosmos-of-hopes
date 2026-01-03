'use client';

/**
 * Компонент для присоединения к комнате по коду
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinRoomByInviteCode } from '@/lib/rooms';
import { useLanguage } from '@/components/constructor/LanguageProvider';

interface JoinRoomByCodeProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onJoined?: () => void;
}

export default function JoinRoomByCode({
  isOpen,
  onClose,
  currentUserId,
  onJoined,
}: JoinRoomByCodeProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setError(t('inviteCodeRequired'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const room = await joinRoomByInviteCode(code.trim().toUpperCase(), currentUserId);
      setCode('');
      onClose();
      
      // Переходим в комнату
      router.push(`/room?room=${room.id}`);
      
      // Вызываем callback, если передан
      if (onJoined) {
        onJoined();
      }
    } catch (err: any) {
      console.error('Ошибка присоединения к комнате:', err);
      setError(err.message || t('joinRoomError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div
        className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-white/30 rounded-2xl w-[95vw] sm:w-full sm:max-w-md shadow-2xl max-h-[90vh] sm:max-h-none overflow-y-auto backdrop-blur-xl"
        style={{
          position: 'absolute',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          margin: 0,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Заголовок */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-white/10">
          <h2 className="text-white font-bold text-xl sm:text-2xl tracking-tight" style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '-0.02em'
          }}>
            {t('joinRoomByCode')}
          </h2>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
          <div>
            <label className="block text-white/90 text-sm sm:text-base font-semibold mb-2 sm:mb-2.5 px-1" style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.01em'
            }}>
              {t('enterInviteCode')}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                // Автоматически переводим в верхний регистр и ограничиваем 6 символами
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                setCode(value);
                setError(null);
              }}
              placeholder={t('inviteCodePlaceholder')}
              className="w-full bg-slate-700/60 border-2 border-white/20 rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 text-white placeholder-white/50 focus:outline-none focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/30 text-base sm:text-base transition-all shadow-inner font-mono text-center text-xl font-bold tracking-wider"
              style={{
                fontFamily: 'system-ui, -apple-system, monospace',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
                letterSpacing: '0.2em',
              }}
              disabled={isLoading}
              maxLength={6}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border-2 border-red-500/50 rounded-xl px-4 py-3 text-red-200 text-sm font-medium" style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)',
            }}>
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 pt-2 sm:pt-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 bg-slate-700/60 hover:bg-slate-700/80 text-white font-semibold px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl transition-all disabled:opacity-50 text-base sm:text-base touch-manipulation min-h-[48px] sm:min-h-0 border-2 border-white/10 hover:border-white/20 shadow-lg"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl transition-all disabled:opacity-50 text-base sm:text-base touch-manipulation min-h-[48px] sm:min-h-0 border-2 border-white/20 shadow-lg hover:shadow-xl"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              }}
            >
              {isLoading ? t('joining') : t('joinRoom')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

