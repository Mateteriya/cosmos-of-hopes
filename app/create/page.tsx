'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ToyConstructor from '@/components/constructor/ToyConstructor';
import ExistingBallModal from '@/components/constructor/ExistingBallModal';
import NotificationPrompt from '@/components/notifications/NotificationPrompt';
import type { ToyParams, Toy } from '@/types/toy';
import { createToy, getUserToy, getToyLikesCount } from '@/lib/toys';
import { supabase } from '@/lib/supabase';
import { getOrCreateUserId } from '@/lib/userId';
import { useLanguage } from '@/components/constructor/LanguageProvider';

export default function CreatePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [userId, setUserId] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [existingBall, setExistingBall] = useState<Toy | null>(null);
  const [showExistingBallModal, setShowExistingBallModal] = useState(false);
  const [existingBallLikes, setExistingBallLikes] = useState(0);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  
  // Инициализация userId только на клиенте
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserId(getOrCreateUserId());
    }
  }, []);
  
  // Функция для проверки существующего шара
  const checkExistingBall = useCallback(async (currentRoomId: string | null, currentUserId: string) => {
    if (!currentUserId) return; // Не проверяем, если userId еще не инициализирован
    
    try {
      const existing = await getUserToy(currentUserId, currentRoomId || undefined);
      if (existing) {
        setExistingBall(existing);
        // Получаем количество лайков
        const likes = await getToyLikesCount(existing.id);
        setExistingBallLikes(likes);
      } else {
        // Сбрасываем состояние, если шара нет
        setExistingBall(null);
        setExistingBallLikes(0);
      }
    } catch (err) {
      console.error('Ошибка проверки существующего шара:', err);
      // В случае ошибки просто продолжаем работу
    }
  }, []);
  
  // Получаем roomId из URL параметров после монтирования и проверяем существующий шар
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;
    
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    setRoomId(roomParam);
    
    // Проверяем, есть ли уже шар у пользователя (не блокируем загрузку)
    checkExistingBall(roomParam, userId).catch(err => {
      console.error('Ошибка при проверке существующего шара:', err);
      // Не блокируем загрузку страницы при ошибке
    });
  }, [userId, checkExistingBall]);

  const handleSave = async (params: ToyParams) => {
    if (!userId) {
      console.error('UserId не инициализирован');
      return;
    }
    
    try {
      // Проверяем, есть ли уже шар (если еще не проверили)
      if (!existingBall) {
        const existing = await getUserToy(userId, roomId || undefined);
        if (existing) {
          setExistingBall(existing);
          const likes = await getToyLikesCount(existing.id);
          setExistingBallLikes(likes);
          
          // Если шар уже есть - показываем модальное окно
          setShowExistingBallModal(true);
          return;
        }
      } else {
        // Если шар уже есть - показываем модальное окно
        setShowExistingBallModal(true);
        return;
      }

      // Продолжаем сохранение только если шара нет
      await doSave(params);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      throw error;
    }
  };

  const doSave = async (params: ToyParams) => {
    try {
      // Добавляем room_id к параметрам, если он есть в URL
      const paramsWithRoom: ToyParams = {
        ...params,
        room_id: roomId || undefined,
      };
      
      console.log('Сохранение игрушки:', { roomId, room_id: paramsWithRoom.room_id, userId });
      
      // Сохраняем игрушку
      const toy = await createToy(userId, paramsWithRoom);
      
      console.log('Игрушка создана:', { toyId: toy.id, room_id: toy.room_id });
      
      // Обновляем игрушку: помечаем как на ёлке и устанавливаем позицию
      // Пока миграция не применена, используем только существующие поля
      const position = {
        x: (Math.random() - 0.5) * 3,
        y: -1.5 + Math.random() * 3,
        z: (Math.random() - 0.5) * 3,
      };

      const updateData = {
        status: 'on_tree' as const, // Используем существующее поле
        is_on_tree: true,
        position: position,
        author_tg_id: userId,
        ...(roomId && { room_id: roomId }),
        ...(params.ball_size !== undefined && { ball_size: params.ball_size }),
        ...(params.surface_type && { surface_type: params.surface_type }),
        ...(params.effects && { effects: params.effects }),
        ...(params.filters && { filters: params.filters }),
        ...(params.second_color && { second_color: params.second_color }),
        ...(params.user_name && { user_name: params.user_name }),
        ...(params.selected_country && { selected_country: params.selected_country }),
        ...(params.birth_year !== undefined && { birth_year: params.birth_year }),
      };

      // Пытаемся обновить новые поля (если миграция применена)
      try {
        await supabase
          .from('toys')
          .update(updateData as never)
          .eq('id', toy.id);
      } catch (err: unknown) {
        // Если поля не существуют (миграция не применена), просто обновляем status
        const error = err as { message?: string; code?: string };
        if (error?.message?.includes('does not exist') || error?.code === '42703') {
          await supabase
            .from('toys')
            .update({ status: 'on_tree' } as never)
            .eq('id', toy.id);
        } else {
          throw err;
        }
      }

      setShowSuccess(true);
      
      // Показываем предложение включить уведомления через 1 секунду
      const hasSeenNotificationPrompt = localStorage.getItem('has_seen_notification_prompt_after_ball');
      if (!hasSeenNotificationPrompt) {
        setTimeout(() => {
          setShowNotificationPrompt(true);
        }, 1000);
        // Если показываем уведомление, не делаем автоматический редирект - пользователь сам выберет
        // Редирект произойдет только при закрытии модального окна
      } else {
        // Если уже видели уведомление, делаем обычный редирект через 2 секунды
        setTimeout(() => {
          setShowSuccess(false);
          // Возвращаемся на страницу ёлки (с room_id, если был)
          if (roomId) {
            router.push(`/tree?room=${roomId}`);
          } else {
            router.push('/tree');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      throw error;
    }
  };

  const handleViewBall = () => {
    setShowExistingBallModal(false);
    // Переходим на ёлку
    if (roomId) {
      router.push(`/tree?room=${roomId}`);
    } else {
      router.push('/tree');
    }
  };

  const handleEditBall = async () => {
    if (!existingBall || existingBallLikes > 0) {
      // Нельзя редактировать, если есть лайки
      return;
    }
    setShowExistingBallModal(false);
    // TODO: Загрузить существующий шар в конструктор для редактирования
    // Пока просто показываем сообщение, что редактирование будет в следующей версии
    alert('Редактирование существующего шара будет доступно в следующей версии. Пока вы можете создать новый шар, удалив старый.');
  };

  // Не рендерим, пока userId не инициализирован
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Кнопки навигации */}
      <div className="fixed top-2 left-2 sm:top-4 sm:left-4 z-50 flex flex-wrap gap-2">
        <button
          onClick={() => router.push('/')}
          className="bg-slate-700/90 hover:bg-slate-600 text-white font-bold px-3 sm:px-4 py-2 rounded-lg shadow-xl transition-all transform hover:scale-105 text-xs sm:text-sm"
        >
          🏠 Главная
        </button>
        <button
          onClick={() => router.push('/tree')}
          className="bg-green-600/90 hover:bg-green-700 text-white font-bold px-3 sm:px-4 py-2 rounded-lg shadow-xl transition-all transform hover:scale-105 text-xs sm:text-sm"
        >
          🌲 Ёлка
        </button>
        <button
          onClick={() => router.push('/rooms')}
          className="bg-blue-600/90 hover:bg-blue-700 text-white font-bold px-3 sm:px-4 py-2 rounded-lg shadow-xl transition-all transform hover:scale-105 text-xs sm:text-sm"
        >
          🏠 Комнаты
        </button>
      </div>

      {showSuccess && (
        <div className="fixed top-2 right-2 sm:top-4 sm:right-4 bg-green-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg z-50 animate-fade-in flex items-center gap-2 sm:gap-3 max-w-[calc(100vw-1rem)] sm:max-w-md text-xs sm:text-sm">
          <span>✅ Ваша игрушка заняла своё место на ёлке! 1 января она отправится в космос! 🌟</span>
          <button
            onClick={() => setShowSuccess(false)}
            className="text-white hover:text-gray-200 font-bold text-lg sm:text-xl leading-none flex-shrink-0 touch-manipulation p-1"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
      )}

      <ExistingBallModal
        isOpen={showExistingBallModal}
        onClose={() => setShowExistingBallModal(false)}
        onViewBall={handleViewBall}
        onEditBall={handleEditBall}
        hasLikes={existingBallLikes > 0}
        likesCount={existingBallLikes}
      />
      
      {showNotificationPrompt && (
        <NotificationPrompt
          title={t('enableNotificationsAfterBall')}
          message={t('enableNotificationsAfterBall')}
          onClose={() => {
            setShowNotificationPrompt(false);
            localStorage.setItem('has_seen_notification_prompt_after_ball', 'true');
          }}
          showCloseButton={true}
        />
      )}

      <ToyConstructor onSave={handleSave} userId={userId} />
    </div>
  );
}
