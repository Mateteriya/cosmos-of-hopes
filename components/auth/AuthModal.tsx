'use client';

/**
 * Модальное окно для регистрации и входа
 */

import { useState } from 'react';
import { signUp, signIn, getCurrentUser, resetPassword } from '@/lib/auth';
import { migrateUserData } from '@/lib/userMigration';
import { useLanguage } from '@/components/constructor/LanguageProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signup',
}: AuthModalProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (!email) {
        setError(t('emailRequired') || 'Введите email');
        setIsLoading(false);
        return;
      }

      await resetPassword(email);
      
      // Supabase всегда возвращает success для безопасности (даже если email не найден)
      // Но мы показываем сообщение пользователю
      setSuccessMessage(t('passwordResetEmailSent') || 'Если этот email зарегистрирован, письмо для сброса пароля отправлено. Проверьте почту (включая папку "Спам").');
      
      // Закрываем форму через 5 секунд (больше времени для прочтения сообщения)
      setTimeout(() => {
        setShowForgotPassword(false);
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      setError(err.message || t('passwordResetError') || 'Ошибка при отправке письма для сброса пароля');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        // Валидация пароля
        if (password.length < 6) {
          setError(t('passwordMinLength'));
          setIsLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError(t('passwordsDoNotMatch'));
          setIsLoading(false);
          return;
        }

        try {
          const signUpResult = await signUp(email, password);
          
          // Проверяем, существует ли уже пользователь с таким email
          // Supabase может вернуть user=null если email уже существует
          if (!signUpResult.user) {
            setError(t('emailAlreadyRegistered') || 'Этот email уже зарегистрирован. Попробуйте войти.');
            setIsLoading(false);
            // Предлагаем переключиться на вход через 2 секунды
            setTimeout(() => {
              setMode('signin');
              setError(null);
            }, 2000);
            return;
          }
          
          setSuccessMessage(t('signUpSuccess'));
          
          // Проверяем, подтвержден ли email
          const user = signUpResult.user;
          const isEmailConfirmed = user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined;
          
          if (isEmailConfirmed) {
            // Email уже подтвержден - входим автоматически
            setTimeout(async () => {
              await signIn(email, password);
              
              // Мигрируем данные пользователя (если есть)
              const currentUser = await getCurrentUser();
              if (currentUser) {
                const migration = await migrateUserData(currentUser.id);
                if (migration.success && (migration.toysMigrated > 0 || migration.roomsMigrated > 0)) {
                  setSuccessMessage(
                    t('dataMigrated').replace('{toys}', migration.toysMigrated.toString()).replace('{rooms}', migration.roomsMigrated.toString())
                  );
                }
              }
              
              if (onSuccess) onSuccess();
              setTimeout(() => onClose(), 2000);
            }, 2000);
          } else {
            // Email не подтвержден - показываем сообщение и закрываем модальное окно
            setSuccessMessage(t('signUpSuccess') + ' ' + (t('checkEmailForConfirmation') || 'Проверьте почту для подтверждения email.'));
            setTimeout(() => {
              onClose();
            }, 3000);
          }
        } catch (signUpError: any) {
          // Обрабатываем ошибки регистрации
          const errorMessage = signUpError.message || signUpError.toString();
          
          // Проверяем, не связана ли ошибка с уже существующим email
          const lowerMessage = errorMessage.toLowerCase();
          if (lowerMessage.includes('already registered') || 
              lowerMessage.includes('user already exists') ||
              lowerMessage.includes('email already') ||
              lowerMessage.includes('already exists') ||
              lowerMessage.includes('user already registered')) {
            setError(t('emailAlreadyRegistered') || 'Этот email уже зарегистрирован. Попробуйте войти.');
            // Предлагаем переключиться на вход через 2 секунды
            setTimeout(() => {
              setMode('signin');
              setError(null);
            }, 2000);
          } else {
            setError(errorMessage);
          }
          setIsLoading(false);
          return;
        }
      } else {
        await signIn(email, password);
        
        // Мигрируем данные пользователя при входе (если есть)
        const user = await getCurrentUser();
        if (user) {
          const migration = await migrateUserData(user.id);
          if (migration.success && (migration.toysMigrated > 0 || migration.roomsMigrated > 0)) {
            setSuccessMessage(
              t('dataMigrated').replace('{toys}', migration.toysMigrated.toString()).replace('{rooms}', migration.roomsMigrated.toString())
            );
            setTimeout(() => {
              if (onSuccess) onSuccess();
              onClose();
            }, 2000);
            return;
          }
        }
        
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || t('authError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-purple-500/50 shadow-2xl max-w-md w-full p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {showForgotPassword 
              ? (t('resetPassword') || 'Сброс пароля')
              : (mode === 'signup' ? t('signUp') : t('signIn'))
            }
          </h2>
          <button
            onClick={() => {
              if (showForgotPassword) {
                setShowForgotPassword(false);
                setError(null);
                setSuccessMessage(null);
              } else {
                onClose();
              }
            }}
            className="text-white/70 hover:text-white transition-colors text-2xl"
            aria-label={t('close')}
          >
            ×
          </button>
        </div>

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-white/80 text-xs sm:text-sm mb-1.5 sm:mb-2">
                {t('email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                required
                className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 sm:px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 text-sm sm:text-base"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-3 sm:px-4 py-2 text-red-200 text-xs sm:text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg px-3 sm:px-4 py-2 text-green-200 text-xs sm:text-sm">
                {successMessage}
              </div>
            )}

            <div className="space-y-2 sm:space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
              >
                {isLoading
                  ? t('loading')
                  : (t('sendResetLink') || 'Отправить ссылку')
                }
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                {t('backToSignIn') || 'Вернуться ко входу'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-white/80 text-xs sm:text-sm mb-1.5 sm:mb-2">
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
              className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 sm:px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 text-sm sm:text-base"
              disabled={isLoading}
            />
          </div>

          {!showForgotPassword && (
            <div>
              <label className="block text-white/80 text-xs sm:text-sm mb-1.5 sm:mb-2">
                {t('password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                required
                minLength={6}
                className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 sm:px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 text-sm sm:text-base"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Кнопка "Забыл пароль?" только в режиме входа */}
          {mode === 'signin' && !showForgotPassword && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm font-medium transition-colors underline"
              >
                {t('forgotPassword') || 'Забыл пароль? Сбросить'}
              </button>
            </div>
          )}

          {/* Форма сброса пароля */}
          {showForgotPassword && (
            <>
              <p className="text-white/60 text-xs sm:text-sm">
                {t('resetPasswordInstructions') || 'Введите ваш email, и мы отправим вам ссылку для сброса пароля.'}
              </p>
            </>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-white/80 text-xs sm:text-sm mb-1.5 sm:mb-2">
                {t('confirmPassword')}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
                required
                minLength={6}
                className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-3 sm:px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 text-sm sm:text-base"
                disabled={isLoading}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-3 sm:px-4 py-2 text-red-200 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg px-3 sm:px-4 py-2 text-green-200 text-xs sm:text-sm">
              {successMessage}
            </div>
          )}

          <div className="space-y-2 sm:space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
            >
              {isLoading
                ? t('loading')
                : mode === 'signup'
                ? t('signUpButton')
                : t('signInButton')
              }
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signup' ? 'signin' : 'signup');
                setError(null);
                setSuccessMessage(null);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
            >
              {mode === 'signup'
                ? t('alreadyHaveAccount')
                : t('noAccount')
              }
            </button>
          </div>
        </form>
        )}

        {!showForgotPassword && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-white/60 text-xs text-center">
              {t('afterSignUpInfo')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

