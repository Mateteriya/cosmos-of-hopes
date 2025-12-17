'use client';

/**
 * Главная страница - Виртуальная ёлка
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VirtualTree from '@/components/tree/VirtualTree';
import BallDetailsModal from '@/components/tree/BallDetailsModal';
import { getToysOnVirtualTree, getToysOnTree, hasUserLikedAnyBall, addSupport } from '@/lib/toys';
import { getRoomById } from '@/lib/rooms';
import type { Toy } from '@/types/toy';
import type { Room } from '@/types/room';
import { useLanguage } from '@/components/constructor/LanguageProvider';

// Временный userId для тестирования (позже будет из Telegram)
const TEMP_USER_ID = 'test_user_' + Date.now();

export default function TreePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [toys, setToys] = useState<Toy[]>([]);
  const [selectedToy, setSelectedToy] = useState<Toy | null>(null);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  
  // Тип ёлки и путь к модели/изображению
  const [treeType, setTreeType] = useState<'3d' | 'png'>('3d');
  const [treeModel, setTreeModel] = useState<string | undefined>(undefined);
  
  // Варианты ёлок из папки public
  const treeOptions = [
    { type: '3d' as const, name: '3D Модель (по умолчанию)', path: undefined },
    { type: 'png' as const, name: '🎬 Видео 3D (dolly-zoom)', path: '/png3d_dolly-zoom-in.mp4' },
    { type: 'png' as const, name: 'tree.png', path: '/tree.png' },
    { type: 'png' as const, name: 'tree 3.png', path: '/tree%203.png' }, // Пробел в URL кодируется как %20
  ];

  // Получаем roomId из URL параметров после монтирования
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setRoomId(params.get('room'));
    }
  }, []);

  useEffect(() => {
    if (roomId !== null) {
      loadRoom();
      loadToys();
    }
  }, [roomId]);

  // Отдельный эффект для проверки лайков (только для общей ёлки)
  useEffect(() => {
    // Для комнат не проверяем лайки - они не нужны
    if (!roomId) {
    checkUserLikes();
    } else {
      // В комнатах всегда разрешаем видеть свои игрушки
      setUserHasLiked(true);
    }
  }, [roomId]);

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
      let loadedToys: Toy[];
      
      console.log('Загрузка игрушек:', { roomId, hasRoom: !!roomId });
      
      if (roomId) {
        // Загружаем игрушки из комнаты
        console.log('Загружаем игрушки для комнаты:', roomId);
        loadedToys = await getToysOnTree(roomId);
      } else {
        // Загружаем общие игрушки (первая порция 1000 шаров)
        console.log('Загружаем общие игрушки');
        loadedToys = await getToysOnVirtualTree(1000, 0);
      }
      
      console.log('Загружено игрушек:', loadedToys.length);
      setToys(loadedToys);
    } catch (err) {
      console.error('Ошибка загрузки шаров:', err);
      setError('Не удалось загрузить шары на ёлке');
    } finally {
      setLoading(false);
    }
  };

  const checkUserLikes = async () => {
    try {
      const hasLiked = await hasUserLikedAnyBall(TEMP_USER_ID);
      setUserHasLiked(hasLiked);
    } catch (err) {
      console.error('Ошибка проверки лайков:', err);
    }
  };

  const handleBallClick = (toy: Toy) => {
    setSelectedToy(toy);
  };

  const handleBallLike = async (toyId: string) => {
    try {
      await addSupport(toyId, TEMP_USER_ID);
      // Обновляем счётчик поддержек локально
      setToys(prevToys =>
        prevToys.map(toy =>
          toy.id === toyId
            ? { ...toy, support_count: (toy.support_count || 0) + 1 }
            : toy
        )
      );
      // Проверяем, лайкнул ли пользователь теперь
      await checkUserLikes();
    } catch (err) {
      console.error('Ошибка добавления поддержки:', err);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Загрузка ёлки...</div>
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
    <div className="relative w-full h-screen">
      {/* Кнопки навигации */}
      <div className="absolute top-4 left-4 z-10 flex gap-3">
        {/* Кнопка создания игрушки показывается только для общей ёлки, не для комнат */}
        {!currentRoom && (
        <button
          onClick={() => router.push('/constructor')}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-6 py-3 rounded-lg shadow-xl transition-all transform hover:scale-105"
        >
          ✨ {t('magicWand')} ✨
          </button>
        )}
        <button
          onClick={() => router.push('/rooms')}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold px-6 py-3 rounded-lg shadow-xl transition-all transform hover:scale-105"
        >
          🏠 Комнаты
        </button>
      </div>

      {/* Информация о комнате */}
      {currentRoom && (
        <div className="absolute top-4 right-4 z-10 bg-blue-600/90 backdrop-blur-md text-white px-6 py-3 rounded-lg shadow-xl border-2 border-blue-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">🏠 {currentRoom.name}</span>
            <button
              onClick={() => router.push('/tree')}
              className="text-blue-200 hover:text-white transition-colors text-xs"
              title="Вернуться к общей ёлке"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-blue-200 mt-1">Код: {currentRoom.invite_code}</p>
        </div>
      )}

      {/* Подсказка, если пользователь не лайкнул никого (только для общей ёлки) */}
      {!userHasLiked && !currentRoom && (
        <div className="absolute top-20 right-4 z-10 bg-yellow-500/90 backdrop-blur-md text-white px-6 py-3 rounded-lg shadow-xl border-2 border-yellow-400">
          <p className="font-bold text-sm">{t('likeToSeeYourBall')}</p>
        </div>
      )}

      {/* Селектор вариантов ёлки */}
      <div className={`absolute ${currentRoom ? 'top-20' : 'top-20'} right-4 z-10`}>
        <div className="bg-slate-800/95 backdrop-blur-md border-2 border-white/30 rounded-lg p-3 shadow-xl">
          <div className="text-white font-bold text-sm mb-2 uppercase tracking-wider">
            🌲 Выбор ёлки:
          </div>
          <div className="space-y-1">
            {treeOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  setTreeType(option.type);
                  setTreeModel(option.path);
                }}
                className={`w-full text-left px-3 py-2 rounded text-xs font-semibold transition-all ${
                  treeType === option.type && treeModel === option.path
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                    : 'bg-slate-700/50 text-white/80 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {option.name}
              </button>
            ))}
          </div>
          
          {/* Загрузка своего файла */}
          <label className="mt-2 block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-3 py-2 rounded text-xs text-center cursor-pointer transition-all">
            📁 Загрузить свой файл
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,video/mp4,video/webm,video/mov,.glb"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  // Определяем тип по расширению файла
                  const isVideo = file.type.startsWith('video/') || 
                                 file.name.toLowerCase().endsWith('.mp4') ||
                                 file.name.toLowerCase().endsWith('.webm') ||
                                 file.name.toLowerCase().endsWith('.mov');
                  setTreeType('png'); // Используем 'png' для всех медиа (изображения и видео)
                  setTreeModel(url);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Виртуальная ёлка */}
      <VirtualTree
        toys={toys}
        currentUserId={TEMP_USER_ID}
        onBallClick={handleBallClick}
        onBallLike={handleBallLike}
        userHasLiked={userHasLiked}
        isRoom={!!currentRoom}
        treeType={treeType}
        treeModel={treeModel}
      />

      {/* Модальное окно с деталями шара */}
      <BallDetailsModal toy={selectedToy} onClose={() => setSelectedToy(null)} />
    </div>
  );
}


