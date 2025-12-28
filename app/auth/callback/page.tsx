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
        // Получаем токен из URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Ошибка при подтверждении email');
          setTimeout(() => {
            router.push('/');
          }, 3000);
          return;
        }

        if (accessToken) {
          // Устанавливаем сессию
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });

          if (sessionError) {
            throw sessionError;
          }

          if (data.user) {
            setStatus('success');
            setMessage('Email успешно подтвержден! Перенаправление...');
            setTimeout(() => {
              router.push('/');
            }, 2000);
          } else {
            throw new Error('Не удалось получить данные пользователя');
          }
        } else {
          // Проверяем, может быть токен уже в query параметрах
          const searchParams = new URLSearchParams(window.location.search);
          const token = searchParams.get('token');
          const type = searchParams.get('type');

          if (token && type === 'signup') {
            // Пытаемся подтвердить email через токен
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'signup',
            });

            if (verifyError) {
              throw verifyError;
            }

            setStatus('success');
            setMessage('Email успешно подтвержден! Перенаправление...');
            setTimeout(() => {
              router.push('/');
            }, 2000);
          } else {
            throw new Error('Токен не найден в URL');
          }
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
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
            <p className="text-slate-300">{message}</p>
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

