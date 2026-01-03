'use client';

/**
 * Кнопка для регистрации/входа
 * Показывается в правом верхнем углу, если пользователь не авторизован
 */

import { useState, useEffect, useRef } from 'react';
import { getCurrentUser, signOut } from '@/lib/auth';
import AuthModal from './AuthModal';
import { useLanguage } from '@/components/constructor/LanguageProvider';
import type { AuthUser } from '@/lib/auth';

export default function AuthButton() {
  const { t } = useLanguage();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'signin' | 'signup'>('signin'); // По умолчанию показываем форму входа
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    
    // Слушаем изменения авторизации
    const { supabase } = require('@/lib/supabase');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        console.log('[AuthButton] Click outside menu, closing');
        setShowAccountMenu(false);
      }
    };

    if (showAccountMenu) {
      // Используем небольшую задержку, чтобы не закрывать меню сразу после открытия
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside as any);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside as any);
      };
    }
  }, [showAccountMenu]);

  // Определяем мобильное устройство и таймер сворачивания
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      try {
        if (typeof window !== 'undefined' && window.innerWidth) {
          setIsMobile(window.innerWidth < 640); // sm breakpoint
        }
      } catch (error) {
        console.error('Error checking mobile:', error);
        // По умолчанию считаем мобильным, если не можем определить
        setIsMobile(true);
      }
    };
    
    checkMobile();
    
    try {
      window.addEventListener('resize', checkMobile);
    } catch (error) {
      console.error('Error adding resize listener:', error);
    }
    
    // На мобильном сворачиваем через 3 секунды (только если не авторизован и модальное окно закрыто)
    if (!isLoading && !user && !showModal) {
      // Очищаем предыдущий таймер
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
      
      collapseTimerRef.current = setTimeout(() => {
        if (isMobile && !showModal) {
          setIsCollapsed(true);
          setIsHovered(false);
        }
      }, 3000);
    }
    
    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
      try {
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', checkMobile);
        }
      } catch (error) {
        console.error('Error removing resize listener:', error);
      }
    };
    
    return () => {
      try {
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', checkMobile);
        }
      } catch (error) {
        console.error('Error removing resize listener:', error);
      }
    };
  }, [isLoading, user, isMobile, showModal]);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error: any) {
      alert(error.message || t('signOutError'));
    }
  };

  if (isLoading) {
    return null;
  }

  if (user) {
    // Пользователь авторизован - показываем компактную зеленую галочку с меню
    const shouldShowFull = !isMobile || !isCollapsed || isHovered;
    
    return (
      <div 
        ref={menuRef}
        className={`fixed top-4 right-4 z-[100] transition-all duration-300`}
        style={{ 
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 10000,
          pointerEvents: 'auto'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => {
          setIsHovered(true);
          setIsCollapsed(false);
        }}
        onTouchEnd={() => setTimeout(() => setIsHovered(false), 300)}
      >
        <div className="relative" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('[AuthButton] Button clicked! Current menu state:', showAccountMenu);
              const newState = !showAccountMenu;
              console.log('[AuthButton] Setting menu state to:', newState);
              setShowAccountMenu(newState);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={`bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg shadow-2xl backdrop-blur-md border-2 border-white/20 flex items-center gap-2 transition-all transform hover:scale-105 cursor-pointer pointer-events-auto ${
              shouldShowFull 
                ? 'px-4 py-2.5 text-sm sm:text-base' 
                : 'px-2 py-2 text-xl'
            }`}
            title={t('accountMenu') || 'Меню аккаунта'}
            type="button"
            style={{ pointerEvents: 'auto' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {shouldShowFull && (
              <span className="hidden sm:inline">{user.email || t('authorized')}</span>
            )}
            {showAccountMenu && (
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          {/* Выпадающее меню */}
          {showAccountMenu && (
            <div 
              className="absolute right-0 mt-2 w-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-2xl border-2 border-green-500/50 backdrop-blur-md overflow-hidden z-[200]"
              style={{ zIndex: 20000, pointerEvents: 'auto' }}
              onClick={(e) => {
                e.stopPropagation();
                console.log('[AuthButton] Menu clicked');
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Заголовок меню */}
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">
                  {t('accountManagement') || 'Управление аккаунтом'}
                </p>
              </div>

              {/* Информация об аккаунте */}
              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {user.email || t('user')}
                    </p>
                    <p className="text-white/60 text-xs">
                      {t('signedIn')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Опции меню */}
              <div className="py-2">
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[AuthButton] Sign out button clicked');
                    try {
                      await handleSignOut();
                      setShowAccountMenu(false);
                    } catch (error) {
                      console.error('Sign out error:', error);
                    }
                  }}
                  className="w-full px-4 py-3 text-left text-white/90 hover:bg-red-500/20 hover:text-red-200 transition-colors flex items-center gap-3 group cursor-pointer"
                  type="button"
                >
                  <svg className="w-5 h-5 text-red-400 group-hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">{t('signOut') || 'Выйти'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Пользователь не авторизован - показываем кнопку регистрации
  const shouldShowFull = !isMobile || !isCollapsed || isHovered;

  return (
    <>
      <div 
        className="fixed top-4 right-4 z-[100]"
        style={{ 
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 100
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => {
          setIsHovered(true);
          setIsCollapsed(false);
        }}
        onTouchEnd={() => setTimeout(() => setIsHovered(false), 300)}
      >
        {shouldShowFull ? (
          // Полная кнопка с двумя опциями
          <div className="flex gap-2">
            <button
              onClick={() => {
                setModalMode('signup');
                setShowModal(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-2xl transition-all transform hover:scale-105 backdrop-blur-md border-2 border-white/20 px-3 py-2.5 text-xs sm:text-sm"
              title={t('signUp')}
            >
              {t('signUp')}
            </button>
            <button
              onClick={() => {
                setModalMode('signin');
                setShowModal(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg shadow-2xl transition-all transform hover:scale-105 backdrop-blur-md border-2 border-white/20 px-3 py-2.5 text-xs sm:text-sm"
              title={t('signInToAccount')}
            >
              {t('signInToAccount')}
            </button>
          </div>
        ) : (
          // Свернутая кнопка - только замочек
          <button
            onClick={() => {
              // Очищаем предыдущий таймер
              if (collapseTimerRef.current) {
                clearTimeout(collapseTimerRef.current);
                collapseTimerRef.current = null;
              }
              
              // При клике на замочек открываем форму ВХОДА (приоритет)
              setModalMode('signin');
              setShowModal(true);
              
              // Раскрываем кнопки при клике на замочек (для визуального эффекта)
              setIsCollapsed(false);
              setIsHovered(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-2xl transition-all transform hover:scale-105 backdrop-blur-md border-2 border-white/20 px-2 py-2 text-xl"
            title={t('signInToAccount') || 'Вход'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </button>
        )}
      </div>

      <AuthModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          // Очищаем предыдущий таймер
          if (collapseTimerRef.current) {
            clearTimeout(collapseTimerRef.current);
            collapseTimerRef.current = null;
          }
          
          // Сбрасываем hover и сворачиваем кнопки обратно на мобильных
          setIsHovered(false);
          if (isMobile) {
            // Сворачиваем через небольшую задержку после закрытия модального окна
            collapseTimerRef.current = setTimeout(() => {
              setIsCollapsed(true);
              setIsHovered(false);
            }, 500);
          }
        }}
        onSuccess={checkAuth}
        initialMode={modalMode}
      />
    </>
  );
}

