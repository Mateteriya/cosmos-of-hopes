/**
 * Утилита для управления уникальным ID пользователя
 * ID сохраняется в localStorage и остается постоянным для одного браузера/устройства
 */

const USER_ID_KEY = 'cosmos_of_hopes_user_id';

/**
 * Получает существующий ID пользователя или создает новый
 * ID остается постоянным для одного браузера/устройства
 */
export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') {
    // SSR - возвращаем временный ID (будет переопределен на клиенте)
    return 'temp_user_' + Date.now();
  }

  let userId = localStorage.getItem(USER_ID_KEY);
  
  if (!userId) {
    // Генерируем новый уникальный ID
    // Формат: user_timestamp_randomString
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(USER_ID_KEY, userId);
    console.log('[UserId] Создан новый ID пользователя:', userId);
  }
  
  return userId;
}

/**
 * Получает существующий ID пользователя (без создания нового)
 * @returns ID пользователя или null, если ID еще не создан
 */
export function getUserId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(USER_ID_KEY);
}

/**
 * Очищает ID пользователя (для тестирования или сброса)
 * ВНИМАНИЕ: Это позволит пользователю создать новый шар!
 */
export function clearUserId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_ID_KEY);
    console.log('[UserId] ID пользователя очищен');
  }
}

