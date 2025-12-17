'use client';

/**
 * Виртуальная ёлка - главный экран приложения
 * 3D сцена с ёлкой, украшенной шарами со всего мира
 */

import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Toy } from '@/types/toy';

interface VirtualTreeProps {
  toys: Toy[];
  currentUserId?: string;
  onBallClick?: (toy: Toy) => void;
  onBallLike?: (toyId: string) => Promise<void>;
  userHasLiked?: boolean; // Проверка, лайкнул ли пользователь хотя бы один шар
  isRoom?: boolean; // Флаг, что это комната (для комнат всегда показываем все игрушки)
  treeImageUrl?: string; // URL изображения ёлки из FusionBrain AI (опционально)
  treeType?: '3d' | 'png'; // Тип ёлки
  treeModel?: string; // Путь к модели (для GLB) или изображению (для PNG)
}

// Компонент одного шара на ёлке (оптимизирован для производительности)
function BallOnTree({
  toy,
  position,
  isUserBall,
  onClick,
  onLike,
  distance,
}: {
  toy: Toy;
  position: [number, number, number];
  isUserBall: boolean;
  onClick: () => void;
  onLike: () => void;
  distance: number; // Расстояние от камеры для LOD
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  
  // Позиция крепления ниточки (на поверхности ёлки, выше шара)
  const stringStart: [number, number, number] = useMemo(() => {
    // Вычисляем точку на поверхности ёлки выше шара
    const treeRadius = Math.sqrt(position[0] ** 2 + position[2] ** 2);
    const treeY = position[1];
    const angle = Math.atan2(position[2], position[0]);
    
    // Позиция на поверхности ёлки (выше шара, ближе к центру)
    // Учитываем, что ёлка масштабирована x2
    const stringY = treeY + 0.8; // Выше шара
    const stringRadius = treeRadius * 0.7; // Ближе к центру (на поверхности ёлки)
    
    return [
      Math.cos(angle) * stringRadius,
      stringY,
      Math.sin(angle) * stringRadius,
    ];
  }, [position]);

  // LOD: упрощаем геометрию для дальних шаров
  const segments = useMemo(() => {
    if (distance > 10) return 8; // Очень далеко - минимальная детализация
    if (distance > 5) return 16; // Далеко - средняя детализация
    return 32; // Близко - полная детализация
  }, [distance]);

  // Анимация вращения и пульсации (только для видимых/близких шаров)
  useFrame((state) => {
    if (meshRef.current && distance < 15) {
      meshRef.current.rotation.y += 0.01;
      if (isUserBall) {
        // Пульсация для своего шара
        const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  // Загрузка текстуры изображения шара будет через TextureLoader в useEffect
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (toy.image_url) {
      const loader = new THREE.TextureLoader();
      loader.load(
        toy.image_url,
        (loadedTexture) => {
          loadedTexture.flipY = false;
          setTexture(loadedTexture);
        },
        undefined,
        () => {
          setTexture(null);
        }
      );
    } else {
      setTexture(null);
    }
  }, [toy.image_url]);

  const handleClick = (e: any) => {
    e.stopPropagation?.();
    onClick();
  };

  const handleLike = (e: any) => {
    e.stopPropagation?.();
    if (!liked) {
      setLiked(true);
      onLike();
    }
  };

  return (
    <group>
      {/* Ниточка от ёлки к шару - всегда видна для близких шаров */}
      {distance < 20 && (() => {
        const points = [new THREE.Vector3(...stringStart), new THREE.Vector3(...position)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
          color: 0x8B7355, 
          transparent: true,
          opacity: 0.8,
          linewidth: 2
        });
        const line = new THREE.Line(geometry, material);
        return <primitive object={line} key={`string-${toy.id}`} />;
      })()}
      
      {/* Шар */}
      <group position={position}>
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onPointerOver={() => distance < 10 && setHovered(true)}
          onPointerOut={() => setHovered(false)}
          scale={hovered && distance < 10 ? 1.2 : 1}
          frustumCulled={true} // Отключаем рендеринг вне видимости
        >
          <sphereGeometry args={[0.4 * (toy.ball_size || 1), segments, segments]} />
          <meshStandardMaterial
            map={texture || null}
            color={toy.color}
            metalness={toy.surface_type === 'metal' ? 0.8 : 0.1}
            roughness={toy.surface_type === 'matte' ? 0.9 : toy.surface_type === 'glossy' ? 0.2 : 0.5}
            emissive={isUserBall ? '#ffff00' : '#000000'}
            emissiveIntensity={isUserBall ? 0.3 : 0}
          />
        </mesh>
      
      {/* Визуальное выделение своего шара */}
      {isUserBall && (
        <mesh>
          <sphereGeometry args={[0.35 * (toy.ball_size || 1), 32, 32]} />
          <meshStandardMaterial
            color="#ffff00"
            transparent
            opacity={0.3}
            emissive="#ffff00"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}

      {/* Кнопка лайка (если не свой шар и еще не лайкнули) */}
      {!isUserBall && !liked && hovered && (
        <mesh position={[0, 0.5, 0]} onClick={handleLike}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" emissiveIntensity={0.5} />
        </mesh>
      )}

        {/* Счётчик поддержек (только для близких шаров) */}
        {toy.support_count && toy.support_count > 0 && distance < 5 && (
          <Text
            position={[0, -0.6, 0]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            ❤️ {toy.support_count}
          </Text>
        )}
      </group>
    </group>
  );
}

// Компонент ёлки из изображения или видео - используем Billboard (профессиональная техника)
// Billboard - плоскость, всегда повёрнутая к камере (стандарт в 3D графике)
// Поддерживает как изображения (PNG, JPG), так и видео (MP4, WebM)
function ImageTree({ imageUrl, camera }: { imageUrl: string; camera: THREE.Camera }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [aspectRatio, setAspectRatio] = useState(1);
  const meshRef = useRef<THREE.Mesh>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isVideo = imageUrl.toLowerCase().endsWith('.mp4') || imageUrl.toLowerCase().endsWith('.webm') || imageUrl.toLowerCase().endsWith('.mov');

  useEffect(() => {
    if (isVideo) {
      // Загружаем видео
      const video = document.createElement('video');
      video.src = imageUrl;
      video.crossOrigin = 'anonymous';
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      
      video.addEventListener('loadedmetadata', () => {
        setAspectRatio(video.videoWidth / video.videoHeight);
        video.play().catch(console.error);
        
        // Создаём VideoTexture
        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.format = THREE.RGBAFormat;
        setTexture(videoTexture);
      });
      
      videoRef.current = video;
      
      return () => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.src = '';
          videoRef.current = null;
        }
        if (texture) {
          texture.dispose();
        }
      };
    } else {
      // Загружаем изображение
      const loader = new THREE.TextureLoader();
      loader.load(
        imageUrl,
        (loadedTexture) => {
          loadedTexture.flipY = false;
          if (loadedTexture.image) {
            const img = loadedTexture.image as HTMLImageElement;
            if (img.width && img.height) {
        setAspectRatio(img.width / img.height);
      }
    }
          setTexture(loadedTexture);
        },
        undefined,
        (error) => {
          console.error('Ошибка загрузки изображения:', error);
        }
      );
    }
  }, [imageUrl, isVideo]);

  // Обновляем видео текстуру каждый кадр
  useFrame(() => {
    if (texture && texture instanceof THREE.VideoTexture && videoRef.current) {
      if (videoRef.current.readyState >= videoRef.current.HAVE_CURRENT_DATA) {
        texture.needsUpdate = true;
      }
    }
  });

  // Billboard эффект: плоскость всегда смотрит на камеру
  useFrame(() => {
    if (meshRef.current && camera) {
      // Получаем позицию плоскости
      const position = new THREE.Vector3();
      meshRef.current.getWorldPosition(position);
      
      // Вычисляем направление от плоскости к камере
      const direction = new THREE.Vector3();
      direction.subVectors(camera.position, position).normalize();
      
      // Поворачиваем плоскость так, чтобы она смотрела на камеру
      // Используем lookAt для правильной ориентации
      const up = new THREE.Vector3(0, 1, 0);
      const matrix = new THREE.Matrix4();
      matrix.lookAt(position, camera.position, up);
      meshRef.current.rotation.setFromRotationMatrix(matrix);
    }
  });

  // Вычисляем размер с сохранением пропорций
  const height = 25;
  const width = height * aspectRatio;

  if (!texture) {
    return null; // Пока загружается
  }

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[width, height]} />
          <meshStandardMaterial 
            map={texture} 
            transparent={true}
            side={THREE.DoubleSide}
        alphaTest={0.1}
        depthWrite={false}
          />
        </mesh>
  );
}

