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
  const [modalMode, setModalMode] = useState<'signin' | 'signup'>('signup');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    // Пользователь авторизован - показываем компактную зеленую галочку
    const shouldShowFull = !isMobile || !isCollapsed || isHovered;
    
    return (
      <div 
        className={`fixed top-4 right-4 z-[100] transition-all duration-300`}
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
        <div 
          className={`bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg shadow-2xl backdrop-blur-md border-2 border-white/20 flex items-center gap-2 ${
            shouldShowFull 
              ? 'px-4 py-2.5 text-sm sm:text-base' 
              : 'px-2 py-2 text-xl'
          }`}
          title={t('signedIn')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {shouldShowFull && (
            <span className="hidden sm:inline">{user.email || t('authorized')}</span>
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
              
              // Раскрываем кнопки при клике на замочек
              setIsCollapsed(false);
              setIsHovered(true);
              
              // Автоматически сворачиваем через 3 секунды, если модальное окно не открыто
              if (!showModal) {
                collapseTimerRef.current = setTimeout(() => {
                  if (isMobile && !user && !isLoading && !showModal) {
                    setIsCollapsed(true);
                    setIsHovered(false);
                  }
                }, 3000);
              }
            }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-2xl transition-all transform hover:scale-105 backdrop-blur-md border-2 border-white/20 px-2 py-2 text-xl"
            title={`${t('signUp')} / ${t('signInToAccount')}`}
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

