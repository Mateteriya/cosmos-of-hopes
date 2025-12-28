'use client';

/**
 * Главная страница приложения "Cosmos of Hopes"
 */

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import NotificationPromptButton from '@/components/notifications/NotificationPromptButton';
import LanguageSwitcher from '@/components/language/LanguageSwitcher';
import { AutoTranslator } from '@/components/constructor/AutoTranslator';
import {
  isPushNotificationSupported,
  getPushSubscription,
  registerServiceWorker,
} from '@/lib/pushNotifications';

export default function Home() {
  const router = useRouter();
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  // Проверяем, нужно ли показать запрос уведомлений (второй заход)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkSecondVisit = async () => {
      try {
        // Проверяем, был ли уже первый заход
        const firstVisit = localStorage.getItem('cosmos_first_visit');
        const hasSeenSecondVisitPrompt = localStorage.getItem('cosmos_second_visit_notification_prompt');
        
        if (firstVisit && !hasSeenSecondVisitPrompt) {
          // Это второй заход - проверяем, подписаны ли на уведомления
          if (isPushNotificationSupported()) {
            try {
              const registration = await registerServiceWorker();
              if (registration) {
                const subscription = await getPushSubscription(registration);
                if (!subscription) {
                  // Не подписаны - показываем запрос
                  setShowNotificationPrompt(true);
                  localStorage.setItem('cosmos_second_visit_notification_prompt', 'shown');
                }
              }
            } catch (error) {
              console.error('Error checking notification subscription:', error);
            }
          }
        } else if (!firstVisit) {
          // Первый заход - сохраняем метку
          localStorage.setItem('cosmos_first_visit', Date.now().toString());
        }
      } catch (error) {
        console.error('Error in checkSecondVisit:', error);
      }
    };

    checkSecondVisit();
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3 sm:p-4 relative">
      {/* Кнопка уведомлений в левом верхнем углу */}
      <NotificationPromptButton />
      
      {/* Кнопки переключения языков по центру сверху */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3">
        <LanguageSwitcher />
        <AutoTranslator />
      </div>
      
      {/* Модальное окно запроса уведомлений для второго захода */}
      {showNotificationPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-purple-500/50 shadow-2xl max-w-md w-full p-4 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🔔</div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Включить уведомления?
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm px-2">
                Получайте напоминания о волшебном моменте и важных событиях!
              </p>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={() => {
                  // Открываем кнопку в правом углу для подписки
                  setShowNotificationPrompt(false);
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                Включить уведомления
              </button>
              <button
                onClick={() => setShowNotificationPrompt(false)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all text-sm sm:text-base"
              >
                Позже
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl w-full">
        {/* Заголовок */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12 pt-16 sm:pt-4">
          {/* Русское название приложения */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent leading-tight px-6 sm:px-2" style={{ fontFamily: 'var(--font-inter)' }}>
            ✨ Вселенная Желаний ✨
          </h1>
          {/* Английское название (меньше, под русским) */}
          <p className="text-xs sm:text-sm md:text-base text-white/50 mb-4 sm:mb-6 font-light italic px-6 sm:px-2" style={{ fontFamily: 'var(--font-inter)' }}>
            Cosmos of Hopes
          </p>
          {/* Описание - улучшенные стили для мобильных */}
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 mb-2 sm:mb-3 px-6 sm:px-6 md:px-8 max-w-xs sm:max-w-lg mx-auto leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
            Совместное празднование Нового года онлайн
          </p>
          <p className="text-xs sm:text-sm md:text-base text-white/60 px-6 sm:px-6 md:px-8 max-w-xs sm:max-w-md mx-auto leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
            Создавайте шары желаний, украшайте ёлку вместе с друзьями
          </p>
        </div>

        {/* Основные действия */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          {/* Создать шар */}
          <button
            onClick={() => router.push('/create')}
            className="group relative text-white font-bold px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 rounded-xl sm:rounded-2xl shadow-2xl transition-all transform active:scale-95 touch-manipulation"
            style={{ backgroundColor: '#9333ea', background: 'linear-gradient(to bottom right, #9333ea, #db2777)' }}
          >
            <div className="mb-2 sm:mb-3 md:mb-4 flex justify-center">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2">Создать шар</div>
            <div className="text-xs sm:text-sm opacity-90">Украсьте ёлку своим желанием</div>
            <div className="absolute inset-0 bg-white/0 group-active:bg-white/10 rounded-xl sm:rounded-2xl transition-all" />
          </button>

          {/* Комнаты */}
          <button
            onClick={() => router.push('/rooms')}
            className="group relative text-white font-bold px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 rounded-xl sm:rounded-2xl shadow-2xl transition-all transform active:scale-95 touch-manipulation"
            style={{ backgroundColor: '#2563eb', background: 'linear-gradient(to bottom right, #2563eb, #06b6d4)' }}
          >
            <div className="mb-2 sm:mb-3 md:mb-4 flex justify-center">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2">Комнаты</div>
            <div className="text-xs sm:text-sm opacity-90">Создайте комнату для друзей</div>
            <div className="absolute inset-0 bg-white/0 group-active:bg-white/10 rounded-xl sm:rounded-2xl transition-all" />
          </button>

          {/* Общая ёлка */}
          <button
            onClick={() => router.push('/tree')}
            className="group relative text-white font-bold px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 rounded-xl sm:rounded-2xl shadow-2xl transition-all transform active:scale-95 touch-manipulation"
            style={{ backgroundColor: '#16a34a', background: 'linear-gradient(to bottom right, #16a34a, #10b981)' }}
          >
            <div className="mb-2 sm:mb-3 md:mb-4 flex justify-center">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2">Общая ёлка</div>
            <div className="text-xs sm:text-sm opacity-90">Посмотрите все желания</div>
            <div className="absolute inset-0 bg-white/0 group-active:bg-white/10 rounded-xl sm:rounded-2xl transition-all" />
          </button>
        </div>

        {/* Описание приложения */}
        <div className="bg-gradient-to-br from-slate-800/80 via-purple-900/30 to-slate-800/80 backdrop-blur-md border-2 border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 text-center bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
            ✨ Что мы предлагаем
          </h2>
          <div className="space-y-3 sm:space-y-4 text-left">
            <div className="flex items-start gap-3">
              <span className="text-2xl sm:text-3xl flex-shrink-0 flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">Создайте уникальный шар желаний</h3>
                <p className="text-xs sm:text-sm text-white/80">Нарисуйте свой шар, выберите цвета, эффекты и фильтры. Каждый шар неповторим, как ваше желание.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl sm:text-3xl flex-shrink-0 flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L8.5 7h7L12 1zm-4 8L6 13h12l-2-4H8zm-2 6L4 18h16l-2-3H6zm-1 4h16v1H5v-1z"/>
                </svg>
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">Украсьте общую ёлку</h3>
                <p className="text-xs sm:text-sm text-white/80">Ваш шар появится на виртуальной ёлке вместе с шарами других людей. Поддерживайте чужие мечты лайками!</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl sm:text-3xl flex-shrink-0 flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">Празднуйте вместе в комнатах</h3>
                <p className="text-xs sm:text-sm text-white/80">Создавайте комнаты для друзей и близких. Встречайте Новый год вместе, даже находясь далеко друг от друга.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl sm:text-3xl flex-shrink-0 flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">Загадайте желание</h3>
                <p className="text-xs sm:text-sm text-white/80">Напишите ваше самое заветное желание. Пусть оно станет частью магии Нового года!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
          <p className="text-white/70 text-xs sm:text-sm mb-2">
            💫 Присоединяйтесь к тысячам людей, которые уже украсили нашу виртуальную ёлку
          </p>
          <p className="text-white/50 text-[10px] sm:text-xs">
            Каждый шар — это чьё-то желание, мечта или надежда на новый год
          </p>
        </div>
      </div>
    </div>
  );
}
