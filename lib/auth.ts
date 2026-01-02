/**
 * Утилиты для работы с авторизацией через Supabase Auth
 */

import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email?: string;
}

/**
 * Регистрация нового пользователя
 */
export async function signUp(email: string, password: string) {
  // Получаем URL приложения из переменных окружения или используем текущий домен
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'https://super2026.online');
  
  console.log('[Auth] SignUp attempt:', { email, appUrl });
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    console.error('[Auth] SignUp error:', error);
    throw new Error(error.message);
  }

  console.log('[Auth] SignUp success:', { 
    user: data.user?.id, 
    email: data.user?.email,
    emailSent: data.user?.email_confirmed_at ? 'already confirmed' : 'confirmation email should be sent'
  });

  return data;
}

/**
 * Вход пользователя
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Выход пользователя
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Получить текущего авторизованного пользователя
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

/**
 * Проверяет, авторизован ли пользователь
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Получает сессию пользователя
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error(error.message);
  }

  return session;
}

/**
 * Сброс пароля (отправка email для сброса)
 */
export async function resetPassword(email: string) {
  // Получаем URL приложения из переменных окружения или используем текущий домен
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'https://super2026.online');
  
  console.log('[Auth] Reset password attempt:', { email, appUrl });
  console.log('[Auth] Redirect URL will be:', `${appUrl}/auth/callback?type=recovery`);
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?type=recovery`,
  });

  if (error) {
    console.error('[Auth] Reset password error:', error);
    console.error('[Auth] Error details:', JSON.stringify(error, null, 2));
    throw new Error(error.message);
  }

  console.log('[Auth] Reset password response:', data);
  console.log('[Auth] Reset password email should be sent to:', email);
  
  // Важно: Supabase всегда возвращает success, даже если email не найден (из соображений безопасности)
  // Письмо отправляется только если пользователь с таким email существует
  return data;
}

/**
 * Обновление пароля (после перехода по ссылке сброса)
 */
export async function updatePassword(newPassword: string) {
  console.log('[Auth] Updating password...');
  
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error('[Auth] Update password error:', error);
    throw new Error(error.message);
  }

  console.log('[Auth] Password updated successfully');
  return data;
}

/**
 * Слушает изменения состояния авторизации
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email,
      });
    } else {
      callback(null);
    }
  });
}

