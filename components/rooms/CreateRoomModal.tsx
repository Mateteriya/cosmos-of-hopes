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

// Расширенный список часовых поясов с переводами
const getTimezones = (language: 'ru' | 'en') => {
  const tz = {
    ru: {
      'Europe/Moscow': 'Москва (UTC+3)',
      'Europe/Kiev': 'Киев (UTC+2)',
      'Europe/Minsk': 'Минск (UTC+3)',
      'Europe/Kaliningrad': 'Калининград (UTC+2)',
      'Europe/Samara': 'Самара (UTC+4)',
      'Asia/Yekaterinburg': 'Екатеринбург (UTC+5)',
      'Asia/Omsk': 'Омск (UTC+6)',
      'Asia/Krasnoyarsk': 'Красноярск (UTC+7)',
      'Asia/Irkutsk': 'Иркутск (UTC+8)',
      'Asia/Yakutsk': 'Якутск (UTC+9)',
      'Asia/Vladivostok': 'Владивосток (UTC+10)',
      'Asia/Magadan': 'Магадан (UTC+11)',
      'Asia/Kamchatka': 'Камчатка (UTC+12)',
      'Asia/Almaty': 'Алматы (UTC+6)',
      'Asia/Tashkent': 'Ташкент (UTC+5)',
      'Asia/Baku': 'Баку (UTC+4)',
      'Asia/Tbilisi': 'Тбилиси (UTC+4)',
      'Asia/Yerevan': 'Ереван (UTC+4)',
      'Europe/London': 'Лондон (UTC+0)',
      'Europe/Paris': 'Париж (UTC+1)',
      'Europe/Berlin': 'Берлин (UTC+1)',
      'Europe/Rome': 'Рим (UTC+1)',
      'Europe/Madrid': 'Мадрид (UTC+1)',
      'Europe/Athens': 'Афины (UTC+2)',
      'Europe/Istanbul': 'Стамбул (UTC+3)',
      'America/New_York': 'Нью-Йорк (UTC-5)',
      'America/Chicago': 'Чикаго (UTC-6)',
      'America/Denver': 'Денвер (UTC-7)',
      'America/Los_Angeles': 'Лос-Анджелес (UTC-8)',
      'America/Toronto': 'Торонто (UTC-5)',
      'America/Mexico_City': 'Мехико (UTC-6)',
      'America/Sao_Paulo': 'Сан-Паулу (UTC-3)',
      'America/Buenos_Aires': 'Буэнос-Айрес (UTC-3)',
      'Asia/Dubai': 'Дубай (UTC+4)',
      'Asia/Riyadh': 'Эр-Рияд (UTC+3)',
      'Asia/Tehran': 'Тегеран (UTC+3:30)',
      'Asia/Karachi': 'Карачи (UTC+5)',
      'Asia/Dhaka': 'Дакка (UTC+6)',
      'Asia/Bangkok': 'Бангкок (UTC+7)',
      'Asia/Singapore': 'Сингапур (UTC+8)',
      'Asia/Hong_Kong': 'Гонконг (UTC+8)',
      'Asia/Shanghai': 'Шанхай (UTC+8)',
      'Asia/Seoul': 'Сеул (UTC+9)',
      'Asia/Tokyo': 'Токио (UTC+9)',
      'Australia/Sydney': 'Сидней (UTC+10)',
      'Australia/Melbourne': 'Мельбурн (UTC+10)',
      'Pacific/Auckland': 'Окленд (UTC+12)',
    },
    en: {
      'Europe/Moscow': 'Moscow (UTC+3)',
      'Europe/Kiev': 'Kiev (UTC+2)',
      'Europe/Minsk': 'Minsk (UTC+3)',
      'Europe/Kaliningrad': 'Kaliningrad (UTC+2)',
      'Europe/Samara': 'Samara (UTC+4)',
      'Asia/Yekaterinburg': 'Yekaterinburg (UTC+5)',
      'Asia/Omsk': 'Omsk (UTC+6)',
      'Asia/Krasnoyarsk': 'Krasnoyarsk (UTC+7)',
      'Asia/Irkutsk': 'Irkutsk (UTC+8)',
      'Asia/Yakutsk': 'Yakutsk (UTC+9)',
      'Asia/Vladivostok': 'Vladivostok (UTC+10)',
      'Asia/Magadan': 'Magadan (UTC+11)',
      'Asia/Kamchatka': 'Kamchatka (UTC+12)',
      'Asia/Almaty': 'Almaty (UTC+6)',
      'Asia/Tashkent': 'Tashkent (UTC+5)',
      'Asia/Baku': 'Baku (UTC+4)',
      'Asia/Tbilisi': 'Tbilisi (UTC+4)',
      'Asia/Yerevan': 'Yerevan (UTC+4)',
      'Europe/London': 'London (UTC+0)',
      'Europe/Paris': 'Paris (UTC+1)',
      'Europe/Berlin': 'Berlin (UTC+1)',
      'Europe/Rome': 'Rome (UTC+1)',
      'Europe/Madrid': 'Madrid (UTC+1)',
      'Europe/Athens': 'Athens (UTC+2)',
      'Europe/Istanbul': 'Istanbul (UTC+3)',
      'America/New_York': 'New York (UTC-5)',
      'America/Chicago': 'Chicago (UTC-6)',
      'America/Denver': 'Denver (UTC-7)',
      'America/Los_Angeles': 'Los Angeles (UTC-8)',
      'America/Toronto': 'Toronto (UTC-5)',
      'America/Mexico_City': 'Mexico City (UTC-6)',
      'America/Sao_Paulo': 'Sao Paulo (UTC-3)',
      'America/Buenos_Aires': 'Buenos Aires (UTC-3)',
      'Asia/Dubai': 'Dubai (UTC+4)',
      'Asia/Riyadh': 'Riyadh (UTC+3)',
      'Asia/Tehran': 'Tehran (UTC+3:30)',
      'Asia/Karachi': 'Karachi (UTC+5)',
      'Asia/Dhaka': 'Dhaka (UTC+6)',
      'Asia/Bangkok': 'Bangkok (UTC+7)',
      'Asia/Singapore': 'Singapore (UTC+8)',
      'Asia/Hong_Kong': 'Hong Kong (UTC+8)',
      'Asia/Shanghai': 'Shanghai (UTC+8)',
      'Asia/Seoul': 'Seoul (UTC+9)',
      'Asia/Tokyo': 'Tokyo (UTC+9)',
      'Australia/Sydney': 'Sydney (UTC+10)',
      'Australia/Melbourne': 'Melbourne (UTC+10)',
      'Pacific/Auckland': 'Auckland (UTC+12)',
    },
  };
  
  return Object.entries(tz[language]).map(([value, label]) => ({
    value,
    label,
  }));
};

