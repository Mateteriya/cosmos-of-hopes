'use client';

/**
 * Страница обработки callback от Supabase после подтверждения email
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { updatePassword } from '@/lib/auth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'setPassword'>('loading');
  const [message, setMessage] = useState('Обработка подтверждения...');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [recoveryTokens, setRecoveryTokens] = useState<{ accessToken: string; refreshToken: string } | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState<string | null>(null);

  // КРИТИЧЕСКИ ВАЖНО: Проверяем recovery ДО основного useEffect
  // Это предотвращает автоматическую установку сессии Supabase
  useEffect(() => {
    // Проверяем, является ли это recovery flow СРАЗУ при монтировании
    if (typeof window === 'undefined') return;
    
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);
    const type = hashParams.get('type') || searchParams.get('type');
    
    if (type === 'recovery') {
      console.log('[AuthCallback] Early recovery detection - setting session first, then clearing hash');
      
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        // ВАЖНО: Сначала устанавливаем сессию, чтобы получить email и продлить срок действия токенов
        // ТОЛЬКО ПОТОМ очищаем hash
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ data: sessionData, error: sessionError }) => {
          if (sessionError) {
            console.error('[AuthCallback] Failed to set session in early detection:', sessionError);
            // Сохраняем токены для попытки позже
            sessionStorage.setItem('recovery_access_token', accessToken);
            sessionStorage.setItem('recovery_refresh_token', refreshToken);
          } else if (sessionData.session) {
            console.log('[AuthCallback] Session set successfully in early detection, user:', sessionData.user?.email);
            // Сохраняем email для отображения в форме
            if (sessionData.user?.email) {
              sessionStorage.setItem('recovery_email', sessionData.user.email);
            }
            // Сохраняем токены
            sessionStorage.setItem('recovery_access_token', accessToken);
            sessionStorage.setItem('recovery_refresh_token', refreshToken);
          }
          
          // ТЕПЕРЬ очищаем hash из URL
          const newUrl = window.location.pathname + (window.location.search || '');
          window.history.replaceState({}, '', newUrl);
          console.log('[AuthCallback] Hash cleared from URL');
        }).catch((err) => {
          console.error('[AuthCallback] Error in early session setup:', err);
        });
      }
      
      // Устанавливаем слушатель изменений сессии
      // НО: мы разрешаем установку сессии для recovery (чтобы продлить срок действия токенов)
      // Просто следим за изменениями для отладки
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          console.log('[AuthCallback] Session set for recovery flow (this is OK - session needed for password update)');
          // НЕ выходим из сессии - она нужна для обновления пароля
          // Пользователь не войдет автоматически, т.к. мы не перенаправляем его
        }
      });
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []); // Выполняется только один раз при монтировании

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('[AuthCallback] Starting callback handling...');
        console.log('[AuthCallback] Full URL:', window.location.href);
        console.log('[AuthCallback] Hash:', window.location.hash);
        console.log('[AuthCallback] Search:', window.location.search);

        // КРИТИЧЕСКИ ВАЖНО: Проверяем recovery САМЫМ ПЕРВЫМ делом, ДО ВСЕГО
        // Сначала проверяем URL на наличие recovery параметров
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        const type = hashParams.get('type') || searchParams.get('type');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        // Если это recovery, проверяем сессию, но НЕ выходим из неё
        // Сессия уже должна быть установлена в раннем useEffect
        if (type === 'recovery') {
          console.log('[AuthCallback] ⚠️ RECOVERY FLOW DETECTED - checking existing session');
          
          // Проверяем, есть ли уже сессия (должна быть установлена в раннем useEffect)
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          if (existingSession) {
            console.log('[AuthCallback] ✅ Active session found for recovery, user:', existingSession.user?.email);
            // НЕ выходим из сессии - она нужна для обновления пароля!
            // Просто сохраняем email и токены для формы
            if (existingSession.user?.email) {
              // Всегда устанавливаем email в state для отображения в форме
              setRecoveryEmail(existingSession.user.email);
              // Сохраняем в sessionStorage для надежности
              sessionStorage.setItem('recovery_email', existingSession.user.email);
            }
            
            // Сохраняем токены из sessionStorage для формы
            const savedAccessToken = sessionStorage.getItem('recovery_access_token');
            const savedRefreshToken = sessionStorage.getItem('recovery_refresh_token');
            if (savedAccessToken && savedRefreshToken) {
              setRecoveryTokens({ accessToken: savedAccessToken, refreshToken: savedRefreshToken });
            }
            
            // Показываем форму сразу, т.к. сессия уже активна
            setStatus('setPassword');
            setMessage('Установите новый пароль для вашего аккаунта');
            console.log('[AuthCallback] Showing password form with active session');
            return; // НЕ продолжаем обработку дальше - показываем форму
          } else {
            console.warn('[AuthCallback] No active session found - will try to set from tokens');
          }
          
          // Пытаемся получить токены из URL или из sessionStorage (если URL уже очищен)
          let finalAccessToken = accessToken;
          let finalRefreshToken = refreshToken;
          
          if (!finalAccessToken || !finalRefreshToken) {
            // Пытаемся получить из sessionStorage
            finalAccessToken = sessionStorage.getItem('recovery_access_token') || null;
            finalRefreshToken = sessionStorage.getItem('recovery_refresh_token') || null;
            console.log('[AuthCallback] Tokens retrieved from sessionStorage:', { 
              hasAccessToken: !!finalAccessToken, 
              hasRefreshToken: !!finalRefreshToken 
            });
          }
          
          // Получаем email из sessionStorage (если был сохранен)
          const savedEmail = sessionStorage.getItem('recovery_email');
          if (savedEmail) {
            setRecoveryEmail(savedEmail);
          }
          
          if (finalAccessToken && finalRefreshToken) {
            // Проверяем, есть ли уже активная сессия (возможно, установлена в раннем useEffect)
            let { data: { session: currentSession } } = await supabase.auth.getSession();
            
            // Если сессии нет, пытаемся установить её
            if (!currentSession) {
              console.log('[AuthCallback] No active session, setting session from tokens...');
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: finalAccessToken,
                refresh_token: finalRefreshToken,
              });

              if (sessionError) {
                console.warn('[AuthCallback] Failed to set session:', sessionError);
                // Все равно показываем форму - попробуем установить сессию позже
              } else if (sessionData.session) {
                currentSession = sessionData.session;
                console.log('[AuthCallback] Session set successfully, user:', sessionData.user?.email);
                // Сохраняем email (всегда, для отображения в форме)
                if (sessionData.user?.email) {
                  setRecoveryEmail(sessionData.user.email);
                  sessionStorage.setItem('recovery_email', sessionData.user.email);
                }
              }
            } else {
              console.log('[AuthCallback] Active session found, user:', currentSession.user?.email);
              // Сохраняем email из активной сессии (всегда, для отображения в форме)
              if (currentSession.user?.email) {
                setRecoveryEmail(currentSession.user.email);
                sessionStorage.setItem('recovery_email', currentSession.user.email);
              }
            }
            
            // Сохраняем токены для последующего использования при обновлении пароля
            setRecoveryTokens({ accessToken: finalAccessToken, refreshToken: finalRefreshToken });
            setStatus('setPassword');
            setMessage('Установите новый пароль для вашего аккаунта');
            console.log('[AuthCallback] Recovery tokens saved, showing password form');
            return; // НЕ продолжаем обработку дальше - показываем форму
          } else {
            throw new Error('Токены для сброса пароля не найдены в URL или sessionStorage');
          }
        }

        // Продолжаем обычную обработку только если это НЕ recovery
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        console.log('[AuthCallback] Hash params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type, error });

        if (error) {
          console.error('[AuthCallback] Error in hash:', error, errorDescription);
          setStatus('error');
          
          // Переводим английские сообщения на русский
          let errorMsg = errorDescription || 'Ошибка при обработке запроса';
          const errorLower = errorMsg.toLowerCase();
          if (errorLower.includes('expired') || errorLower.includes('истек')) {
            errorMsg = 'Ссылка истекла. Запросите новую ссылку.';
          } else if (errorLower.includes('invalid') || errorLower.includes('неверн')) {
            errorMsg = 'Неверная ссылка. Запросите новую ссылку.';
          } else if (errorLower.includes('token')) {
            errorMsg = 'Неверный токен. Запросите новую ссылку.';
          }
          
          setMessage(errorMsg);
          setTimeout(() => {
            router.push('/');
          }, 4000);
          return;
        }

        if (accessToken && refreshToken) {
          console.log('[AuthCallback] Found tokens in hash, type:', type);
          
          // Устанавливаем сессию (только для НЕ recovery операций)
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            // Переводим ошибки на русский
            let errorMsg = sessionError.message || 'Ошибка при установке сессии';
            const errorLower = errorMsg.toLowerCase();
            if (errorLower.includes('expired') || errorLower.includes('истек')) {
              errorMsg = 'Ссылка истекла. Запросите новую ссылку.';
            } else if (errorLower.includes('invalid') || errorLower.includes('неверн')) {
              errorMsg = 'Неверная ссылка. Запросите новую ссылку.';
            }
            throw new Error(errorMsg);
          }

          if (data.user) {
            console.log('[AuthCallback] Session set successfully, user:', data.user.email, 'type:', type);
            
            // Для регистрации - мигрируем данные
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
        
        // Переводим английские сообщения об ошибках на русский
        let errorMessage = error.message || 'Ошибка при обработке запроса';
        
        // Переводим распространенные ошибки Supabase
        const errorLower = errorMessage.toLowerCase();
        if (errorLower.includes('expired') || errorLower.includes('истек')) {
          errorMessage = 'Ссылка истекла. Запросите новую ссылку.';
        } else if (errorLower.includes('invalid') || errorLower.includes('неверн')) {
          errorMessage = 'Неверная ссылка. Запросите новую ссылку.';
        } else if (errorLower.includes('token')) {
          errorMessage = 'Неверный токен. Запросите новую ссылку.';
        } else if (errorLower.includes('email') && errorLower.includes('confirm')) {
          errorMessage = 'Ошибка при подтверждении email. Попробуйте еще раз.';
        } else if (errorLower.includes('password') && errorLower.includes('reset')) {
          errorMessage = 'Ошибка при сбросе пароля. Запросите новую ссылку.';
        } else if (errorLower.includes('session') || errorLower.includes('сессия')) {
          errorMessage = 'Ошибка при установке сессии. Попробуйте войти заново.';
        }
        
        setMessage(errorMessage);
        setTimeout(() => {
          router.push('/');
        }, 4000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative">
      {/* Кнопка "Домой" */}
      <div className="fixed top-2 left-2 sm:top-4 sm:left-4 z-50">
        <button
          onClick={() => router.push('/')}
          className="bg-slate-700/90 hover:bg-slate-600 text-white font-bold p-2.5 sm:p-3 rounded-lg shadow-xl transition-all transform hover:scale-105"
          title="На главную"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>
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

        {status === 'setPassword' && (
          <>
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="text-xl font-bold text-white mb-2">Установка нового пароля</h2>
            {recoveryEmail && (
              <p className="text-cyan-400 text-sm mb-2">
                Для аккаунта: <span className="font-semibold">{recoveryEmail}</span>
              </p>
            )}
            <p className="text-slate-300 mb-4">{message}</p>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                setPasswordError(null);
                
                // Валидация
                if (newPassword.length < 6) {
                  setPasswordError('Пароль должен быть не менее 6 символов');
                  return;
                }
                
                if (newPassword !== confirmPassword) {
                  setPasswordError('Пароли не совпадают');
                  return;
                }
                
                setIsSettingPassword(true);
                try {
                  // Проверяем, что сессия еще активна (должна быть установлена ранее)
                  let { data: { session: currentSession } } = await supabase.auth.getSession();
                  
                  // Если сессия не активна, пытаемся восстановить её с токенами
                  if (!currentSession) {
                    console.warn('[AuthCallback] Session not found at form submit, trying to restore...');
                    if (recoveryTokens) {
                      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                        access_token: recoveryTokens.accessToken,
                        refresh_token: recoveryTokens.refreshToken,
                      });

                      if (sessionError) {
                        console.error('[AuthCallback] Failed to restore session:', sessionError);
                        const errorMsg = sessionError.message || '';
                        if (errorMsg.toLowerCase().includes('expired') || errorMsg.toLowerCase().includes('invalid')) {
                          throw new Error('Ссылка для сброса пароля истекла. Запросите новую ссылку.');
                        }
                        throw new Error('Не удалось установить сессию. Запросите новую ссылку для сброса пароля.');
                      }
                      
                      if (sessionData.session) {
                        currentSession = sessionData.session;
                        console.log('[AuthCallback] Session restored successfully');
                      }
                    } else {
                      throw new Error('Токены для сброса пароля не найдены. Запросите новую ссылку.');
                    }
                  } else {
                    console.log('[AuthCallback] ✅ Active session confirmed, user:', currentSession.user?.email);
                  }

                  // Финальная проверка: убеждаемся, что сессия действительно активна
                  if (!currentSession) {
                    throw new Error('Сессия не найдена. Запросите новую ссылку для сброса пароля.');
                  }

                  // Обновляем пароль (сессия активна)
                  console.log('[AuthCallback] Updating password with active session...');
                  await updatePassword(newPassword);
                  
                  // Выходим из сессии, чтобы пользователь мог войти с новым паролем
                  await supabase.auth.signOut();
                  
                  // Очищаем токены и email из sessionStorage
                  sessionStorage.removeItem('recovery_access_token');
                  sessionStorage.removeItem('recovery_refresh_token');
                  sessionStorage.removeItem('recovery_email');
                  
                  setStatus('success');
                  setMessage('Пароль успешно изменен! Теперь вы можете войти в свой аккаунт с новым паролем.');
                  setTimeout(() => {
                    router.push('/');
                  }, 2000);
                } catch (error: any) {
                  // Переводим ошибки на русский
                  let errorMsg = error.message || 'Ошибка при установке пароля';
                  const errorLower = errorMsg.toLowerCase();
                  if (errorLower.includes('expired') || errorLower.includes('истек')) {
                    errorMsg = 'Ссылка истекла. Запросите новую ссылку для сброса пароля.';
                  } else if (errorLower.includes('invalid') || errorLower.includes('неверн')) {
                    errorMsg = 'Неверная ссылка. Запросите новую ссылку для сброса пароля.';
                  } else if (errorLower.includes('session')) {
                    errorMsg = 'Сессия истекла. Запросите новую ссылку для сброса пароля.';
                  }
                  setPasswordError(errorMsg);
                } finally {
                  setIsSettingPassword(false);
                }
              }}
              className="space-y-4 text-left"
            >
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Новый пароль
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  required
                  minLength={6}
                  className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                  disabled={isSettingPassword}
                />
              </div>
              
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Подтвердите пароль
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                  required
                  minLength={6}
                  className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                  disabled={isSettingPassword}
                />
              </div>
              
              {passwordError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2 text-red-200 text-sm">
                  {passwordError}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSettingPassword}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSettingPassword ? 'Установка пароля...' : 'Установить новый пароль'}
              </button>
            </form>
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

