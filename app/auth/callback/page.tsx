'use client';

/**
 * Страница обработки callback от Supabase после подтверждения email
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Обработка подтверждения...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('[AuthCallback] Starting callback handling...');
        console.log('[AuthCallback] Full URL:', window.location.href);
        console.log('[AuthCallback] Hash:', window.location.hash);
        console.log('[AuthCallback] Search:', window.location.search);

        // Сначала проверяем hash параметры (стандартный формат Supabase)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          console.error('[AuthCallback] Error in hash:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'Ошибка при подтверждении email');
          setTimeout(() => {
            router.push('/');
          }, 3000);
          return;
        }

        if (accessToken && refreshToken) {
          console.log('[AuthCallback] Found tokens in hash, setting session...');
          // Устанавливаем сессию
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }

          if (data.user) {
            console.log('[AuthCallback] Session set successfully, user:', data.user.email);
            
            // Мигрируем данные анонимного пользователя к зарегистрированному
            try {
              const { migrateAnonymousDataToUser } = await import('@/lib/userMigration');
              const { getOrCreateUserId } = await import('@/lib/userId');
              
              // Получаем старый анонимный ID из localStorage
              if (typeof window !== 'undefined') {
                const oldUserId = localStorage.getItem('cosmos_user_id');
                if (oldUserId && oldUserId !== data.user.id) {
                  await migrateAnonymousDataToUser(oldUserId, data.user.id);
                  console.log('[AuthCallback] User data migrated successfully');
                }
              }
            } catch (migrationError) {
              console.error('[AuthCallback] Error migrating user data:', migrationError);
              // Не прерываем процесс, даже если миграция не удалась
            }
            
            setStatus('success');
            setMessage('Email успешно подтвержден! Теперь вы можете вернуться на сайт и войти в свой аккаунт.');
          } else {
            throw new Error('Не удалось получить данные пользователя');
          }
        } else {
          // Проверяем query параметры (альтернативный формат)
          const searchParams = new URLSearchParams(window.location.search);
          const token = searchParams.get('token');
          const type = searchParams.get('type');

          console.log('[AuthCallback] Checking query params:', { token, type });

          if (token && type === 'signup') {
            console.log('[AuthCallback] Verifying OTP token...');
            // Пытаемся подтвердить email через токен
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'signup',
            });

            if (verifyError) {
              throw verifyError;
            }

            if (data.user) {
              console.log('[AuthCallback] OTP verified successfully, user:', data.user.email);
              
              // Мигрируем данные анонимного пользователя к зарегистрированному
              try {
                const { migrateAnonymousDataToUser } = await import('@/lib/userMigration');
                
                // Получаем старый анонимный ID из localStorage
                if (typeof window !== 'undefined') {
                  const oldUserId = localStorage.getItem('cosmos_user_id');
                  if (oldUserId && oldUserId !== data.user.id) {
                    await migrateAnonymousDataToUser(oldUserId, data.user.id);
                    console.log('[AuthCallback] User data migrated successfully');
                  }
                }
              } catch (migrationError) {
                console.error('[AuthCallback] Error migrating user data:', migrationError);
                // Не прерываем процесс, даже если миграция не удалась
              }
              
              setStatus('success');
              setMessage('Email успешно подтвержден! Теперь вы можете вернуться на сайт и войти в свой аккаунт.');
            } else {
              throw new Error('Не удалось получить данные пользователя после подтверждения');
            }
          } else {
            // Пытаемся получить текущую сессию (может быть уже установлена)
            console.log('[AuthCallback] No tokens found, checking existing session...');
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (session && session.user) {
              console.log('[AuthCallback] Found existing session, user:', session.user.email);
              setStatus('success');
              setMessage('Вы уже авторизованы! Можете вернуться на сайт.');
            } else {
              console.error('[AuthCallback] No session found and no tokens in URL');
              throw new Error('Токен не найден в URL и сессия не установлена');
            }
          }
        }
      } catch (error: any) {
        console.error('[AuthCallback] Error:', error);
        setStatus('error');
        setMessage(error.message || 'Ошибка при подтверждении email');
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-purple-500/50 shadow-2xl max-w-md w-full p-6 text-center">
        {status === 'loading' && (
          <>
            <div className="text-4xl mb-4 animate-spin">⏳</div>
            <h2 className="text-xl font-bold text-white mb-2">Обработка...</h2>
            <p className="text-slate-300">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-white mb-2">Успешно!</h2>
            <p className="text-slate-300 mb-4">{message}</p>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-6 rounded-lg transition-all"
            >
              Вернуться на сайт
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-white mb-2">Ошибка</h2>
            <p className="text-slate-300 mb-4">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-6 rounded-lg transition-all"
            >
              Вернуться на главную
            </button>
          </>
        )}
      </div>
    </div>
  );
}

