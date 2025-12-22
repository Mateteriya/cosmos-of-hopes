/**
 * Утилиты для работы с часовыми поясами и временем Нового года
 */

export interface UserTimezone {
  timezone: string; // IANA timezone (например, "Europe/Moscow")
  offset: number; // Смещение в минутах от UTC
  newYearMidnight: string; // ISO timestamp наступления Нового года (2025-01-01 00:00 по времени пользователя)
}

/**
 * Получает часовой пояс браузера
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    // Fallback для старых браузеров
    const offset = -new Date().getTimezoneOffset();
    return `UTC${offset >= 0 ? '+' : ''}${Math.floor(offset / 60)}:${String(offset % 60).padStart(2, '0')}`;
  }
}

/**
 * Вычисляет смещение от UTC в минутах для часового пояса
 */
export function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tz = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return (tz.getTime() - utc.getTime()) / (1000 * 60);
  } catch (e) {
    // Fallback
    return -new Date().getTimezoneOffset();
  }
}

/**
 * Вычисляет точное время наступления Нового года (2025-01-01 00:00) по времени пользователя
 */
export function calculateNewYearMidnight(timezone: string): string {
  try {
    // Создаем дату 2025-01-01 00:00 в часовом поясе пользователя
    const year = 2025;
    const month = 0; // Январь (0-indexed)
    const day = 1;
    const hour = 0;
    const minute = 0;
    const second = 0;

    // Создаем строку даты в формате, который понимает временная зона
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
    
    // Парсим как локальное время в указанном часовом поясе
    const localDate = new Date(dateString);
    
    // Получаем смещение для этого часового пояса
    const offset = getTimezoneOffset(timezone);
    
    // Вычисляем UTC время
    const utcTime = localDate.getTime() - (offset * 60 * 1000);
    
    // Создаем ISO строку
    return new Date(utcTime).toISOString();
  } catch (e) {
    // Fallback: используем текущее смещение браузера
    const now = new Date();
    const year = 2025;
    const month = 0;
    const day = 1;
    
    // Создаем дату 2025-01-01 00:00 в локальном времени
    const localMidnight = new Date(year, month, day, 0, 0, 0, 0);
    
    // Конвертируем в UTC
    return localMidnight.toISOString();
  }
}

/**
 * Получает сохраненный часовой пояс пользователя или определяет автоматически
 */
export function getUserTimezone(): UserTimezone {
  if (typeof window === 'undefined') {
    // SSR fallback
    return {
      timezone: 'UTC',
      offset: 0,
      newYearMidnight: '2025-01-01T00:00:00.000Z',
    };
  }

  // Пытаемся получить из localStorage
  const saved = localStorage.getItem('user_timezone');
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as UserTimezone;
      // Проверяем, что данные актуальны
      if (parsed.timezone && parsed.newYearMidnight) {
        return parsed;
      }
    } catch (e) {
      console.warn('Ошибка парсинга сохраненного часового пояса:', e);
    }
  }

  // Определяем автоматически
  const browserTimezone = getBrowserTimezone();
  const offset = getTimezoneOffset(browserTimezone);
  const newYearMidnight = calculateNewYearMidnight(browserTimezone);

  const userTimezone: UserTimezone = {
    timezone: browserTimezone,
    offset,
    newYearMidnight,
  };

  // Сохраняем
  localStorage.setItem('user_timezone', JSON.stringify(userTimezone));

  return userTimezone;
}

/**
 * Сохраняет часовой пояс пользователя
 */
export function saveUserTimezone(timezone: string): UserTimezone {
  const offset = getTimezoneOffset(timezone);
  const newYearMidnight = calculateNewYearMidnight(timezone);

  const userTimezone: UserTimezone = {
    timezone,
    offset,
    newYearMidnight,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem('user_timezone', JSON.stringify(userTimezone));
  }

  return userTimezone;
}

/**
 * Получает время до Нового года в миллисекундах
 */
export function getTimeUntilNewYear(): number {
  const userTz = getUserTimezone();
  const now = new Date();
  const newYear = new Date(userTz.newYearMidnight);
  return newYear.getTime() - now.getTime();
}

/**
 * Проверяет, наступил ли Новый год для пользователя
 */
export function isNewYear(): boolean {
  return getTimeUntilNewYear() <= 0;
}

/**
 * Проверяет, осталось ли до Нового года менее указанного времени (в минутах)
 */
export function isTimeUntilNewYearLessThan(minutes: number): boolean {
  const timeUntil = getTimeUntilNewYear();
  const minutesUntil = timeUntil / (1000 * 60);
  return minutesUntil <= minutes && minutesUntil > 0;
}

