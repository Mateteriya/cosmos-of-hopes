'use client';

/**
 * Главная страница - Виртуальная ёлка
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import VirtualTree from '@/components/tree/VirtualTree';
import BallDetailsModal from '@/components/tree/BallDetailsModal';
import { getToysOnVirtualTree, getToysOnTree, hasUserLikedAnyBall, addSupport, getToyLikesCount } from '@/lib/toys';
import { getRoomById, getUserRooms, joinRoomByInviteCode } from '@/lib/rooms';
import type { Toy } from '@/types/toy';
import type { Room } from '@/types/room';
import RoomCard from '@/components/rooms/RoomCard';
import CreateRoomModal from '@/components/rooms/CreateRoomModal';
import JoinRoomModal from '@/components/rooms/JoinRoomModal';
import { useLanguage } from '@/components/constructor/LanguageProvider';
import { getOrCreateUserId } from '@/lib/userId';
import { useNewYearAnimationController } from '@/components/tree/NewYearAnimationController';

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
  const [isMobile, setIsMobile] = useState(false);
  const [showRoomsPanel, setShowRoomsPanel] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);
  
  // Тип ёлки и путь к модели - только OBJ модель
  const [treeType] = useState<'3d' | 'png'>('3d');
  const [treeModel] = useState<string>('/placewithtree.obj');
  
  // Новогодняя анимация
  const [isNewYearAnimation, setIsNewYearAnimation] = useState(false);
  
  // Контроллер новогодней анимации
  const { isNewYear } = useNewYearAnimationController({
    onNewYearStart: () => {
      console.log('[TreePage] Новый год наступил! Запускаем анимацию');
      setIsNewYearAnimation(true);
    },
  });

  // Определяем мобильное устройство
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Загрузка комнат при открытии панели
  const loadRooms = async () => {
    if (!currentUserId) return;
    try {
      setRoomsLoading(true);
      setRoomsError(null);
      const userRooms = await getUserRooms(currentUserId);
      setRooms(userRooms || []);
    } catch (err: any) {
      console.error('Ошибка загрузки комнат:', err);
      setRoomsError(err.message || 'Не удалось загрузить комнаты');
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    if (showRoomsPanel && currentUserId) {
      loadRooms();
    }
  }, [showRoomsPanel, currentUserId]);

  const handleRoomCreated = async (room: Room) => {
    setRooms(prev => [...prev, room]);
  };

  const handleRoomJoined = (room: Room) => {
    setRooms(prev => {
      if (prev.find(r => r.id === room.id)) {
        return prev;
      }
      return [...prev, room];
    });
  };

  const handleRoomDeleted = () => {
    loadRooms();
  };

  const handleRoomLeft = () => {
    loadRooms();
  };

  const handleRoomClick = (room: Room) => {
    router.push(`/room?room=${room.id}`);
  };

  // Проверяем при монтировании, не наступил ли уже Новый год
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    const date = now.getDate();
    const hours = now.getHours();
    
    // Если уже наступил Новый год (первые 60 минут 1 января 2026), запускаем анимацию
    if (year >= 2026 && month === 0 && date === 1 && hours === 0) {
      console.log('[TreePage] Новый год уже наступил! Запускаем анимацию при загрузке');
      setIsNewYearAnimation(true);
    }
  }, []);

  // Pull-to-refresh для мобильных устройств
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const touchStartScrollY = useRef<number | null>(null);

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
  const prevUserHasLikedRef = useRef<boolean | null>(null);
  useEffect(() => {
    // Если userHasLiked изменился с false на true, перезагружаем шары
    if (userHasLiked && prevUserHasLikedRef.current === false && !currentRoom && currentUserId) {
      console.log('[TreePage] userHasLiked изменился на true, перезагружаем шары для показа своего шара');
      // Небольшая задержка, чтобы убедиться, что состояние обновилось
      const timer = setTimeout(() => {
        loadToys();
      }, 200);
      return () => clearTimeout(timer);
    }
    // Если userHasLiked уже true при первой загрузке (после обновления страницы), перезагружаем шары
    if (userHasLiked && prevUserHasLikedRef.current === null && !currentRoom && currentUserId) {
      console.log('[TreePage] userHasLiked = true при первой загрузке, перезагружаем шары для показа своего шара');
      const timer = setTimeout(() => {
        loadToys();
      }, 300);
      prevUserHasLikedRef.current = userHasLiked;
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
      console.log('[TreePage] Проверка лайков:', { hasLiked, currentUserId, previousState: userHasLiked });
      setUserHasLiked(hasLiked);
    } catch (err) {
      console.error('Ошибка проверки лайков:', err);
    }
  };

  const handleBallClick = (toy: Toy) => {
    // Не открываем модальное окно для тестовых шаров
    if (toy.id.startsWith('test-ball-')) {
      return;
    }
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

  // Обработчики для pull-to-refresh (только для мобильных)
  const handleTouchStart = (e: React.TouchEvent) => {
    // Проверяем, что это мобильное устройство и страница вверху
    if (typeof window !== 'undefined' && window.scrollY === 0 && window.innerWidth < 768) {
      const target = e.target as HTMLElement;
      // Не активируем pull-to-refresh если касаемся интерактивных элементов
      if (target.closest('button') || target.closest('a') || target.closest('[data-interactive]')) {
        return;
      }
      touchStartY.current = e.touches[0].clientY;
      touchStartScrollY.current = window.scrollY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Только для мобильных
    if (typeof window === 'undefined' || window.innerWidth >= 768) return;
    
    // Проверяем, не касаемся ли мы кнопки или другого интерактивного элемента
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[data-interactive]')) {
      // Если касаемся кнопки, сбрасываем pull и не блокируем события
      setPullDistance(0);
      setIsPulling(false);
      touchStartY.current = null;
      return;
    }
    
    if (!isPulling || touchStartY.current === null) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY.current;
    
    // Разрешаем pull только если страница вверху и тянем вниз
    if (window.scrollY === 0 && distance > 0) {
      // Ограничиваем максимальное расстояние
      const maxDistance = 100;
      const clampedDistance = Math.min(distance, maxDistance);
      setPullDistance(clampedDistance);
      
      // Предотвращаем прокрутку страницы во время pull
      if (clampedDistance > 10) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = () => {
    // Только для мобильных
    if (typeof window === 'undefined' || window.innerWidth >= 768) {
      touchStartY.current = null;
      touchStartScrollY.current = null;
      return;
    }
    
    if (pullDistance > 50 && !isRefreshing) {
      // Запускаем обновление
      setIsRefreshing(true);
      setPullDistance(0);
      
      // Обновляем страницу
      loadToys();
      if (!currentRoom) {
        checkUserLikes();
      }
      
      // Сбрасываем состояние через небольшую задержку
      setTimeout(() => {
        setIsRefreshing(false);
        setIsPulling(false);
      }, 1000);
    } else {
      // Сбрасываем pull
      setPullDistance(0);
      setIsPulling(false);
    }
    touchStartY.current = null;
    touchStartScrollY.current = null;
  };

  return (
    <div 
      className="relative w-full" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        width: '100%', 
        height: '100%',
        display: 'flex',
        flexDirection: 'row'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Виртуальная ёлка - рендерим ПЕРЕД кнопками, чтобы кнопки были поверх */}
      <div 
        style={{ 
          width: showRoomsPanel && !isMobile ? '30%' : '100%',
          height: '100%',
          transition: 'width 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
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
            isNewYearAnimation={isNewYearAnimation}
            isNarrowContainer={showRoomsPanel && !isMobile}
            onAnimationComplete={() => {
              console.log('[TreePage] Анимация завершена');
              // Анимация завершена, можно оставить состояние или сбросить
              // Для тестирования автоматически сбрасываем через некоторое время
              setTimeout(() => {
                setIsNewYearAnimation(false);
                console.log('[TreePage] Анимация сброшена для повторного тестирования');
              }, 5000); // Сбрасываем через 5 секунд после завершения
            }}
          />
        )}
        
        {/* Кнопка "ВКЛЮЧИТЬ анимацию" - внутри контейнера ёлки, двигается вместе с ней */}
        <div 
          className="mobile-nav-buttons"
          style={{ 
            position: 'absolute',
            top: '1rem',
            right: '1rem', // Всегда справа внутри контейнера ёлки
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            pointerEvents: 'auto',
            zIndex: 100003
          }}
        >
          {/* Кнопка "ВКЛЮЧИТЬ анимацию" - активна с 1-го января 2026 */}
          {(() => {
            // Проверяем, наступил ли Новый год (1 января 2026 или позже)
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth(); // 0-11
            const date = now.getDate();
            
            // Кнопка активна с 1-го января 2026 или в режиме разработки
            const isNewYearTime = year >= 2026 && (year > 2026 || month > 0 || date >= 1);
            const isButtonEnabled = isNewYearTime || process.env.NODE_ENV !== 'production';
            
            return (
              <button
                onClick={() => {
                  if (!isButtonEnabled) return;
                  
                  // Переключаем анимацию вкл/выкл
                  setIsNewYearAnimation(!isNewYearAnimation);
                  console.log(`[TreePage] ${!isNewYearAnimation ? 'Включение' : 'Выключение'} новогодней анимации`);
                }}
                disabled={!isButtonEnabled}
                className="mobile-nav-btn mobile-btn-animation"
                style={isMobile ? {} : { 
                  background: isButtonEnabled 
                    ? (isNewYearAnimation 
                        ? 'linear-gradient(to right, #16a34a, #22c55e)' 
                        : 'linear-gradient(to right, #ca8a04, #ea580c)')
                    : 'linear-gradient(to right, #6b7280, #4b5563)',
                  color: 'white',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  cursor: isButtonEnabled ? 'pointer' : 'not-allowed',
                  boxShadow: isButtonEnabled ? '0 4px 6px rgba(0, 0, 0, 0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  pointerEvents: 'auto',
                  position: 'relative',
                  zIndex: 100004,
                  opacity: isButtonEnabled ? 1 : 0.5,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile && isButtonEnabled) {
                    e.currentTarget.style.background = isNewYearAnimation
                      ? 'linear-gradient(to right, #15803d, #16a34a)'
                      : 'linear-gradient(to right, #a16207, #c2410c)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile && isButtonEnabled) {
                    e.currentTarget.style.background = isNewYearAnimation
                      ? 'linear-gradient(to right, #16a34a, #22c55e)'
                      : 'linear-gradient(to right, #ca8a04, #ea580c)';
                  }
                }}
                title={isButtonEnabled 
                  ? (isNewYearAnimation ? 'Выключить новогоднюю анимацию' : 'Включить новогоднюю анимацию')
                  : 'Анимация будет доступна 1-го января в 00:00'}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  {isNewYearAnimation ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  )}
                </svg>
                <span className="btn-text">{isNewYearAnimation ? 'ВЫКЛ анимацию' : 'ВКЛ анимацию'}</span>
              </button>
            );
          })()}
        </div>
      </div>

      {/* Панель комнат - только на ПК */}
      {showRoomsPanel && !isMobile && (
        <div 
          style={{
            width: '70%',
            height: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(12px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            borderLeft: '2px solid rgba(255, 255, 255, 0.1)',
            zIndex: 100001
          }}
        >
          <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Заголовок и кнопка закрытия */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {t('myRooms')}
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Создайте комнату для семьи или друзей, чтобы вместе украшать ёлку
                </p>
              </div>
              <button
                onClick={() => setShowRoomsPanel(false)}
                style={{
                  backgroundColor: 'rgba(100, 116, 139, 0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(100, 116, 139, 0.5)';
                }}
              >
                ✕ Закрыть
              </button>
            </div>

            {/* Кнопки действий */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setShowCreateRoomModal(true)}
                style={{
                  flex: 1,
                  background: 'linear-gradient(to right, #9333ea, #ec4899)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
                }}
              >
                ➕ Создать комнату
              </button>
              <button
                onClick={() => setShowJoinRoomModal(true)}
                style={{
                  flex: 1,
                  background: 'linear-gradient(to right, #2563eb, #06b6d4)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
                }}
              >
                🔗 Присоединиться по коду
              </button>
            </div>

            {/* Ошибка */}
            {roomsError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                color: 'rgb(254, 202, 202)',
                marginBottom: '1.5rem'
              }}>
                {roomsError}
              </div>
            )}

            {/* Список комнат */}
            {roomsLoading ? (
              <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>
                {t('loadingRooms')}
              </div>
            ) : rooms.length === 0 ? (
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                backdropFilter: 'blur(12px)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.75rem',
                padding: '2rem',
                textAlign: 'center'
              }}>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                  У вас пока нет комнат
                </p>
                <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                  Создайте комнату или присоединитесь к существующей по коду приглашения
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem'
              }}>
                {rooms.map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    currentUserId={currentUserId}
                    onRoomClick={handleRoomClick}
                    onRoomDeleted={handleRoomDeleted}
                    onRoomLeft={handleRoomLeft}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Обертка для области кнопок - гарантирует, что кнопки всегда кликабельны */}
      {/* Кнопка "На главную" - ЛЕВЫЙ ВЕРХНИЙ УГОЛ */}
        <button
          type="button"
          onClick={() => {
          console.log('[TreePage] Клик по кнопке "На главную"');
            router.push('/');
          }}
        className="mobile-nav-btn mobile-btn-home"
          style={{ 
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 100004,
          ...(isMobile ? {} : { 
            backgroundColor: '#1e293b',
            color: 'white',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            pointerEvents: 'auto',
            transition: 'all 0.3s ease'
          })
          }}
          onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.backgroundColor = '#334155';
          }
          }}
          onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.backgroundColor = '#1e293b';
          }
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        <span className="btn-text">{t('home')}</span>
        </button>
      
      {/* Кнопка "Комнаты" - ПРАВЫЙ НИЖНИЙ УГОЛ */}
        <button
          type="button"
          onClick={() => {
          console.log('[TreePage] Клик по кнопке "Комнаты"');
          if (isMobile) {
            // На мобильных - переход на страницу комнат
            router.push('/rooms');
          } else {
            // На ПК - открываем панель комнат
            setShowRoomsPanel(true);
          }
          }}
        className="mobile-nav-btn mobile-btn-rooms mobile-btn-rooms-elliptic"
          style={{ 
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          zIndex: 100004,
          ...(isMobile ? {} : { 
            background: 'linear-gradient(to right, #2563eb, #06b6d4)',
            color: 'white',
            padding: '0.75rem 2.5rem',
            borderRadius: '2rem',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            pointerEvents: 'auto',
            transition: 'all 0.3s ease'
          })
          }}
          onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.background = 'linear-gradient(to right, #1d4ed8, #0891b2)';
          }
          }}
          onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #06b6d4)';
          }
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        <span className="btn-text">{t('rooms')}</span>
        </button>


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

      {/* Pull-to-refresh индикатор */}
      {isPulling && pullDistance > 0 && (
        <div 
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center pointer-events-none"
          style={{ 
            transform: `translateY(${Math.min(pullDistance, 100)}px)`,
            opacity: Math.min(pullDistance / 50, 1)
          }}
        >
          <div className="bg-slate-800/90 backdrop-blur-md rounded-full p-3 shadow-xl border-2 border-white/20">
            {isRefreshing ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Подсказка, если пользователь не лайкнул никого (только для общей ёлки) */}
      {!userHasLiked && !currentRoom && (
        <div className="absolute top-16 right-2 sm:top-20 sm:right-4 z-10 bg-yellow-500/90 backdrop-blur-md text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg shadow-xl border-2 border-yellow-400 max-w-[calc(100vw-5rem)] sm:max-w-none">
          <p className="font-bold text-xs sm:text-sm">{t('likeToSeeYourBall')}</p>
        </div>
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

      {/* Модальные окна для комнат */}
      {showRoomsPanel && !isMobile && (
        <>
          <CreateRoomModal
            isOpen={showCreateRoomModal}
            onClose={() => setShowCreateRoomModal(false)}
            onCreate={handleRoomCreated}
            currentUserId={currentUserId}
          />

          <JoinRoomModal
            isOpen={showJoinRoomModal}
            onClose={() => setShowJoinRoomModal(false)}
            onJoin={handleRoomJoined}
            currentUserId={currentUserId}
          />
        </>
      )}
    </div>
  );
}

// Server component wrapper
export default function TreePage() {
  return <TreePageContent />;
}


