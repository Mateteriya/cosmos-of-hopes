'use client';

/**
 * Кнопка для регистрации/входа
 * Показывается в правом верхнем углу, если пользователь не авторизован
 */

import { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from '@/lib/auth';
import AuthModal from './AuthModal';
import type { AuthUser } from '@/lib/auth';

export default function AuthButton() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'signin' | 'signup'>('signup');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // На мобильном сворачиваем через 3 секунды (только если не авторизован)
    if (!isLoading && !user) {
      const timer = setTimeout(() => {
        if (isMobile) {
          setIsCollapsed(true);
        }
      }, 3000);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkMobile);
      };
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [isLoading, user, isMobile]);

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
      alert(error.message || 'Ошибка при выходе');
    }
  };

  if (isLoading) {
    return null;
  }

  if (user) {
    // Пользователь авторизован - показываем кнопку выхода
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold px-4 py-2.5 rounded-lg shadow-2xl backdrop-blur-md border-2 border-white/20 flex items-center gap-2 text-sm sm:text-base">
          <span className="text-lg">✅</span>
          <span className="hidden sm:inline">{user.email || 'Авторизован'}</span>
          <span className="sm:hidden">✓</span>
          <button
            onClick={handleSignOut}
            className="ml-2 hover:opacity-80 transition-opacity"
            title="Выйти"
          >
            🚪
          </button>
        </div>
      </div>
    );
  }

  // Пользователь не авторизован - показываем кнопку регистрации
  const shouldShowFull = !isMobile || !isCollapsed || isHovered;

  return (
    <>
      <div 
        className="fixed top-4 right-4 z-50"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          onClick={() => {
            setModalMode('signup');
            setShowModal(true);
          }}
          className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-2xl transition-all transform hover:scale-105 backdrop-blur-md border-2 border-white/20 flex items-center gap-2 ${
            shouldShowFull 
              ? 'px-4 py-2.5 text-sm sm:text-base' 
              : 'px-2 py-2 text-xl'
          }`}
          title={!shouldShowFull ? 'Регистрация' : undefined}
        >
          <span className="text-lg">🔐</span>
          {shouldShowFull && (
            <>
              <span className="hidden sm:inline">Регистрация</span>
              <span className="sm:hidden">Регистрация</span>
            </>
          )}
        </button>
      </div>

      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={checkAuth}
        initialMode={modalMode}
      />
    </>
  );
}

