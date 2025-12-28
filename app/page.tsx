'use client';

/**
 * Главная страница приложения "Cosmos of Hopes"
 */

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import NotificationPromptButton from '@/components/notifications/NotificationPromptButton';
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
    const checkSecondVisit = async () => {
      // Проверяем, был ли уже первый заход
      const firstVisit = localStorage.getItem('cosmos_first_visit');
      const hasSeenSecondVisitPrompt = localStorage.getItem('cosmos_second_visit_notification_prompt');
      
      if (firstVisit && !hasSeenSecondVisitPrompt) {
        // Это второй заход - проверяем, подписаны ли на уведомления
        if (isPushNotificationSupported()) {
          const registration = await registerServiceWorker();
          if (registration) {
            const subscription = await getPushSubscription(registration);
            if (!subscription) {
              // Не подписаны - показываем запрос
              setShowNotificationPrompt(true);
              localStorage.setItem('cosmos_second_visit_notification_prompt', 'shown');
            }
          }
        }
      } else if (!firstVisit) {
        // Первый заход - сохраняем метку
        localStorage.setItem('cosmos_first_visit', Date.now().toString());
      }
    };

    checkSecondVisit();
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3 sm:p-4 relative">
      {/* Кнопка уведомлений в правом верхнем углу */}
      <NotificationPromptButton />
      
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
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
            ✨ Cosmos of Hopes ✨
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/80 mb-1 sm:mb-2 px-2">
            Совместное празднование Нового года онлайн
          </p>
          <p className="text-sm sm:text-base md:text-lg text-white/60 px-2">
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
            <div className="text-4xl sm:text-5xl mb-2 sm:mb-3 md:mb-4">🎄</div>
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
            <div className="text-4xl sm:text-5xl mb-2 sm:mb-3 md:mb-4">🏠</div>
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
            <div className="text-4xl sm:text-5xl mb-2 sm:mb-3 md:mb-4">🌟</div>
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
              <span className="text-2xl sm:text-3xl flex-shrink-0">🎨</span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">Создайте уникальный шар желаний</h3>
                <p className="text-xs sm:text-sm text-white/80">Нарисуйте свой шар, выберите цвета, эффекты и фильтры. Каждый шар неповторим, как ваше желание.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl sm:text-3xl flex-shrink-0">🌲</span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">Украсьте общую ёлку</h3>
                <p className="text-xs sm:text-sm text-white/80">Ваш шар появится на виртуальной ёлке вместе с шарами других людей. Поддерживайте чужие мечты лайками!</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl sm:text-3xl flex-shrink-0">🏠</span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">Празднуйте вместе в комнатах</h3>
                <p className="text-xs sm:text-sm text-white/80">Создавайте комнаты для друзей и близких. Встречайте Новый год вместе, даже находясь далеко друг от друга.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl sm:text-3xl flex-shrink-0">💫</span>
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
