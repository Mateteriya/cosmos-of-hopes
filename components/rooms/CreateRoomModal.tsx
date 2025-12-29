'use client';

/**
 * Модальное окно создания комнаты
 */

import { useState } from 'react';
import type { Room } from '@/types/room';
import { createRoom } from '@/lib/rooms';
import { useLanguage } from '@/components/constructor/LanguageProvider';
import NotificationPrompt from '@/components/notifications/NotificationPrompt';

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
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  
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
      
      // Показываем запрос уведомлений после создания комнаты
      const hasSeenNotificationPrompt = localStorage.getItem('has_seen_notification_prompt_after_room');
      if (!hasSeenNotificationPrompt) {
        setShowNotificationPrompt(true);
        localStorage.setItem('has_seen_notification_prompt_after_room', 'shown');
      } else {
        onClose();
      }
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
      
      {/* Запрос уведомлений после создания комнаты */}
      {showNotificationPrompt && (
        <NotificationPrompt
          title="Включить уведомления?"
          message="Получайте напоминания о запуске вашей комнаты и важных событиях!"
          onClose={() => {
            setShowNotificationPrompt(false);
            onClose();
          }}
          showCloseButton={true}
        />
      )}
    </div>
  );
}
