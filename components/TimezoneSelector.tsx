'use client';

/**
 * Компонент для выбора часового пояса пользователя
 */

import { useState, useEffect } from 'react';
import { getUserTimezone, saveUserTimezone, getBrowserTimezone, calculateNewYearMidnight, type UserTimezone } from '@/lib/timezone';

interface TimezoneSelectorProps {
  onTimezoneSet: (timezone: UserTimezone) => void;
  skipButton?: boolean; // Если true, показываем кнопку "Пропустить"
}

// Популярные часовые пояса
const POPULAR_TIMEZONES = [
  { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
  { value: 'Europe/Kiev', label: 'Киев (UTC+2)' },
  { value: 'Asia/Almaty', label: 'Алматы (UTC+6)' },
  { value: 'Asia/Tashkent', label: 'Ташкент (UTC+5)' },
  { value: 'Europe/Minsk', label: 'Минск (UTC+3)' },
  { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
  { value: 'Asia/Novosibirsk', label: 'Новосибирск (UTC+7)' },
  { value: 'Europe/London', label: 'Лондон (UTC+0)' },
  { value: 'Europe/Berlin', label: 'Берлин (UTC+1)' },
  { value: 'America/New_York', label: 'Нью-Йорк (UTC-5)' },
  { value: 'America/Los_Angeles', label: 'Лос-Анджелес (UTC-8)' },
  { value: 'Asia/Shanghai', label: 'Пекин (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Токио (UTC+9)' },
];

export default function TimezoneSelector({ onTimezoneSet, skipButton = false }: TimezoneSelectorProps) {
  const [selectedTimezone, setSelectedTimezone] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [userTz, setUserTz] = useState<UserTimezone | null>(null);

  useEffect(() => {
    // Проверяем, есть ли уже сохраненный часовой пояс
    const saved = getUserTimezone();
    if (saved.timezone) {
      setUserTz(saved);
      setSelectedTimezone(saved.timezone);
      // Если уже есть сохраненный, сразу вызываем callback
      onTimezoneSet(saved);
      setIsOpen(false);
    } else {
      // Определяем автоматически
      const browserTz = getBrowserTimezone();
      setSelectedTimezone(browserTz);
      setIsOpen(true);
    }
  }, [onTimezoneSet]);

  const handleConfirm = () => {
    if (selectedTimezone) {
      const tz = saveUserTimezone(selectedTimezone);
      setUserTz(tz);
      onTimezoneSet(tz);
      setIsOpen(false);
    }
  };

  const handleSkip = () => {
    // Используем часовой пояс браузера по умолчанию
    const browserTz = getBrowserTimezone();
    const tz = saveUserTimezone(browserTz);
    setUserTz(tz);
    onTimezoneSet(tz);
    setIsOpen(false);
  };

  // Если часовой пояс уже установлен, не показываем селектор
  if (userTz && !isOpen) {
    return null;
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900 to-slate-900 border-2 border-white/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🌍</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Укажите ваш часовой пояс
          </h2>
          <p className="text-white/70 text-sm">
            Это нужно, чтобы показать анимацию Нового года вовремя! ⏰
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-white/80 text-sm mb-2">
            Часовой пояс:
          </label>
          <select
            value={selectedTimezone}
            onChange={(e) => setSelectedTimezone(e.target.value)}
            className="w-full bg-slate-800/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="">Выберите часовой пояс...</option>
            <optgroup label="Автоматическое определение">
              <option value={getBrowserTimezone()}>
                Авто ({getBrowserTimezone()})
              </option>
            </optgroup>
            <optgroup label="Популярные часовые пояса">
              {POPULAR_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="flex gap-3">
          {skipButton && (
            <button
              onClick={handleSkip}
              className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-white font-bold px-4 py-3 rounded-lg transition-all"
            >
              Пропустить
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={!selectedTimezone}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold px-4 py-3 rounded-lg transition-all"
          >
            Подтвердить
          </button>
        </div>

        {selectedTimezone && (
          <div className="mt-4 text-center text-white/60 text-xs">
            Новый год наступит: {new Date(calculateNewYearMidnight(selectedTimezone)).toLocaleString('ru-RU', {
              timeZone: selectedTimezone,
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  );
}