export default function CreateRoomModal({
  isOpen,
  onClose,
  onCreate,
  currentUserId,
}: CreateRoomModalProps) {
  const { t, language } = useLanguage();
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('Europe/Moscow');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const TIMEZONES = getTimezones(language);

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
      
      // Закрываем модалку сразу после создания комнаты
      onClose();
    } catch (err: any) {
      console.error('Ошибка создания комнаты:', err);
      setError(err.message || t('roomCreationError'));
    } finally {
      setIsLoading(false);
    }
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
        {/* Заголовок с улучшенной типографикой */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-white/10">
          <h2 className="text-white font-bold text-xl sm:text-2xl tracking-tight" style={{ 
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '-0.02em'
          }}>
            {t('createRoom')}
          </h2>
        </div>

        {/* Форма с улучшенными отступами */}
        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
          <div>
            <label className="block text-white/90 text-sm sm:text-base font-semibold mb-2 sm:mb-2.5 px-1" style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.01em'
            }}>
              {t('roomName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('roomNameExample')}
              className="w-full bg-slate-700/60 border-2 border-white/20 rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 text-white placeholder-white/50 focus:outline-none focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/30 text-base sm:text-base transition-all shadow-inner"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
              }}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-white/90 text-sm sm:text-base font-semibold mb-2 sm:mb-2.5 px-1" style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.01em'
            }}>
              {t('selectTimezone')}
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-slate-700/60 border-2 border-white/20 rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 text-white focus:outline-none focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/30 text-base sm:text-base transition-all shadow-inner appearance-none cursor-pointer"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                paddingRight: '2.5rem',
              }}
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
              onClick={onClose}
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
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl transition-all disabled:opacity-50 text-base sm:text-base touch-manipulation min-h-[48px] sm:min-h-0 border-2 border-white/20 shadow-lg hover:shadow-xl"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              }}
            >
              {isLoading ? t('creating') : t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