// Компонент ёлки (идеальная визуализация) - используется если нет изображения
function ChristmasTree3D() {
  const treeRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (treeRef.current) {
      // Медленное вращение ёлки
      treeRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={treeRef} scale={[2, 2, 2]}>
      {/* Ствол - увеличенный и более реалистичный */}
      <mesh position={[0, -4, 0]}>
        <cylinderGeometry args={[0.6, 0.8, 4, 16]} />
        <meshStandardMaterial color="#5C4033" roughness={0.9} />
      </mesh>

      {/* Ярусы ёлки (конусы) - увеличенные и более реалистичные */}
      {[0, 1, 2, 3, 4, 5].map((tier, i) => {
        const radius = 5 - i * 0.7; // Больший радиус основания
        const height = 2.2; // Выше ярусы
        const yPos = -4 + i * 2.2; // Больше расстояние между ярусами
        
        return (
          <group key={i}>
            <mesh position={[0, yPos, 0]}>
              <coneGeometry args={[radius, height, 32]} />
              <meshStandardMaterial 
                color={i === 0 ? "#0d5a0d" : i === 1 ? "#1a7a1a" : i === 2 ? "#228B22" : i === 3 ? "#2d9d2d" : i === 4 ? "#32b832" : "#3dd33d"}
                emissive={i === 0 ? "#0a4a0a" : i === 1 ? "#0d5a0d" : "#0f6a0f"}
                emissiveIntensity={0.4}
                roughness={0.6}
                metalness={0.1}
              />
            </mesh>
            
            {/* Дополнительные ветки для объема */}
            {i < 5 && [0, 1, 2, 3, 4, 5].map((branch) => {
              const angle = (branch / 6) * Math.PI * 2;
              const branchRadius = radius * 0.85;
              const branchX = Math.cos(angle) * branchRadius;
              const branchZ = Math.sin(angle) * branchRadius;
              const branchY = yPos + height * 0.3;
              
              return (
                <mesh key={branch} position={[branchX, branchY, branchZ]} rotation={[0, angle, 0]}>
                  <coneGeometry args={[0.3, 0.8, 8]} />
                  <meshStandardMaterial 
                    color="#228B22"
                    emissive="#0d5a0d"
                    emissiveIntensity={0.2}
                    roughness={0.7}
                  />
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* Звезда на верхушке - красивая классическая звезда */}
      <group position={[0, 7.5, 0]}>
        {/* Центральная часть звезды (сфера) */}
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial 
            color="#FFD700" 
            emissive="#FFD700" 
            emissiveIntensity={1.2}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        
        {/* Верхние лучи звезды (5 лучей) */}
        {[0, 1, 2, 3, 4].map((ray) => {
          const angle = (ray / 5) * Math.PI * 2;
          const rayLength = 1.2;
          return (
            <mesh 
              key={`top-${ray}`} 
              position={[0, 0.3, 0]} 
              rotation={[0, angle, Math.PI / 6]}
            >
              <coneGeometry args={[0.15, rayLength, 3]} />
              <meshStandardMaterial 
                color="#FFD700" 
                emissive="#FFD700" 
                emissiveIntensity={1.5}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
          );
        })}
        
        {/* Нижние короткие лучи (5 лучей) */}
        {[0, 1, 2, 3, 4].map((ray) => {
          const angle = (ray / 5) * Math.PI * 2 + Math.PI / 5;
          return (
            <mesh 
              key={`bottom-${ray}`} 
              position={[0, -0.2, 0]} 
              rotation={[0, angle, -Math.PI / 6]}
            >
              <coneGeometry args={[0.12, 0.6, 3]} />
              <meshStandardMaterial 
                color="#FFD700" 
                emissive="#FFD700" 
                emissiveIntensity={1.3}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
          );
        })}
        
        {/* Свечение вокруг звезды */}
        <mesh>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshStandardMaterial 
            color="#FFD700" 
            emissive="#FFD700" 
            emissiveIntensity={0.6}
            transparent
            opacity={0.4}
          />
        </mesh>
      </group>
    </group>
  );
}

// Основной компонент сцены (оптимизирован для миллионов шаров)
function TreeScene({ toys, currentUserId, onBallClick, onBallLike, userHasLiked, treeImageUrl, treeType, treeModel }: VirtualTreeProps) {
  const { camera } = useThree();
  const [visibleToys, setVisibleToys] = useState<Toy[]>([]);

  useEffect(() => {
    // Камера дальше, чтобы видеть увеличенную ёлку
    camera.position.set(0, 2, 18);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Виртуализация: отображаем только видимые шары (в пределах frustum)
  // Но для начала показываем все шары (пока их мало)
  useFrame(() => {
    // Если шаров мало (меньше 100), показываем все
    if (toys.length < 100) {
      setVisibleToys(toys);
      return;
    }
    
    // Для большого количества шаров используем frustum culling
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matrix);

    // Фильтруем шары, которые находятся в видимой области
    const visible: Array<{ toy: Toy; index: number; distance: number }> = [];
    
    for (let i = 0; i < toys.length && visible.length < 500; i++) {
      const toy = toys[i];
      const pos = getBallPosition(i);
      const point = new THREE.Vector3(...pos);
      
      if (frustum.containsPoint(point)) {
        const distance = camera.position.distanceTo(point);
        visible.push({ toy, index: i, distance });
      }
    }

    // Сортируем по расстоянию (ближайшие первыми)
    visible.sort((a, b) => a.distance - b.distance);
    
    // Ограничиваем количество одновременно отображаемых шаров (для производительности)
    const maxVisible = 500; // Максимум 500 шаров одновременно
    setVisibleToys(visible.slice(0, maxVisible).map(v => v.toy));
  });

  // Кэш позиций для оптимизации
  const positionCache = useRef(new Map<number, [number, number, number]>());

  // Генерация позиций для шаров на ёлке (детерминированная, чтобы позиции не менялись)
  // Позиции распределены по ярусам ёлки и находятся НА ПОВЕРХНОСТИ ёлки
  const getBallPosition = (index: number): [number, number, number] => {
    if (positionCache.current.has(index)) {
      return positionCache.current.get(index)!;
    }
    // Используем детерминированный алгоритм на основе индекса
    const seed = index * 7919; // Простое число для псевдослучайности
    
    // Распределяем по ярусам ёлки (от -4 до 7 по Y, учитывая масштаб ёлки x2)
    const tier = (seed % 6); // 6 ярусов
    const angle = (seed % 360) * (Math.PI / 180);
    
    // Радиус зависит от яруса (верхние ярусы уже)
    // Ёлка масштабирована x2, поэтому радиусы тоже x2
    // Шары должны быть НА поверхности ёлки, не внутри
    const tierRadius = (5 - tier * 0.7); // Радиус яруса
    const baseRadius = tierRadius * 0.92; // 92% от радиуса яруса (на поверхности, чуть выступают)
    const radius = baseRadius + ((seed % 20) / 20) * 0.2; // Небольшое случайное отклонение
    
    // Высота зависит от яруса (учитывая масштаб x2)
    const baseHeight = -4 + tier * 2.2;
    const height = baseHeight + ((seed % 60) / 60) * 1.2; // Небольшое случайное отклонение по высоте
    
    // Позиция на поверхности ёлки (с учетом того, что ёлка - конус)
    const pos: [number, number, number] = [
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius,
    ];
    positionCache.current.set(index, pos);
    return pos;
  };

  // Вычисляем расстояние от камеры для каждого видимого шара
  const getDistance = (position: [number, number, number]): number => {
    const worldPos = new THREE.Vector3(...position);
    return camera.position.distanceTo(worldPos);
  };

  return (
    <>
      {/* Освещение - улучшенное для большой ёлки */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} color="#ffffff" />
      <pointLight position={[0, 8, 0]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-6, 4, 6]} intensity={0.5} color="#ff6b6b" />
      <pointLight position={[6, 4, -6]} intensity={0.5} color="#4ecdc4" />
      <pointLight position={[0, -2, 0]} intensity={0.3} color="#228B22" />

      {/* Ёлка - разные варианты */}
      {treeType === 'png' && treeModel && (
        <Suspense fallback={null}>
          <ImageTree imageUrl={treeModel} camera={camera} />
        </Suspense>
      )}
      {(!treeType || treeType === '3d') && <ChristmasTree3D />}

      {/* Шары на ёлке (только видимые) */}
      {visibleToys.map((toy) => {
        const isUserBall = currentUserId && toy.user_id === currentUserId;
        const originalIndex = toys.findIndex(t => t.id === toy.id);
        const position = getBallPosition(originalIndex);
        const distance = getDistance(position);
        
        return (
          <BallOnTree
            key={toy.id}
            toy={toy}
            position={position}
            isUserBall={!!isUserBall}
            onClick={() => onBallClick?.(toy)}
            onLike={() => onBallLike?.(toy.id)}
            distance={distance}
          />
        );
      })}

      {/* Звёзды на фоне */}
      <Stars radius={100} depth={50} count={5000} factor={4} fade speed={1} />

      {/* Управление камерой - расширенные пределы для большой ёлки */}
      <OrbitControls
        enablePan={false}
        minDistance={10}
        maxDistance={30}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </>
  );
}

// Главный компонент
export default function VirtualTree({
  toys,
  currentUserId,
  onBallClick,
  onBallLike,
  userHasLiked = false,
  isRoom = false,
  treeImageUrl,
  treeType = '3d',
  treeModel,
}: VirtualTreeProps) {
  return (
    <div className="w-full h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <Canvas>
        <Suspense fallback={null}>
          <TreeScene
            toys={isRoom || userHasLiked ? toys : toys.filter(t => t.user_id !== currentUserId)}
            currentUserId={currentUserId}
            onBallClick={onBallClick}
            onBallLike={onBallLike}
            userHasLiked={isRoom || userHasLiked}
            treeImageUrl={treeImageUrl}
            treeType={treeType}
            treeModel={treeModel}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

