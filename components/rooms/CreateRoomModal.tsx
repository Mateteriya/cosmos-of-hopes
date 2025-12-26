'use client';

/**
 * Модальное окно создания комнаты
 */

import { useState } from 'react';
import type { Room } from '@/types/room';
import { createRoom } from '@/lib/rooms';
import { useLanguage } from '@/components/constructor/LanguageProvider';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (room: Room) => void;
  currentUserId: string;
}

const TIMEZONES = [
  { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
  { value: 'Europe/Kiev', label: 'Киев (UTC+2)' },
  { value: 'Europe/Minsk', label: 'Минск (UTC+3)' },
  { value: 'Asia/Almaty', label: 'Алматы (UTC+6)' },
  { value: 'Asia/Tashkent', label: 'Ташкент (UTC+5)' },
  { value: 'Europe/London', label: 'Лондон (UTC+0)' },
  { value: 'America/New_York', label: 'Нью-Йорк (UTC-5)' },
  { value: 'America/Los_Angeles', label: 'Лос-Анджелес (UTC-8)' },
  { value: 'Asia/Tokyo', label: 'Токио (UTC+9)' },
  { value: 'Asia/Shanghai', label: 'Шанхай (UTC+8)' },
];

export default function CreateRoomModal({
  isOpen,
  onClose,
  onCreate,
  currentUserId,
}: CreateRoomModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('Europe/Moscow');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError(t('roomNameRequired'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Убираем таймаут полностью - пусть создается сколько нужно
      const room = await createRoom(currentUserId, name.trim(), timezone);
      onCreate(room);
      setName('');
      setTimezone('Europe/Moscow');
      onClose();
    } catch (err: any) {
      console.error('Ошибка создания комнаты:', err);
      setError(err.message || t('roomCreationError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-white/30 rounded-xl p-4 sm:p-6 max-w-md w-full shadow-2xl">
        <h2 className="text-white font-bold text-xl sm:text-2xl mb-3 sm:mb-4">{t('createRoom')}</h2>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-white/80 text-xs sm:text-sm mb-1.5 sm:mb-2">
              {t('roomName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('roomNameExample')}
              className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 sm:px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 text-sm sm:text-base"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-white/80 text-xs sm:text-sm mb-1.5 sm:mb-2">
              {t('selectTimezone')}
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 sm:px-4 py-2 text-white focus:outline-none focus:border-purple-500 text-sm sm:text-base"
              disabled={isLoading}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
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
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-3 sm:px-4 py-2 rounded-lg transition-all disabled:opacity-50 text-sm sm:text-base"
            >
              {isLoading ? t('creating') : t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
