'use client';

/**
 * Главная страница - Виртуальная ёлка
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import VirtualTree from '@/components/tree/VirtualTree';
import BallDetailsModal from '@/components/tree/BallDetailsModal';
import { getToysOnVirtualTree, getToysOnTree, hasUserLikedAnyBall, addSupport, getToyLikesCount } from '@/lib/toys';
import { getRoomById } from '@/lib/rooms';
import type { Toy } from '@/types/toy';
import type { Room } from '@/types/room';
import { useLanguage } from '@/components/constructor/LanguageProvider';
import { getOrCreateUserId } from '@/lib/userId';

function TreePageContent() {
  const router = useRouter();
  const { t } = useLanguage();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [roomId, setRoomId] = useState<string | null | undefined>(undefined);
  const [toys, setToys] = useState<Toy[]>([]);
  const [selectedToy, setSelectedToy] = useState<Toy | null>(null);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  
  // Тип ёлки и путь к модели - только OBJ модель
  const [treeType] = useState<'3d' | 'png'>('3d');
  const [treeModel] = useState<string>('/placewithtree.obj');

  // Тестовый "Новый год" для проверки анимации (пока выключен)

  // Инициализация userId
  useEffect(() => {
    const initUserId = async () => {
      if (typeof window !== 'undefined') {
        const userId = await getOrCreateUserId();
        setCurrentUserId(userId);
      }
    };
    initUserId();
  }, []);

  // Получаем roomId из URL параметров после монтирования
  useEffect(() => {
    console.log('[TreePage] Монтирование компонента');
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      console.log('[TreePage] roomId из URL:', roomParam);
      setRoomId(roomParam);
    }
  }, []);

  useEffect(() => {
    // Загружаем данные после того, как roomId определён (может быть null для общей ёлки)
    // undefined означает, что мы ещё не проверили URL
    console.log('[TreePage] roomId изменился:', roomId);
    if (roomId !== undefined) {
      console.log('[TreePage] Запускаем загрузку данных');
      loadRoom();
      loadToys();
    }
  }, [roomId]);

  // Тестовый запуск новогодней анимации через таймер (временно отключён)
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setIsTestNewYear(true);
  //   }, 10000);
  //   return () => clearTimeout(timer);
  // }, []);

  // Отдельный эффект для проверки лайков (только для общей ёлки)
  useEffect(() => {
    // Ждём, пока roomId определён (может быть null для общей ёлки) и userId установлен
    if (roomId === undefined || !currentUserId) return;
    
    // Для комнат не проверяем лайки - они не нужны
    if (roomId === null) {
      checkUserLikes();
    } else {
      // В комнатах всегда разрешаем видеть свои игрушки
      setUserHasLiked(true);
    }
  }, [roomId, currentUserId]);

  // Перезагружаем шары когда userHasLiked меняется с false на true
  const prevUserHasLikedRef = useRef(false);
  useEffect(() => {
    // Если userHasLiked изменился с false на true, перезагружаем шары
    if (userHasLiked && !prevUserHasLikedRef.current && !currentRoom && currentUserId) {
      console.log('[TreePage] userHasLiked изменился на true, перезагружаем шары для показа своего шара');
      // Небольшая задержка, чтобы убедиться, что состояние обновилось
      const timer = setTimeout(() => {
        loadToys();
      }, 200);
      return () => clearTimeout(timer);
    }
    prevUserHasLikedRef.current = userHasLiked;
  }, [userHasLiked, currentRoom, currentUserId]);

  const loadRoom = async () => {
    if (roomId) {
      try {
        const room = await getRoomById(roomId);
        setCurrentRoom(room);
      } catch (err) {
        console.error('Ошибка загрузки комнаты:', err);
      }
    } else {
      setCurrentRoom(null);
    }
  };

  const loadToys = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[TreePage] Загрузка игрушек:', { roomId, hasRoom: !!roomId });
      
      // Добавляем таймаут для запроса
      const loadPromise = roomId 
        ? getToysOnTree(roomId)
        : getToysOnVirtualTree(1000, 0);
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Таймаут загрузки (30 секунд)')), 30000)
      );
      
      const loadedToys = await Promise.race([loadPromise, timeoutPromise]);
      
      console.log('[TreePage] Загружено игрушек:', loadedToys.length);
      setToys(loadedToys);
    } catch (err) {
      console.error('[TreePage] Ошибка загрузки шаров:', err);
      setError(`Не удалось загрузить шары на ёлке: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkUserLikes = async () => {
    if (!currentUserId) return;
    try {
      const hasLiked = await hasUserLikedAnyBall(currentUserId);
      console.log('[TreePage] Проверка лайков:', { hasLiked, currentUserId });
      setUserHasLiked(hasLiked);
    } catch (err) {
      console.error('Ошибка проверки лайков:', err);
    }
  };

  const handleBallClick = (toy: Toy) => {
    setSelectedToy(toy);
  };

  const handleBallLike = async (toyId: string) => {
    if (!currentUserId) return;
    try {
      await addSupport(toyId, currentUserId);
      // Обновляем счётчик поддержек локально
      const newLikesCount = await getToyLikesCount(toyId);
      setToys(prevToys =>
        prevToys.map(toy =>
          toy.id === toyId
            ? { ...toy, support_count: newLikesCount }
            : toy
        )
      );
      
      // Проверяем, лайкнул ли пользователь теперь
      const hasLiked = await hasUserLikedAnyBall(currentUserId);
      console.log('[TreePage] После лайка - проверка:', { hasLiked, currentUserId, previousState: userHasLiked });
      
      // Если это первый лайк (было false, стало true), перезагружаем шары
      const wasFalseNowTrue = !userHasLiked && hasLiked;
      
      // Обновляем состояние
      setUserHasLiked(hasLiked);
      
      // Если это был первый лайк, перезагружаем шары для показа своего шара
      if (wasFalseNowTrue && !currentRoom && currentUserId) {
        console.log('[TreePage] Первый лайк! Перезагружаем шары для показа своего шара');
        // Небольшая задержка, чтобы состояние успело обновиться
        setTimeout(() => {
          loadToys();
        }, 300);
      }
    } catch (err) {
      console.error('Ошибка добавления поддержки:', err);
    }
  };

  const handleLikeChange = (toyId: string, newLikesCount: number) => {
    // Обновляем локальное состояние после изменения лайка в модальном окне
    setToys(prevToys =>
      prevToys.map(toy =>
        toy.id === toyId
          ? { ...toy, support_count: newLikesCount }
          : toy
      )
    );
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">{t('loadingTree')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}>
      {/* Кнопки навигации */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 flex flex-wrap gap-2 sm:gap-3">
        <button
          onClick={() => router.push('/')}
          className="bg-slate-700/90 hover:bg-slate-600 text-white font-bold px-3 sm:px-4 py-2 rounded-lg shadow-xl transition-all transform hover:scale-105 text-xs sm:text-sm"
        >
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {t('home')}
        </button>
        {/* Кнопка создания игрушки показывается только для общей ёлки, не для комнат */}
        {!currentRoom && (
        <button
          onClick={() => router.push('/create')}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-3 sm:px-6 py-2 sm:py-3 rounded-lg shadow-xl transition-all transform hover:scale-105 text-xs sm:text-base flex items-center gap-1.5 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <span className="hidden sm:inline">{t('magicWand')}</span>
        </button>
        )}
        <button
          onClick={() => router.push('/rooms')}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold px-3 sm:px-6 py-2 sm:py-3 rounded-lg shadow-xl transition-all transform hover:scale-105 text-xs sm:text-base flex items-center gap-1.5 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="hidden sm:inline">{t('rooms')}</span>
        </button>
      </div>

      {/* Информация о комнате */}
      {currentRoom && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-blue-600/90 backdrop-blur-md text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg shadow-xl border-2 border-blue-400 max-w-[calc(100vw-5rem)] sm:max-w-none">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-xs sm:text-sm truncate flex items-center gap-1.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {currentRoom.name}
            </span>
            <button
              onClick={() => router.push('/tree')}
              className="text-blue-200 hover:text-white transition-colors text-xs sm:text-sm touch-manipulation flex-shrink-0"
              title={t('backToTree')}
            >
              ✕
            </button>
          </div>
          <p className="text-[10px] sm:text-xs text-blue-200 mt-1">Код: {currentRoom.invite_code}</p>
        </div>
      )}

      {/* Подсказка, если пользователь не лайкнул никого (только для общей ёлки) */}
      {!userHasLiked && !currentRoom && (
        <div className="absolute top-16 right-2 sm:top-20 sm:right-4 z-10 bg-yellow-500/90 backdrop-blur-md text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg shadow-xl border-2 border-yellow-400 max-w-[calc(100vw-5rem)] sm:max-w-none">
          <p className="font-bold text-xs sm:text-sm">{t('likeToSeeYourBall')}</p>
        </div>
      )}

      {/* Виртуальная ёлка */}
      {currentUserId && (
        <VirtualTree
          toys={toys}
          currentUserId={currentUserId}
          onBallClick={handleBallClick}
          onBallLike={handleBallLike}
          userHasLiked={userHasLiked}
          isRoom={!!currentRoom}
          treeType={treeType}
          treeModel={treeModel}
          isNewYearAnimation={false}
          onAnimationComplete={() => {}}
        />
      )}

      {/* Модальное окно с деталями шара */}
      {currentUserId && (
        <BallDetailsModal 
          toy={selectedToy} 
          onClose={() => setSelectedToy(null)}
          currentUserId={currentUserId}
          onLikeChange={handleLikeChange}
        />
      )}
    </div>
  );
}

// Server component wrapper
export default function TreePage() {
  return <TreePageContent />;
}


