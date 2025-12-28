/**
 * Утилита для управления уникальным ID пользователя
 * Поддерживает как авторизованных пользователей (через Supabase Auth), так и анонимных (через localStorage)
 */

import { getCurrentUser } from './auth';

const USER_ID_KEY = 'cosmos_of_hopes_user_id';

/**
 * Получает ID пользователя с приоритетом авторизованного пользователя
 * Если пользователь авторизован - возвращает его ID из Supabase Auth
 * Если нет - возвращает/создает ID из localStorage
 */
export async function getOrCreateUserId(): Promise<string> {
  if (typeof window === 'undefined') {
    // SSR - возвращаем временный ID (будет переопределен на клиенте)
    return 'temp_user_' + Date.now();
  }

  // Сначала проверяем, авторизован ли пользователь
  try {
    const authUser = await getCurrentUser();
    if (authUser) {
      return authUser.id; // Используем ID авторизованного пользователя
    }
  } catch (error) {
    // Если ошибка авторизации, продолжаем с localStorage
    console.warn('[UserId] Auth check failed, using localStorage:', error);
  }

  // Если не авторизован, используем localStorage
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
export async function getUserId(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  // Сначала проверяем авторизованного пользователя
  try {
    const authUser = await getCurrentUser();
    if (authUser) {
      return authUser.id;
    }
  } catch (error) {
    // Игнорируем ошибки
  }

  // Если не авторизован, используем localStorage
  return localStorage.getItem(USER_ID_KEY);
}

/**
 * Очищает ID пользователя (для тестирования или сброса)
 * ВНИМАНИЕ: Это позволит пользователю создать новый шар!
 * Для авторизованных пользователей это не работает - нужно выйти из аккаунта
 */
export function clearUserId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_ID_KEY);
    console.log('[UserId] ID пользователя очищен');
  }
}

/**
 * Проверяет, авторизован ли пользователь
 */
export async function isAuthenticated(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const authUser = await getCurrentUser();
    return authUser !== null;
  } catch (error) {
    return false;
  }
}
