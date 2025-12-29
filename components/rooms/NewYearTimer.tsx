'use client';

/**
 * Компонент таймера до Нового года с гибридной синхронизацией
 * Использует API для точного времени + локальный fallback
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/constructor/LanguageProvider';
import { translations } from '@/lib/i18n';

interface NewYearTimerProps {
  midnightUTC: string; // ISO timestamp полночи в UTC
  timezone: string; // Часовой пояс комнаты
}

// Функция для получения списка часовых поясов (из CreateRoomModal)
const getTimezones = (language: 'ru' | 'en') => {
  const tz = {
    ru: {
      'Europe/Moscow': 'Москва',
      'Europe/Kiev': 'Киев',
      'Europe/Minsk': 'Минск',
      'Europe/Kaliningrad': 'Калининград',
      'Europe/Samara': 'Самара',
      'Asia/Yekaterinburg': 'Екатеринбург',
      'Asia/Omsk': 'Омск',
      'Asia/Krasnoyarsk': 'Красноярск',
      'Asia/Irkutsk': 'Иркутск',
      'Asia/Yakutsk': 'Якутск',
      'Asia/Vladivostok': 'Владивосток',
      'Asia/Magadan': 'Магадан',
      'Asia/Kamchatka': 'Камчатка',
      'Asia/Almaty': 'Алматы',
      'Asia/Tashkent': 'Ташкент',
      'Asia/Baku': 'Баку',
      'Asia/Tbilisi': 'Тбилиси',
      'Asia/Yerevan': 'Ереван',
      'Europe/London': 'Лондон',
      'Europe/Paris': 'Париж',
      'Europe/Berlin': 'Берлин',
      'Europe/Rome': 'Рим',
      'Europe/Madrid': 'Мадрид',
      'Europe/Athens': 'Афины',
      'Europe/Istanbul': 'Стамбул',
      'America/New_York': 'Нью-Йорк',
      'America/Chicago': 'Чикаго',
      'America/Denver': 'Денвер',
      'America/Los_Angeles': 'Лос-Анджелес',
      'America/Toronto': 'Торонто',
      'America/Mexico_City': 'Мехико',
      'America/Sao_Paulo': 'Сан-Паулу',
      'America/Buenos_Aires': 'Буэнос-Айрес',
      'Asia/Dubai': 'Дубай',
      'Asia/Riyadh': 'Эр-Рияд',
      'Asia/Tehran': 'Тегеран',
      'Asia/Karachi': 'Карачи',
      'Asia/Dhaka': 'Дакка',
      'Asia/Bangkok': 'Бангкок',
      'Asia/Singapore': 'Сингапур',
      'Asia/Hong_Kong': 'Гонконг',
      'Asia/Shanghai': 'Шанхай',
      'Asia/Seoul': 'Сеул',
      'Asia/Tokyo': 'Токио',
      'Australia/Sydney': 'Сидней',
      'Australia/Melbourne': 'Мельбурн',
      'Pacific/Auckland': 'Окленд',
    },
    en: {
      'Europe/Moscow': 'Moscow',
      'Europe/Kiev': 'Kiev',
      'Europe/Minsk': 'Minsk',
      'Europe/Kaliningrad': 'Kaliningrad',
      'Europe/Samara': 'Samara',
      'Asia/Yekaterinburg': 'Yekaterinburg',
      'Asia/Omsk': 'Omsk',
      'Asia/Krasnoyarsk': 'Krasnoyarsk',
      'Asia/Irkutsk': 'Irkutsk',
      'Asia/Yakutsk': 'Yakutsk',
      'Asia/Vladivostok': 'Vladivostok',
      'Asia/Magadan': 'Magadan',
      'Asia/Kamchatka': 'Kamchatka',
      'Asia/Almaty': 'Almaty',
      'Asia/Tashkent': 'Tashkent',
      'Asia/Baku': 'Baku',
      'Asia/Tbilisi': 'Tbilisi',
      'Asia/Yerevan': 'Yerevan',
      'Europe/London': 'London',
      'Europe/Paris': 'Paris',
      'Europe/Berlin': 'Berlin',
      'Europe/Rome': 'Rome',
      'Europe/Madrid': 'Madrid',
      'Europe/Athens': 'Athens',
      'Europe/Istanbul': 'Istanbul',
      'America/New_York': 'New York',
      'America/Chicago': 'Chicago',
      'America/Denver': 'Denver',
      'America/Los_Angeles': 'Los Angeles',
      'America/Toronto': 'Toronto',
      'America/Mexico_City': 'Mexico City',
      'America/Sao_Paulo': 'Sao Paulo',
      'America/Buenos_Aires': 'Buenos Aires',
      'Asia/Dubai': 'Dubai',
      'Asia/Riyadh': 'Riyadh',
      'Asia/Tehran': 'Tehran',
      'Asia/Karachi': 'Karachi',
      'Asia/Dhaka': 'Dhaka',
      'Asia/Bangkok': 'Bangkok',
      'Asia/Singapore': 'Singapore',
      'Asia/Hong_Kong': 'Hong Kong',
      'Asia/Shanghai': 'Shanghai',
      'Asia/Seoul': 'Seoul',
      'Asia/Tokyo': 'Tokyo',
      'Australia/Sydney': 'Sydney',
      'Australia/Melbourne': 'Melbourne',
      'Pacific/Auckland': 'Auckland',
    },
  };
  
  return Object.entries(tz[language]).map(([value, label]) => ({ value, label }));
};

// Функция для вычисления полночи 1 января следующего года в указанном часовом поясе
function calculateMidnightUTCForTimezone(timezone: string): Date {
  const now = new Date();
  const nextYear = now.getFullYear() + 1;
  
  let candidateUTC = new Date(Date.UTC(nextYear, 0, 1, 0, 0, 0, 0));
  
  for (let i = 0; i < 10; i++) {
    const tzString = candidateUTC.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const [datePart, timePart] = tzString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    
    if (hour === '00' && minute === '00' && second === '00' && 
        month === '01' && day === '01' && year === String(nextYear)) {
      return candidateUTC;
    }
    
    const hourDiff = parseInt(hour);
    candidateUTC = new Date(candidateUTC.getTime() - hourDiff * 60 * 60 * 1000);
  }
  
  return candidateUTC;
}

export default function NewYearTimer({ midnightUTC, timezone: initialTimezone }: NewYearTimerProps) {
  const { language } = useLanguage();
  const t = (key: keyof typeof translations.ru) => translations[language]?.[key] || translations.ru[key];
  
  const [selectedTimezone, setSelectedTimezone] = useState<string>(initialTimezone);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // ОНЛАЙН СИНХРОНИЗАЦИЯ: каждые 5 минут проверяем точное время в интернете
  useEffect(() => {
    const syncWithInternet = async () => {
      try {
        setIsSyncing(true);
        const localTimeBefore = Date.now(); // Системное время устройства ДО запроса
        
        const response = await fetch('/api/time');
        
        const localTimeAfter = Date.now(); // Системное время устройства ПОСЛЕ запроса
        const localTimeAvg = (localTimeBefore + localTimeAfter) / 2; // Среднее время для компенсации задержки сети
        
        if (response.ok) {
          const data = await response.json();
          const internetTime = new Date(data.timestamp).getTime(); // Точное время из интернета
          
          // Вычисляем offset: разница между временем из интернета и системным временем устройства
          // Если internetTime > localTime, значит устройство отстает, offset положительный
          // Если internetTime < localTime, значит устройство спешит, offset отрицательный
          const offset = internetTime - localTimeAvg;
          
          // Отладочная информация
          console.log('Синхронизация времени:', {
            internetTime: new Date(internetTime).toISOString(),
            localTimeAvg: new Date(localTimeAvg).toISOString(),
            offset,
            offsetSeconds: offset / 1000,
          });
          
          setServerTimeOffset(offset);
        }
      } catch (error) {
        console.error('Ошибка синхронизации времени с интернетом:', error);
        // В онлайн приложении это не должно происходить, но на всякий случай оставляем offset = 0
        setServerTimeOffset(0);
      } finally {
        setIsSyncing(false);
      }
    };

    // Синхронизируем сразу при загрузке
    syncWithInternet();
    
    // Затем каждые 5 минут
    const syncInterval = setInterval(syncWithInternet, 5 * 60 * 1000);

    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      // ОНЛАЙН ПОДХОД:
      // 1. Используем системное время устройства (Date.now())
      // 2. Корректируем его на offset, полученный из интернета (serverTimeOffset)
      // 3. Каждые 5 минут синхронизируемся с интернетом для точности
      // 4. ВАЖНО: сравниваем время в нужном часовом поясе!
      
      const systemTime = Date.now(); // Системное время устройства (UTC timestamp)
      const correctedTime = systemTime + serverTimeOffset; // Время с коррекцией из интернета (UTC timestamp)
      
      // Вычисляем полночь для выбранного часового пояса
      const midnight = calculateMidnightUTCForTimezone(selectedTimezone);
      
      // ПРАВИЛЬНЫЙ ПОДХОД: вычисляем разницу напрямую в UTC
      // midnight - это полночь 1 января в выбранном timezone, но в UTC
      // correctedTime - это текущее время в UTC
      // Разница между ними - это правильное время до Нового года
      const diff = midnight.getTime() - correctedTime;
      
      // Отладочная информация (только при первой загрузке и периодически)
      if (typeof window !== 'undefined') {
        const now = Date.now();
        if (!(window as any).__timerDebugShown) {
          (window as any).__timerDebugShown = true;
          console.log('🔍 Таймер отладка (первая загрузка):', {
            midnightUTC,
            midnightTime: midnight.toISOString(),
            midnightInTZ: midnight.toLocaleString('ru-RU', { timeZone: selectedTimezone }),
            systemTime: new Date(systemTime).toISOString(),
            systemTimeInTZ: new Date(systemTime).toLocaleString('ru-RU', { timeZone: selectedTimezone }),
            serverTimeOffset,
            serverTimeOffsetSeconds: serverTimeOffset / 1000,
            correctedTime: new Date(correctedTime).toISOString(),
            correctedTimeInTZ: new Date(correctedTime).toLocaleString('ru-RU', { timeZone: selectedTimezone }),
            diff,
            diffHours: diff / (1000 * 60 * 60),
            selectedTimezone,
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          });
        }
      }

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [selectedTimezone, serverTimeOffset]);

  if (!timeLeft) {
    return (
      <div className="text-white text-center">
        <div className="text-sm font-bold flex items-center justify-center gap-2">
          <div className="animate-spin w-3 h-3 border border-white/30 border-t-white rounded-full"></div>
          {t('timerLoading')}
        </div>
      </div>
    );
  }

  const isNewYear = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  const timezones = getTimezones(language);
  const getTimezoneLabel = (tz: string) => {
    const found = timezones.find(t => t.value === tz);
    return found ? found.label : tz;
  };

  return (
    <div className="flex items-center gap-3 sm:gap-4 md:gap-0">
      {/* Заголовок справа от панельки (только на ПК) */}
      <div className="hidden md:block text-white/90 text-base md:text-3xl lg:text-4xl font-semibold tracking-wide whitespace-nowrap bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-purple-600/30 backdrop-blur-sm border border-white/20 rounded-lg px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2 shadow-md" style={{ fontFamily: 'var(--font-playfair)' }}>
        {t('timerUntilNewYear')}
      </div>
      
      {/* Панелька с таймером */}
      <div className="bg-gradient-to-r from-purple-600/40 via-pink-600/40 to-purple-600/40 backdrop-blur-md border border-white/30 rounded-lg p-2 sm:p-2.5 md:p-3 text-center shadow-lg relative w-full max-w-[1200px]">
        {isSyncing && (
          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" title="Синхронизация времени"></div>
        )}
        {isNewYear ? (
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl">🎉</div>
            <div className="text-sm sm:text-base font-bold text-white" style={{ fontFamily: 'var(--font-playfair)' }}>{t('timerNewYear')}</div>
            <div className="text-xs text-white/80">✨</div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 md:gap-3">
            <div 
              className="bg-white/15 backdrop-blur-sm rounded-lg px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 border border-white/20 flex items-center gap-1 sm:gap-1.5 min-w-[55px] sm:min-w-[60px] md:min-w-[65px] justify-center cursor-default"
              title={t('timerDayFull')}
            >
              <span className="text-xs sm:text-sm md:text-base font-bold text-white" style={{ fontFamily: 'var(--font-playfair)' }}>{timeLeft.days}</span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] text-white/70 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>{t('timerDay')}</span>
            </div>
            <div 
              className="bg-white/15 backdrop-blur-sm rounded-lg px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 border border-white/20 flex items-center gap-1 sm:gap-1.5 min-w-[55px] sm:min-w-[60px] md:min-w-[65px] justify-center cursor-default"
              title={t('timerHourFull')}
            >
              <span className="text-xs sm:text-sm md:text-base font-bold text-white" style={{ fontFamily: 'var(--font-playfair)' }}>{timeLeft.hours}</span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] text-white/70 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>{t('timerHour')}</span>
            </div>
            <div 
              className="bg-white/15 backdrop-blur-sm rounded-lg px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 border border-white/20 flex items-center gap-1 sm:gap-1.5 min-w-[55px] sm:min-w-[60px] md:min-w-[65px] justify-center cursor-default"
              title={t('timerMinuteFull')}
            >
              <span className="text-xs sm:text-sm md:text-base font-bold text-white" style={{ fontFamily: 'var(--font-playfair)' }}>{timeLeft.minutes}</span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] text-white/70 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>{t('timerMinute')}</span>
            </div>
            <div 
              className="bg-white/15 backdrop-blur-sm rounded-lg px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 border border-white/20 flex items-center gap-1 sm:gap-1.5 min-w-[55px] sm:min-w-[60px] md:min-w-[65px] justify-center cursor-default"
              title={t('timerSecondFull')}
            >
              <span className="text-xs sm:text-sm md:text-base font-bold text-white" style={{ fontFamily: 'var(--font-playfair)' }}>{timeLeft.seconds}</span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] text-white/70 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>{t('timerSecond')}</span>
            </div>
            <select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="bg-white/15 backdrop-blur-sm rounded-lg px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 border border-white/20 text-white/90 text-[8px] sm:text-[9px] md:text-[10px] font-medium ml-1 sm:ml-2 cursor-pointer hover:bg-white/20 transition-colors"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value} className="bg-slate-800">
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
