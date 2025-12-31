'use client';

/**
 * Виртуальная ёлка - главный экран приложения
 * 3D сцена с ёлкой, украшенной шарами со всего мира
 */

import { Suspense, useRef, useState, useEffect, useLayoutEffect, useMemo, Component, ReactNode } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import type { Toy } from '@/types/toy';
import { TreeSnowflakes } from './TreeSnowflakes';
import { Fireworks } from './Fireworks';
import { Confetti } from './Confetti';
import { NewYearSigns } from './NewYearSigns';
import { WishSigns } from './WishSigns';
import { UserBallParticles } from './UserBallParticles';

// Простой ErrorBoundary для обработки ошибок загрузки MTL
class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('Ошибка загрузки MTL, используем модель без материалов:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Простой компонент падающего снега
// Компонент падающего снега - ПРИМЕНЯЕТСЯ ОДИНАКОВО ДЛЯ ВСЕХ УСТРОЙСТВ (мобильные и десктоп)
function FallingSnow() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 200;
  const positionsRef = useRef<Float32Array>(new Float32Array(count * 3));
  
  const geometry = useMemo(() => new THREE.SphereGeometry(0.15, 8, 8), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9
  }), []);
  
  // Инициализация позиций - равномерное распределение по всей области
  // Инициализируем только один раз при монтировании
  // Работает одинаково на всех устройствах - непрерывный поток снега
  useEffect(() => {
    const pos = positionsRef.current;
    for (let i = 0; i < count; i++) {
      // Равномерное распределение X и Z по всей области (от -50 до 50) - НЕ изменяются при падении
      pos[i * 3] = (Math.random() - 0.5) * 100; // X - фиксированная позиция
      // Равномерное распределение Y по всей высоте (от -50 до 150) - для непрерывного потока
      pos[i * 3 + 1] = -50 + (i / count) * 200; // Y - равномерно распределены по высоте
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100; // Z - фиксированная позиция
    }
    
    // Инициализация матриц
    if (meshRef.current) {
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const matrix = new THREE.Matrix4();
        matrix.setPosition(pos[i3], pos[i3 + 1], pos[i3 + 2]);
        meshRef.current.setMatrixAt(i, matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const positions = positionsRef.current;
    
    // Обновление позиций - ТОЛЬКО вертикальное падение (Y координата)
    // X и Z координаты НЕ ИЗМЕНЯЮТСЯ - снежинки падают строго вертикально по прямой линии
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Падение строго вниз - изменяем ТОЛЬКО Y, X и Z остаются неизменными
      positions[i3 + 1] -= 0.5 * delta * 60;
      
      // Если снежинка упала вниз, возвращаем её наверх с ТЕМИ ЖЕ X и Z
      // Распределяем по высоте, чтобы избежать "порций" - каждая снежинка возвращается на свою уникальную высоту
      if (positions[i3 + 1] < -50) {
        // Возвращаем наверх, но на разную высоту для каждой снежинки (на основе индекса)
        // Это предотвращает одновременный перезапуск всех снежинок
        const offset = (i / count) * 200; // Распределение от 0 до 200
        positions[i3 + 1] = 150 + offset; // Возвращаем на разную высоту
        // X и Z НЕ ТРОГАЕМ - они остаются такими же, как были изначально
      }
      
      const matrix = new THREE.Matrix4();
      // Устанавливаем позицию: X и Z не изменяются (остаются как при инициализации), только Y
      matrix.setPosition(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      meshRef.current.setMatrixAt(i, matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
      renderOrder={100}
    />
  );
}

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
  // Новогодняя анимация (1 января)
  isNewYearAnimation?: boolean; // Флаг для активации анимации слетания шаров
  onAnimationComplete?: () => void; // Callback после завершения анимации
  glowEnabled?: boolean; // Включена ли подсветка ствола (для разработчика)
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
  const groupRef = useRef<THREE.Group>(null);
  const glowMeshRef = useRef<THREE.PointLight>(null);
  const glowMeshSecondLightRef = useRef<THREE.PointLight>(null);
  const glowMeshLayerRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  
  // Позиция крепления ниточки (на поверхности ёлки, к центру)
  const stringStart: [number, number, number] = useMemo(() => {
    // Вычисляем точку на поверхности ёлки ближе к центру (на той же высоте)
    const treeRadius = Math.sqrt(position[0] ** 2 + position[2] ** 2);
    const treeY = position[1];
    const angle = Math.atan2(position[2], position[0]);
    
    // Позиция на поверхности ёлки (к центру, на той же высоте)
    // Смещаемся к центру, но не слишком близко, чтобы нить была видна
    const stringY = treeY; // Та же высота, что и шар
    const stringRadius = Math.max(1.0, treeRadius * 0.5); // 50% от радиуса шара, минимум 1.0 для видимости
    
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

  // Анимация вращения и пульсации
  // ПРИМЕНЯЕТСЯ ОДИНАКОВО ДЛЯ ВСЕХ УСТРОЙСТВ (мобильные и десктоп)
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const ballId = toy.id;
    
    // Уникальная скорость вращения для каждого шара (на основе ID)
    const hash = ballId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Проверяем, является ли шар тестовым (ID начинается с "test-ball-")
    const isTestBall = ballId.startsWith('test-ball-');
    
    // Новое вращение ТОЛЬКО для тестовых шаров
    // Пользовательские шары вращаются как раньше (без этого нового вращения)
    // Поведение одинаково для всех устройств
    if (isTestBall && !isUserBall) {
      // Для тестовых шаров - нормальная скорость
      const speedX = 0.5 + (hash % 100) / 200; // От 0.5 до 1.0
      const speedY = 0.8 + (hash % 150) / 200; // От 0.8 до 1.55
      const speedZ = 0.6 + (hash % 120) / 200; // От 0.6 до 1.2
      
      if (meshRef.current) {
        meshRef.current.rotation.x += delta * speedX;
        meshRef.current.rotation.y += delta * speedY;
        meshRef.current.rotation.z += delta * speedZ;
      }
    }
    // Для пользовательских шаров - убираем новое вращение, они вращаются как раньше
    
    // "Танец" - небольшое покачивание позиции mesh (не группы, чтобы шары не разлетались!)
    if (meshRef.current) {
      const danceAmplitude = 0.02; // Амплитуда покачивания (небольшая)
      const danceSpeed = 1.5 + (hash % 50) / 100; // Уникальная скорость для каждого шара
      const danceX = Math.sin(time * danceSpeed + hash) * danceAmplitude;
      const danceY = Math.cos(time * danceSpeed * 1.3 + hash) * danceAmplitude;
      const danceZ = Math.sin(time * danceSpeed * 0.7 + hash) * danceAmplitude;
      
      // Применяем покачивание к позиции mesh относительно группы (группа остается на месте с position prop)
      meshRef.current.position.set(danceX, danceY, danceZ);
    }
    
    if (meshRef.current && isUserBall) {
        // Для своего шара - пульсация всегда видна, независимо от расстояния
        // Базовый размер увеличен в 1.4 раза, плюс пульсация
        const baseScale = 1.4; // Базовое увеличение размера для своего шара
        const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
        meshRef.current.scale.setScalar(baseScale * pulseScale);
        // Пульсация свечения (для PointLight)
        if (glowMeshRef.current) {
          const light = glowMeshRef.current as THREE.PointLight;
          if (light && light.isPointLight) {
            // Пульсация интенсивности неонового света - ЯРЧЕ!
            const baseIntensity = 10;
            const pulseIntensity = baseIntensity + Math.sin(state.clock.elapsedTime * 3) * 4;
            light.intensity = pulseIntensity;
            
            // Переливание всеми цветами радуги (HSL: hue от 0 до 1) - ЯРКОЕ и БЫСТРОЕ!
            const hue = (state.clock.elapsedTime * 0.5) % 1; // Более быстрое переливание
            const saturation = 1.0; // Максимальная насыщенность
            const lightness = 0.7; // Более яркий цвет (0.7 вместо 0.6)
            
            const rainbowColor = new THREE.Color().setHSL(hue, saturation, lightness);
            light.color.copy(rainbowColor);
          }
          
          // Переливающийся второй свет
          if (glowMeshSecondLightRef.current) {
            const secondLight = glowMeshSecondLightRef.current;
            const baseIntensity2 = 8;
            const pulseIntensity2 = baseIntensity2 + Math.sin(state.clock.elapsedTime * 3 + Math.PI) * 3.5;
            secondLight.intensity = pulseIntensity2;
            
            // Противоположный цвет радуги для эффекта переливания - ЯРКИЙ!
            const hue2 = ((state.clock.elapsedTime * 0.5) + 0.5) % 1; // Сдвиг на 180 градусов, быстрее
            const rainbowColor2 = new THREE.Color().setHSL(hue2, 1.0, 0.7); // Более яркий
            secondLight.color.copy(rainbowColor2);
          }
        }
        
        // Пульсация слоя свечения с переливанием
        if (glowMeshLayerRef.current) {
          const glowScale = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.1;
          glowMeshLayerRef.current.scale.setScalar(glowScale);
          const material = glowMeshLayerRef.current.material as THREE.MeshStandardMaterial;
          if (material) {
            // Переливание цветом радуги - ЯРКОЕ!
            const hue = (state.clock.elapsedTime * 0.5) % 1; // Быстрее
            const rainbowColor = new THREE.Color().setHSL(hue, 1.0, 0.7); // Более яркий
            material.emissive.copy(rainbowColor);
            material.color.copy(rainbowColor);
            material.emissiveIntensity = 3.0 + Math.sin(state.clock.elapsedTime * 4) * 0.8; // Ярче!
          }
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
          loadedTexture.needsUpdate = true; // КРИТИЧЕСКИ ВАЖНО для обновления текстуры
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

  // Проверка: является ли шар центральным в макушке елки
  // Первый шар (index = 0) находится точно в макушке: высота = 7.0, радиус = 0
  const isTopBall = useMemo(() => {
    const radius = Math.sqrt(position[0] ** 2 + position[2] ** 2);
    const height = position[1];
    // Проверяем: высота близка к 7.0 и радиус близок к 0
    return Math.abs(height - 7.0) < 0.1 && radius < 0.1;
  }, [position]);

  // Создаем материал с правильным обновлением при изменении текстуры
  const materialProps = useMemo(() => ({
    map: texture || null,
    color: toy.color, // ВСЕГДА оригинальный цвет пользователя
    metalness: toy.surface_type === 'metal' ? 0.8 : 0.1,
    roughness: toy.surface_type === 'matte' ? 0.9 : toy.surface_type === 'glossy' ? 0.2 : 0.5,
    emissive: '#000000',
    emissiveIntensity: 0,
    side: THREE.DoubleSide,
    transparent: isTopBall,
    opacity: isTopBall ? 0.1 : 1.0,
  }), [texture, toy.color, toy.surface_type, isTopBall]);

  return (
    <group renderOrder={1000}> {/* Выносим шары на передний план - рендерим поверх елки */}
      {/* Шар */}
      <group ref={groupRef} position={position}>
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onPointerOver={() => distance < 10 && setHovered(true)}
          onPointerOut={() => setHovered(false)}
          scale={isUserBall ? 1 : (hovered && distance < 10 ? 1.2 : 1)}
          frustumCulled={false} // ВСЕГДА рендерим все шары, даже если они вне видимости камеры
          renderOrder={1000} // Рендерим поверх елки
        >
          <sphereGeometry args={[0.4 * (toy.ball_size || 1), segments, segments]} />
          <meshStandardMaterial
            key={`material-${toy.id}-${texture ? 'with-texture' : 'no-texture'}`} 
            {...materialProps}
            depthWrite={false} // Отключаем запись глубины, чтобы шары всегда были видны
          />
        </mesh>
      
      {/* 3D подсветка для своего шара - PointLight для реального объемного освещения ВОКРУГ, но НЕ на сам шар */}
      {isUserBall && (
        <>
          {/* Основной неоновый свет - переливается всеми цветами радуги - НЕ освещает сам шар (layer 1) */}
          <pointLight
            ref={glowMeshRef as any}
            position={[0, 0, 0]}
            color="#ff00ff"
            intensity={10}
            distance={12}
            decay={0.8}
            layers={1} // Только слой 1 - не влияет на шар (слой 0)
          />
          {/* Дополнительный свет для переливания - тоже не на шар */}
          <pointLight
            ref={glowMeshSecondLightRef}
            position={[0, 0, 0]}
            color="#00ffff"
            intensity={8}
            distance={10}
            decay={0.9}
            layers={1} // Только слой 1
          />
          {/* Очень тонкое свечение вокруг шара (почти прозрачное) */}
          <mesh ref={glowMeshLayerRef}>
            <sphereGeometry args={[0.42 * (toy.ball_size || 1) * 1.4, 32, 32]} />
          <meshStandardMaterial
              color="#ff00ff"
            transparent
              opacity={0.2}
              emissive="#ff00ff"
              emissiveIntensity={2.0}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          {/* Частицы-звездочки вокруг шарика */}
          <UserBallParticles 
            position={[0, 0, 0]} 
            count={40}
            enabled={true}
          />
        </>
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

// Компонент для загрузки OBJ модели БЕЗ MTL материалов
function OBJTreeWithoutMTL({ objPath, glowEnabled = false, isNewYearAnimation = false, treeOpacity = 1.0, showBlackBackground = false }: { objPath: string; glowEnabled?: boolean; isNewYearAnimation?: boolean; treeOpacity?: number; showBlackBackground?: boolean }) {
  return <OBJTreeContent objPath={objPath} materials={null} glowEnabled={glowEnabled} isNewYearAnimation={isNewYearAnimation} treeOpacity={treeOpacity} showBlackBackground={showBlackBackground} />;
}

// Компонент для загрузки OBJ модели С MTL материалами
function OBJTreeWithMTL({ objPath, mtlPath, glowEnabled = false, isNewYearAnimation = false, treeOpacity = 1.0, showBlackBackground = false }: { objPath: string; mtlPath: string; glowEnabled?: boolean; isNewYearAnimation?: boolean; treeOpacity?: number; showBlackBackground?: boolean }) {
  // Настраиваем путь для загрузки текстур (относительно MTL файла)
  const mtlDir = mtlPath.includes('/') 
    ? mtlPath.substring(0, mtlPath.lastIndexOf('/') + 1) 
    : '/';
  
  // Загружаем материалы из MTL файла
  const materials = useLoader(MTLLoader, mtlPath, (loader) => {
    loader.setPath(mtlDir || '/');
  });
  
  return <OBJTreeContent objPath={objPath} materials={materials} glowEnabled={glowEnabled} isNewYearAnimation={isNewYearAnimation} treeOpacity={treeOpacity} showBlackBackground={showBlackBackground} />;
}

// Основной компонент для загрузки OBJ модели
function OBJTreeContent({ objPath, materials, glowEnabled = false, isNewYearAnimation = false, treeOpacity = 1.0, showBlackBackground = false }: { objPath: string; materials: any; glowEnabled?: boolean; isNewYearAnimation?: boolean; treeOpacity?: number; showBlackBackground?: boolean }) {
  const treeRef = useRef<THREE.Group>(null);
  const meshMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]); // Ссылки на материалы для анимации
  const meshRefs = useRef<THREE.Mesh[]>([]); // Ссылки на меши для управления видимостью
  const originalColorsRef = useRef<THREE.Color[]>([]); // Сохраняем исходные цвета материалов для восстановления
  const originalEmissiveIntensitiesRef = useRef<number[]>([]); // Сохраняем исходные интенсивности свечения для восстановления
  const treeOpacityRef = useRef<number>(treeOpacity); // Ref для реактивного обновления прозрачности
  
  // Обновляем ref при изменении treeOpacity
  useEffect(() => {
    treeOpacityRef.current = treeOpacity;
  }, [treeOpacity]);
  
  const isBallOrStarMaterialRef = useRef<boolean[]>([]); // Отслеживаем, какие материалы принадлежат шарикам или звездам
  const isStarMaterialRef = useRef<boolean[]>([]); // Отслеживаем, какие материалы принадлежат звездам
  const materialColorGroupRef = useRef<('main' | 'dark' | 'shadow')[]>([]); // Сохраняем группу цвета для каждого материала (основной, темная тень, почти черный)
  const materialPositionsRef = useRef<THREE.Vector3[]>([]); // Сохраняем позиции мешей относительно центра елки для вычисления прозрачности
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [center, setCenter] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [modelSize, setModelSize] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const [recalculatedCenter, setRecalculatedCenter] = useState<THREE.Vector3 | null>(null); // Пересчитанный центр после скрытия фона
  const previousRecalculatedCenterRef = useRef<THREE.Vector3 | null>(null); // Сохраняем предыдущий центр для избежания мигания
  const previousModelSizeRef = useRef<THREE.Vector3 | null>(null); // Сохраняем предыдущий размер для избежания мигания
  
  // Загружаем OBJ модель
  const obj = useLoader(OBJLoader, objPath, (loader) => {
    // Применяем материалы к загрузчику OBJ, если они загружены
    if (materials) {
      try {
        materials.preload();
        loader.setMaterials(materials);
      } catch (err) {
        console.warn('Ошибка применения материалов:', err);
      }
    }
  });

  // Клонируем объект и вычисляем правильный масштаб и центр
  const clonedObj = useMemo(() => {
    try {
      const cloned = obj.clone();
      
      // Вычисляем bounding box для центрирования и масштабирования
      // Важно: вычисляем bounding box ДО скрытия объектов, чтобы получить правильный центр
      const box = new THREE.Box3().setFromObject(cloned);
      const size = box.getSize(new THREE.Vector3());
      const centerPoint = box.getCenter(new THREE.Vector3());
      
      // Если центр модели сильно смещен от нуля, это может быть проблемой
      // В таком случае можно принудительно центрировать модель
      
      const maxDimension = Math.max(size.x, size.y, size.z);
      const minDimension = Math.min(size.x, size.y, size.z);
      
      console.log('OBJ модель загружена:', {
        size: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) },
        center: { x: centerPoint.x.toFixed(2), y: centerPoint.y.toFixed(2), z: centerPoint.z.toFixed(2) },
        childrenCount: cloned.children.length,
        maxDimension: maxDimension.toFixed(2),
        minDimension: minDimension.toFixed(2),
        isFlat: minDimension < maxDimension * 0.01, // Модель плоская, если одна из осей очень маленькая
        bottomY: (centerPoint.y - size.y / 2).toFixed(2), // Нижняя точка модели
        topY: (centerPoint.y + size.y / 2).toFixed(2) // Верхняя точка модели
      });
      
      // Вычисляем масштаб на основе высоты (Y), а не максимального размера
      // Для ёлки важна высота, а не общий размер
      const height = size.y;
      let targetHeight = 100; // Целевая высота для ёлки (увеличено еще больше для большей видимости)
      
      // Если модель очень большая, используем больший целевой размер
      if (maxDimension > 1000) {
        // Для моделей размером 2048 используем больший масштаб
        // Чтобы ёлка была видна и пропорциональна шарам
        targetHeight = 90; // Увеличиваем целевую высоту еще больше
      }
      
      // Используем высоту для масштабирования
      const scaleByHeight = height > 0 ? targetHeight / height : 1;
      
      // Используем масштаб по высоте, но ограничиваем максимальный размер
      let finalScale = scaleByHeight;
      
      // Ограничиваем максимальный масштаб, чтобы модель не была слишком большой
      if (finalScale > 5.0) {
        finalScale = 5.0; // Максимальный масштаб (увеличен для больших моделей)
      }
      
      // Если масштаб слишком маленький, используем минимальный
      if (finalScale < 0.01) {
        finalScale = 0.01;
      }
      
      setScale(finalScale);
      setCenter(centerPoint);
      setModelSize(size);
      
      console.log('Масштаб модели:', finalScale.toFixed(4), 'targetHeight:', targetHeight, 'height:', height.toFixed(2), 'maxDimension:', maxDimension.toFixed(2), 'size:', { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) });
      
      return cloned;
    } catch (err) {
      console.error('Ошибка клонирования OBJ модели:', err);
      setError('Ошибка загрузки модели');
      return obj;
    }
  }, [obj]);

  // Применяем базовые материалы, если MTL не загружен или текстуры отсутствуют
  // Используем useLayoutEffect для синхронного обновления размеров и центра модели
  useLayoutEffect(() => {
    if (!clonedObj) {
      return; // Не сбрасываем recalculatedCenter, чтобы избежать мигания при переключении режимов
    }
    
    // Сохраняем текущие значения перед применением материалов
    // чтобы избежать мигания при переключении режимов
    const previousRecalculatedCenter = previousRecalculatedCenterRef.current || recalculatedCenter;
    const previousModelSize = previousModelSizeRef.current || modelSize;
    
    // Очищаем массив материалов перед применением новых
    meshMaterialsRef.current = [];
    originalColorsRef.current = [];
    originalEmissiveIntensitiesRef.current = [];
    isBallOrStarMaterialRef.current = [];
    isStarMaterialRef.current = []; // Инициализируем массив для звезд
      
      let meshCount = 0;
      let replacedCount = 0;
    let ballCount = 0; // Отдельный счетчик для шариков
    let starCount = 0; // Отдельный счетчик для звезд
    let branchCountForLog = 0; // Счетчик веток для логирования
    let branchColorCount = 0; // Отдельный счетчик для веток при выборе цвета (не учитывает шарики и звезды)
    let groupsLogged = false; // Флаг для однократного логирования групп цветов
    const ballCandidates: Array<{ name: string; size: string; aspectRatio: number; height: number; relativeSize: string; geometryType?: string; vertexCount?: number }> = []; // Кандидаты в шарики для диагностики
    
    // Вычисляем максимальный размер модели для относительных размеров
    // Используем предыдущий размер, если текущий еще не вычислен
    const effectiveModelSize = modelSize.y > 0 ? modelSize : (previousModelSize || modelSize);
    let modelMaxSize = 0;
    try {
      modelMaxSize = Math.max(effectiveModelSize.x, effectiveModelSize.y, effectiveModelSize.z);
      // Если размер не вычислен или равен 0, используем fallback
      if (!modelMaxSize || modelMaxSize === 0 || !isFinite(modelMaxSize)) {
        modelMaxSize = 2048; // Fallback к 2048, если размер не вычислен
      }
    } catch (e) {
      modelMaxSize = 2048; // Fallback при ошибке
    }
      
      // Если MTL не загружен (materials === null), заменяем ВСЕ материалы
      const shouldReplaceAll = !materials;
    
    // Палитра градиента для веток ёлки (выносим наружу для логирования)
    // МНОГО оттенков зеленого для плавных переходов и градиента + фиолетово-индиго для эффекта "теней"
    const gradientColors = [
      // Зеленые оттенки - СОЧНЫЙ естественный зеленый цвет елки с плавными переливами
      // Основной цвет елки (естественный зеленый) - более сочный и яркий!
      { h: 140, s: 100, l: 36 },   // Сочный изумрудно-зеленый
      { h: 138, s: 100, l: 37 },   // Сочный изумрудно-зеленый (вариант)
      { h: 137, s: 100, l: 35 },   // Сочный темно-изумрудно-зеленый
      { h: 135, s: 100, l: 36 },   // Сочный изумрудный
      { h: 133, s: 100, l: 37 },   // Сочный светло-изумрудный
      { h: 132, s: 100, l: 35 },   // Сочный темно-изумрудный (вариант)
      { h: 130, s: 100, l: 36 },   // Сочный зелено-бирюзовый
      { h: 128, s: 100, l: 37 },   // Сочный светло-зелено-бирюзовый
      { h: 127, s: 100, l: 38 },   // Сочный зелено-бирюзовый (яркий)
      { h: 125, s: 100, l: 36 },   // Сочный зелено-салатовый
      { h: 123, s: 100, l: 37 },   // Сочный светло-зелено-салатовый
      { h: 122, s: 100, l: 38 },   // Сочный зелено-салатовый (яркий)
      { h: 120, s: 100, l: 37 },   // Сочный темно-зеленый (основной цвет елки)
      { h: 119, s: 100, l: 38 },   // Сочный зеленый (вариант)
      { h: 118, s: 100, l: 39 },   // Сочный светло-зеленый
      { h: 116, s: 100, l: 38 },   // Сочный лесной зеленый
      { h: 115, s: 100, l: 39 },   // Сочный светло-лесной зеленый
      // Темные зеленые (для теней) - БОЛЬШЕ оттенков для плавных переливов!
      { h: 145, s: 100, l: 24 },   // Темный изумрудно-зеленый (тень)
      { h: 143, s: 100, l: 25 },   // Темный изумрудно-зеленый (тень, вариант)
      { h: 142, s: 100, l: 26 },   // Темный изумрудно-зеленый (тень, светлее)
      { h: 140, s: 100, l: 24 },   // Темный изумрудно-зеленый (тень, темнее)
      { h: 138, s: 100, l: 27 },   // Темный изумрудный (тень)
      { h: 135, s: 100, l: 25 },   // Темный изумрудный (тень, вариант)
      { h: 133, s: 100, l: 26 },   // Темный зелено-бирюзовый (тень)
      { h: 132, s: 100, l: 27 },   // Темный зелено-бирюзовый (тень, светлее)
      { h: 130, s: 100, l: 25 },   // Темный зелено-бирюзовый (тень, темнее)
      { h: 129, s: 100, l: 28 },   // Темный зелено-бирюзовый (тень, ярче)
      { h: 127, s: 100, l: 26 },   // Темный зелено-бирюзовый (тень, вариант)
      { h: 125, s: 100, l: 27 },   // Темный зелено-салатовый (тень)
      { h: 124, s: 100, l: 28 },   // Темный зелено-салатовый (тень, светлее)
      { h: 123, s: 100, l: 26 },   // Темный зелено-салатовый (тень, темнее)
      { h: 122, s: 100, l: 29 },   // Темный зелено-салатовый (тень, ярче)
      { h: 121, s: 100, l: 27 },   // Темный темно-зеленый (тень)
      { h: 120, s: 100, l: 28 },   // Темный темно-зеленый (тень, светлее)
      { h: 119, s: 100, l: 29 },   // Темный темно-зеленый (тень, ярче)
      { h: 118, s: 100, l: 27 },   // Темный зеленый (тень)
      { h: 117, s: 100, l: 28 },   // Темный зеленый (тень, светлее)
      { h: 116, s: 100, l: 29 },   // Темный лесной зеленый (тень)
      { h: 115, s: 100, l: 28 },   // Темный лесной зеленый (тень, вариант)
      // ОЧЕНЬ темные зеленые (для глубоких теней между ветками)
      { h: 145, s: 100, l: 18 },   // Очень темный изумрудно-зеленый (глубокая тень)
      { h: 140, s: 100, l: 19 },   // Очень темный изумрудно-зеленый (глубокая тень, вариант)
      { h: 135, s: 100, l: 20 },   // Очень темный изумрудный (глубокая тень)
      { h: 130, s: 100, l: 19 },   // Очень темный зелено-бирюзовый (глубокая тень)
      { h: 125, s: 100, l: 20 },   // Очень темный зелено-салатовый (глубокая тень)
      { h: 120, s: 100, l: 21 },   // Очень темный темно-зеленый (глубокая тень)
      { h: 115, s: 100, l: 20 },   // Очень темный лесной зеленый (глубокая тень)
      // ОЧЕНЬ темные серые/черные (для теней между ветками - почти черные!)
      { h: 0, s: 0, l: 15 },       // Почти черный (тень между ветками)
      { h: 0, s: 0, l: 18 },       // Очень темно-серый (тень между ветками)
      { h: 0, s: 0, l: 20 },       // Темно-серый (тень между ветками)
      { h: 0, s: 5, l: 16 },       // Почти черный с легким оттенком (тень)
      { h: 0, s: 3, l: 19 },       // Очень темно-серый с легким оттенком (тень)
      { h: 180, s: 0, l: 17 },     // Холодный почти черный (тень)
      { h: 180, s: 2, l: 20 },     // Холодный темно-серый (тень)
    ];
    
    // Логируем палитру градиента
    console.log('=== ПАЛИТРА ГРАДИЕНТА ДЛЯ ВЕТОК (режим БЕЗ подсветки) ===');
    gradientColors.forEach((color, index) => {
      const testColor = new THREE.Color().setHSL(color.h / 360, color.s / 100, color.l / 100);
      console.log(`${index + 1}. Оттенок ${color.h}°, насыщенность ${color.s}%, яркость ${color.l}% → RGB(${Math.round(testColor.r * 255)}, ${Math.round(testColor.g * 255)}, ${Math.round(testColor.b * 255)})`);
    });
    console.log('=== КОНЕЦ ПАЛИТРЫ ===');
      
      clonedObj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshCount++;
          
          // Проверяем, не является ли объект очень большим плоским фоном
          // Если размер по одной из осей очень маленький, а по другим очень большой - это фон
          const geometry = child.geometry;
        let box: THREE.Box3 | null = null;
          if (geometry) {
            geometry.computeBoundingBox();
          box = geometry.boundingBox;
            if (box) {
              const boxSize = new THREE.Vector3();
              box.getSize(boxSize);
              const boxMax = Math.max(boxSize.x, boxSize.y, boxSize.z);
              const boxMin = Math.min(boxSize.x, boxSize.y, boxSize.z);
              
              // Если объект очень плоский (одна ось < 1% от максимальной) и большой (> 500)
              // Скрываем его, так как это вероятно фон
              if (boxMin < boxMax * 0.01 && boxMax > 500) {
                child.visible = false;
                console.log('Скрыт большой плоский объект (фон):', boxSize);
                return; // Пропускаем этот объект
              }
            }
          }
        
        // Определение типа объекта: сначала по имени, затем по размеру и форме
        const nameLower = (child.name || '').toLowerCase();
        let meshIsBall = nameLower.includes('ball') || nameLower.includes('шар') || nameLower.includes('sphere') || nameLower.includes('orb');
        const meshIsStar = nameLower.includes('star') || nameLower.includes('звезд') || nameLower.includes('top');
        
        // ИСКЛЮЧАЕМ объекты, которые точно НЕ являются шариками
        // Проверяем по имени - если содержит слова "leaf", "leaves", "branch", "trunk" и т.д.
        const isLeaf = nameLower.includes('leaf') || nameLower.includes('leaves') || nameLower.includes('лист');
        const isBranch = nameLower.includes('branch') || nameLower.includes('ветк') || 
                         nameLower.includes('trunk') || nameLower.includes('ствол') ||
                         nameLower.includes('stem') || nameLower.includes('ствол');
        
        // Если не определили по имени, пробуем по размеру, форме и геометрии (только для небольших объектов)
        if (!meshIsBall && !isLeaf && !isBranch && geometry && box) {
          try {
            const boxSize = new THREE.Vector3();
            box.getSize(boxSize);
            const maxSize = Math.max(boxSize.x, boxSize.y, boxSize.z);
            const minSize = Math.min(boxSize.x, boxSize.y, boxSize.z);
            const aspectRatio = maxSize > 0 ? minSize / maxSize : 0; // Отношение минимального к максимальному размеру
            
            // Проверяем тип геометрии и количество вершин
            const geometryType = geometry.type || '';
            const vertexCount = geometry.attributes?.position?.count || 0;
            
            // КРИТЕРИИ для определения МАЛЕНЬКИХ шариков (в два раза меньше наших шаров 0.4):
            // Наши шары = 0.4 единицы, значит родные шарики ≈ 0.2 единицы
            // 1. Абсолютный размер от 0.1 до 2 единиц (очень маленькие объекты!)
            // 2. Форма примерно сферическая/овальная (aspectRatio > 0.25, мягкое требование)
            // 3. ИЛИ тип геометрии указывает на сферу/круг
            // 4. ИЛИ небольшое количество вершин (шарики обычно проще, чем ветки) - менее 500 вершин
            // 5. Не является звездой, листом или веткой
            const isSmallAbsolute = maxSize >= 0.1 && maxSize < 2 && isFinite(maxSize); // Очень маленькие объекты!
            const isSpherical = aspectRatio > 0.25 && isFinite(aspectRatio); // Мягкое требование к сферичности
            const isSphereGeometry = geometryType.toLowerCase().includes('sphere') || 
                                     geometryType.toLowerCase().includes('circle') ||
                                     geometryType.toLowerCase().includes('ball');
            const hasFewVertices = vertexCount > 0 && vertexCount < 500; // Шарики обычно имеют меньше вершин
            
            // Сохраняем кандидатов для диагностики (первые 30 небольших объектов)
            if (!meshIsStar && !isLeaf && !isBranch && maxSize < 2 && ballCandidates.length < 30) {
              const canUseRelative = modelMaxSize > 0 && isFinite(modelMaxSize) && modelMaxSize !== 2048;
              const relativeSize = canUseRelative ? maxSize / modelMaxSize : 0;
              ballCandidates.push({
                name: child.name || 'unnamed',
                size: `${maxSize.toFixed(2)}`,
                aspectRatio: aspectRatio,
                height: 0,
                relativeSize: canUseRelative ? `${(relativeSize * 100).toFixed(2)}%` : 'N/A',
                ...(geometryType && { geometryType }),
                ...(vertexCount !== undefined && { vertexCount })
              });
            }
            
            // Определяем как шарик, если соответствует УМЕРЕННЫМ критериям
            // Используем ИЛИ - достаточно одного из условий (сферичность ИЛИ тип геометрии ИЛИ мало вершин)
            if (!meshIsStar && !isLeaf && !isBranch && isSmallAbsolute && 
                (isSpherical || isSphereGeometry || hasFewVertices)) {
              meshIsBall = true;
            }
          } catch (e) {
            // Если произошла ошибка при определении шарика, просто пропускаем это определение
            // и продолжаем применять материалы
            console.warn('Ошибка при определении шарика:', e);
          }
        }
          
          let needsMaterial = false;
        // Объявляем группу цвета для этого материала (по умолчанию 'main')
        let colorGroupType: 'main' | 'dark' | 'shadow' = 'main';
          
          if (shouldReplaceAll) {
            // Если MTL не загружен, заменяем все материалы
            needsMaterial = true;
          } else {
            // Проверяем, есть ли материал и валиден ли он
            if (!child.material || (Array.isArray(child.material) && child.material.length === 0)) {
              needsMaterial = true;
            } else if (Array.isArray(child.material)) {
              // Проверяем все материалы в массиве
              const validMaterials = child.material.filter(mat => mat && mat.isMaterial);
              if (validMaterials.length === 0) {
                needsMaterial = true;
              } else {
                // Проверяем, есть ли цвет у материалов
                const hasColor = validMaterials.some(mat => {
                  const color = mat.color || mat.diffuse;
                  return color && (color.r > 0.1 || color.g > 0.1 || color.b > 0.1);
                });
                // Если материалы белые/прозрачные, заменяем их
                if (!hasColor) {
                  needsMaterial = true;
                }
              }
            } else if (child.material && child.material.isMaterial) {
              // Проверяем цвет материала
              const color = child.material.color || child.material.diffuse;
              let hasColor = false;
              if (color) {
                hasColor = color.r > 0.1 || color.g > 0.1 || color.b > 0.1;
              }
              // Если материал белый/прозрачный или нет цвета, заменяем
              if (!hasColor || (!color && !child.material.map)) {
                needsMaterial = true;
              }
            } else {
              needsMaterial = true;
            }
          }
          
          if (needsMaterial) {
            replacedCount++;
          
          // Увеличиваем счетчики только для объектов, которые получают материал
          if (meshIsBall) {
            ballCount++;
            // Логируем определение шарика для диагностики
            if (ballCount <= 10) {
              console.log(`Шарик #${ballCount} определен:`, {
                name: child.name || 'unnamed',
                meshCount: meshCount
              });
            }
          }
          if (meshIsStar) {
            starCount++;
          }
          
          let color: THREE.Color;
          let emissiveIntensity: number;
          
          // Определяем цвет в зависимости от типа объекта (БЕЗ подсветки)
          if (meshIsStar) {
            // Звезда на макушке - золотой/желтый цвет
            color = new THREE.Color().setHSL(45 / 360, 1.0, 0.65); // Золотой, ярче
            emissiveIntensity = 0.2; // Более яркое свечение для звезды
          } else if (meshIsBall) {
            // Шарики - РАДУЖНЫЕ НЕОНОВЫЕ ЯРКИЕ праздничные цвета (пестрые, блестящие, запредельно разноцветные!)
            // Используем НАСЫЩЕННЫЕ цвета (lightness 45-55) для яркости БЕЗ бледности
            // и МАКСИМАЛЬНУЮ emissiveIntensity для неонового свечения
            const ballColors = [
              { h: 0, s: 100, l: 50 },     // Насыщенный красный
              { h: 15, s: 100, l: 50 },   // Насыщенный красно-оранжевый
              { h: 30, s: 100, l: 50 },   // Насыщенный оранжевый
              { h: 45, s: 100, l: 55 },   // Насыщенный золотой
              { h: 60, s: 100, l: 55 },   // Насыщенный желтый
              { h: 75, s: 100, l: 50 },   // Насыщенный салатовый
              { h: 90, s: 100, l: 50 },   // Насыщенный лайм
              { h: 120, s: 100, l: 45 },  // Насыщенный зеленый
              { h: 150, s: 100, l: 50 },  // Насыщенный изумрудный
              { h: 180, s: 100, l: 50 },  // Насыщенный голубой/cyan
              { h: 195, s: 100, l: 50 },  // Насыщенный бирюзовый
              { h: 210, s: 100, l: 50 },  // Насыщенный сине-голубой
              { h: 225, s: 100, l: 50 },  // Насыщенный аквамарин
              { h: 240, s: 100, l: 50 },  // Насыщенный синий
              { h: 255, s: 100, l: 50 },  // Насыщенный сине-фиолетовый
              { h: 270, s: 100, l: 50 },  // Насыщенный индиго
              { h: 280, s: 100, l: 50 },  // Насыщенный фиолетовый
              { h: 300, s: 100, l: 55 },  // Насыщенный розовый/магента
              { h: 315, s: 100, l: 55 },  // Насыщенный пурпурно-розовый
              { h: 330, s: 100, l: 55 },  // Насыщенный пурпурный
              { h: 345, s: 100, l: 55 },  // Насыщенный фуксия
              { h: 350, s: 100, l: 50 },  // Насыщенный красно-розовый
            ];
            // Используем ОТДЕЛЬНЫЙ счетчик шариков для разнообразия цветов
            // Используем ballCount - 1, так как счетчик уже увеличен выше
            const ballColorIndex = (ballCount - 1) % ballColors.length;
            const ballColorHSL = ballColors[ballColorIndex];
            color = new THREE.Color().setHSL(
              ballColorHSL.h / 360,
              ballColorHSL.s / 100,
              ballColorHSL.l / 100
            );
            emissiveIntensity = 1.0; // МАКСИМАЛЬНО яркое неоновое свечение для блестящих шариков!
          } else {
            // Ветки ёлки - сочный глубокий зеленый с переливанием оттенков и темно-фиолетово-индиго акцентами
            // РАЗДЕЛЯЕМ палитру на две группы: зеленые и фиолетово-индиго
            // НЕ интерполируем между группами, чтобы избежать синих промежуточных цветов!
            
            // Увеличиваем счетчик веток для выбора цвета (только для веток, не шариков и не звезд)
            branchColorCount++;
            
            // Разделяем палитру на группы
            const greenColors = gradientColors.filter(c => c.h >= 110 && c.h <= 150); // Зеленые (115-150°)
            // Очень темные серые/черные (для теней между ветками - почти черные!)
            const darkShadowColors = gradientColors.filter(c => c.s <= 10 && c.l <= 20 && (c.h === 0 || c.h === 180));
            
            // Отладка: логируем количество цветов в каждой группе (только один раз)
            if (!groupsLogged) {
              groupsLogged = true;
              console.log('=== ГРУППЫ ЦВЕТОВ ===');
              console.log(`Зеленые: ${greenColors.length} цветов`);
              console.log(`Очень темные тени (почти черные): ${darkShadowColors.length} цветов`, darkShadowColors.map(c => `h:${c.h}° s:${c.s}% l:${c.l}%`));
              console.log('===================');
            }
            
            // Определяем, какую группу использовать для этого меша
            // 75% веток - зеленые (основной цвет с переливами), 15% - темные зеленые (тени), 10% - почти черные (глубокие тени между ветками)
            // ИСПОЛЬЗУЕМ branchColorCount вместо meshCount для правильного распределения!
            const colorGroup = branchColorCount % 20;
            let selectedColors: typeof gradientColors;
            if (colorGroup < 2 && darkShadowColors.length > 0) {
              // 10% веток получают почти черные (глубокие тени между ветками)
              selectedColors = darkShadowColors;
            } else if (colorGroup < 5) {
              // 15% веток получают темные зеленые (тени) - используем темные оттенки из зеленых
              const darkGreenColors = greenColors.filter(c => c.l <= 28);
              selectedColors = darkGreenColors.length > 0 ? darkGreenColors : greenColors;
            } else {
              // 75% веток получают основные зеленые (естественный сочный цвет елки с переливами)
              selectedColors = greenColors;
            }
            
            // Если группа пуста, используем зеленые цвета
            if (selectedColors.length === 0) {
              console.warn(`Группа цветов пуста для branchColorCount=${branchColorCount}, colorGroup=${colorGroup}, используем зеленые`);
              selectedColors = greenColors.length > 0 ? greenColors : gradientColors;
            }
            
            // Определяем группу цвета для этого материала (для режима с подсветкой)
            if (colorGroup < 2 && darkShadowColors.length > 0) {
              colorGroupType = 'shadow'; // Почти черные (глубокие тени)
            } else if (colorGroup < 5) {
              colorGroupType = 'dark'; // Темные зеленые (тени)
            } else {
              colorGroupType = 'main'; // Основные зеленые
            }
            
            // Отладка: логируем выбор цвета для первых 20 веток
            if (branchColorCount <= 20) {
              const colorType = colorGroup < 2 ? 'ПОЧТИ ЧЕРНЫЙ' : 
                               colorGroup < 5 ? 'ТЕМНЫЙ ЗЕЛЕНЫЙ' : 'ЗЕЛЕНЫЙ';
              console.log(`Ветка #${branchColorCount}: colorGroup=${colorGroup}, тип=${colorType}, выбрано цветов=${selectedColors.length}`);
            }
            
            // Интерполируем ТОЛЬКО внутри выбранной группы с ПЛАВНОЙ интерполяцией
            // Используем более плавное распределение для градиента
            const rawGradientPos = (meshCount % 100) / 100;
            // Плавная функция для более естественных переходов (smoothstep)
            const smoothstep = (t: number) => t * t * (3 - 2 * t);
            const gradientPos = smoothstep(rawGradientPos);
            
            const colorIndex = Math.floor(gradientPos * (selectedColors.length - 1));
            const nextColorIndex = Math.min(colorIndex + 1, selectedColors.length - 1);
            let t = (gradientPos * (selectedColors.length - 1)) - colorIndex;
            // Применяем плавную интерполяцию для t
            t = smoothstep(t);
            
            const color1 = selectedColors[colorIndex];
            const color2 = selectedColors[nextColorIndex];
            
            // ПЛАВНАЯ интерполяция между цветами внутри группы
            let hue = color1.h + (color2.h - color1.h) * t;
            const saturation = (color1.s + (color2.s - color1.s) * t) / 100;
            const lightness = (color1.l + (color2.l - color1.l) * t) / 100;
            
            // УЛУЧШЕННЫЕ вариации для детальной прорисовки веток и плавных переливов
            let hueVariation = 0;
            if (hue >= 110 && hue <= 150) {
              // Для зелёных цветов - БОЛЬШИЕ вариации оттенков для плавных переливов и детальной прорисовки
              hueVariation = ((meshCount % 20) - 10) * 2.5; // От -25 до +25 градусов для плавных переливов
            } else if (hue >= 240 && hue <= 270) {
              // Для фиолетово-индиго - небольшие вариации
              hueVariation = ((meshCount % 5) - 2) * 1.5; // От -3 до +3 градусов
            } else if (saturation < 0.1 && lightness < 0.25) {
              // Для темных теней (почти черных) - очень маленькие вариации
              hueVariation = ((meshCount % 5) - 2) * 1; // От -2 до +2 градусов
            }
            
            const saturationVariation = ((meshCount % 7) - 3) * 0.003; // Увеличенные вариации насыщенности для деталей
            // БОЛЬШИЕ вариации яркости для создания ЗАМЕТНЫХ теней и контраста
            let lightnessVariation: number;
            if (saturation < 0.1 && lightness < 0.25) {
              // Для темных теней (почти черных) - маленькие вариации, чтобы оставались темными
              lightnessVariation = ((meshCount % 5) - 2) * 0.02; // От -0.04 до +0.04
            } else {
              // Для остальных - большие вариации
              lightnessVariation = ((meshCount % 17) - 8) * 0.08; // От -0.64 до +0.64 для ЗАМЕТНЫХ теней
            }
            
            let finalHue = (hue + hueVariation + 360) % 360;
            
            // Ограничиваем диапазон для разных групп цветов
            if (hue >= 110 && hue <= 150) {
              // Для зелёных цветов - расширенный диапазон для детальной прорисовки веток
              finalHue = Math.max(105, Math.min(155, finalHue));
            } else if (hue >= 240 && hue <= 270) {
              // Ограничиваем диапазон для фиолетово-индиго
              finalHue = Math.max(240, Math.min(270, finalHue));
            } else if (saturation < 0.1) {
              // Для серебра и темных теней - ограничиваем около 0° или 180°
              if (lightness < 0.25) {
                // Для темных теней (почти черных) - строго около 0° или 180°
                if (hue < 10 || hue > 350) {
                  finalHue = 0;
                } else if (Math.abs(hue - 180) < 10) {
                  finalHue = 180;
                }
              } else {
                // Для серебра - ограничиваем около 0° или 180°
                if (hue < 10 || hue > 350) {
                  finalHue = (finalHue + 360) % 360;
                  if (finalHue > 10 && finalHue < 350) {
                    finalHue = finalHue < 180 ? 0 : 180;
                  }
                } else if (Math.abs(hue - 180) < 10) {
                  finalHue = Math.max(170, Math.min(190, finalHue));
                }
              }
            }
            
            // Максимальная насыщенность для сочных цветов (с вариациями для деталей)
            const finalSaturation = Math.max(0.95, Math.min(1.0, saturation + saturationVariation));
            // БОЛЬШИЕ вариации яркости для создания ЗАМЕТНЫХ теней и контраста
            let finalLightness: number;
            if (hue >= 110 && hue <= 150) {
              // Для зеленых - БОЛЬШИЕ вариации: от темных (25%) до сочных ярких (45%) для плавных переливов и сочности
              // Основной цвет елки более сочный и яркий!
              finalLightness = Math.max(0.25, Math.min(0.45, lightness + lightnessVariation));
            } else if (saturation < 0.1 && lightness < 0.25) {
              // Для темных теней (почти черных) - остаемся очень темными: от 12% до 22%
              finalLightness = Math.max(0.12, Math.min(0.22, lightness + lightnessVariation));
            } else {
              // Для фиолетово-индиго - вариации: от темных (35%) до ярких (50%)
              finalLightness = Math.max(0.35, Math.min(0.50, lightness + lightnessVariation));
            }
            
            color = new THREE.Color().setHSL(finalHue / 360, finalSaturation, finalLightness);
            emissiveIntensity = 0.05 + (meshCount % 2) * 0.02;
            
            // Отладка: логируем цвета для первых 10 веток (не шариков и не звезд)
            // Используем ту же логику определения, что и в начале кода
            const nameLower = (child.name || '').toLowerCase();
            const isStar = nameLower.includes('star') || nameLower.includes('звезд') || nameLower.includes('top');
            let isBall = nameLower.includes('ball') || nameLower.includes('шар') || nameLower.includes('sphere') || nameLower.includes('orb') || nameLower.includes('greenlight');
            // Также проверяем по размеру (как в основном коде) - только если еще не определили как шарик
            if (!isBall && !isStar && geometry && box) {
              try {
                const boxSize = new THREE.Vector3();
                box.getSize(boxSize);
                const maxSize = Math.max(boxSize.x, boxSize.y, boxSize.z);
                if (maxSize >= 0.1 && maxSize < 2) {
                  isBall = true;
                }
              } catch (e) {
                // Игнорируем ошибки
              }
            }
            // Логируем только реальные ветки (не шарики и не звезды)
            if (!isStar && !isBall && branchCountForLog < 10) {
              branchCountForLog++;
              let colorType = 'ЗЕЛЕНЫЙ (основной)';
              if (colorGroup < 2 && darkShadowColors.length > 0) {
                colorType = 'ПОЧТИ ЧЕРНЫЙ (тень между ветками)';
              } else if (colorGroup < 5) {
                colorType = 'ЗЕЛЕНЫЙ (тень)';
              }
              console.log(`Ветка #${branchCountForLog} "${child.name || 'unnamed'}" [${colorType}]:`, {
                'Оттенок (hue)': finalHue.toFixed(1) + '°',
                'Насыщенность': (finalSaturation * 100).toFixed(1) + '%',
                'Яркость': (finalLightness * 100).toFixed(1) + '%',
                'RGB': `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`,
                'Позиция в градиенте': gradientPos.toFixed(2),
                'Индекс цвета': colorIndex,
                'Базовый оттенок': hue.toFixed(1) + '°',
                'Вариация оттенка': hueVariation.toFixed(1) + '°',
              });
            }
          }
          
          const material = new THREE.MeshStandardMaterial({
              color: color,
            emissive: color,
            emissiveIntensity: emissiveIntensity,
            roughness: 0.6 + (meshCount % 3) * 0.1,
            metalness: 0.1 + (meshCount % 4) * 0.05,
            side: THREE.DoubleSide,
          });
          
          child.material = material;
          // Сохраняем ссылку на материал для анимации переливания цветов
          meshMaterialsRef.current.push(material);
          // Сохраняем ссылку на меш для управления видимостью
          if (child instanceof THREE.Mesh) {
            meshRefs.current.push(child);
          }
          // Сохраняем исходный цвет материала для восстановления в режиме БЕЗ подсветки
          originalColorsRef.current.push(color.clone());
          // Сохраняем исходную интенсивность свечения для восстановления в режиме БЕЗ подсветки
          originalEmissiveIntensitiesRef.current.push(emissiveIntensity);
          // Отмечаем, является ли материал шариком или звездой (для сохранения цветов в режиме с подсветкой)
          isBallOrStarMaterialRef.current.push(meshIsBall || meshIsStar);
          // Отмечаем отдельно звезды для переливания цветов
          isStarMaterialRef.current.push(meshIsStar);
          // Сохраняем группу цвета для применения теней и распределения тонов в режиме с подсветкой
          // Для шариков и звезд используем 'main', для веток - сохраненное значение
          materialColorGroupRef.current.push((meshIsBall || meshIsStar) ? 'main' : colorGroupType);
          // Сохраняем позицию меша относительно центра елки для вычисления прозрачности
          // Используем центр bounding box меша или позицию объекта
          let meshPosition = new THREE.Vector3();
          if (box) {
            box.getCenter(meshPosition);
          } else if (child.position) {
            meshPosition.copy(child.position);
          }
          // Вычисляем расстояние от центра елки (используем recalculatedCenter если есть, иначе center)
          const treeCenter = recalculatedCenter || center;
          const relativePosition = meshPosition.clone().sub(treeCenter);
          materialPositionsRef.current.push(relativePosition);
          }
        }
      });
      
      console.log(`Материалы применены: ${meshCount} мешей, ${replacedCount} заменено, MTL загружен: ${!!materials}`);
    console.log(`Определено объектов: ${meshCount} мешей, ${ballCount} шариков, ${starCount} звезд(а)`);
    
    // Отладка: статистика по цветам веток (первые 10) - используем ТУ ЖЕ логику определения, что и в основном коде
    const branchColors: Array<{ name: string; hue: number; lightness: number; rgb: string }> = [];
    let branchCount = 0;
    clonedObj.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial && branchCount < 10) {
        const nameLower = (child.name || '').toLowerCase();
        // Используем ТУ ЖЕ логику определения шариков и звезд, что и в основном коде
        let isBall = nameLower.includes('ball') || nameLower.includes('шар') || nameLower.includes('sphere') || nameLower.includes('orb') || nameLower.includes('greenlight');
        const isStar = nameLower.includes('star') || nameLower.includes('звезд') || nameLower.includes('top');
        
        // Также проверяем по размеру (как в основном коде)
        if (!isBall && !isStar) {
          const geometry = child.geometry;
          if (geometry) {
            geometry.computeBoundingBox();
            const box = geometry.boundingBox;
            if (box) {
              const boxSize = new THREE.Vector3();
              box.getSize(boxSize);
              const maxSize = Math.max(boxSize.x, boxSize.y, boxSize.z);
              // Если размер от 0.1 до 2 - это может быть шарик
              if (maxSize >= 0.1 && maxSize < 2) {
                isBall = true; // Считаем маленькие объекты шариками
              }
            }
          }
        }
        
        // Только если это НЕ шарик и НЕ звезда - это ветка
        if (!isStar && !isBall) {
          const color = child.material.color;
          const hsl = { h: 0, s: 0, l: 0 };
          color.getHSL(hsl);
          branchColors.push({
            name: child.name || 'unnamed',
            hue: hsl.h * 360,
            lightness: hsl.l * 100,
            rgb: `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`,
          });
          branchCount++;
        }
      }
    });
    if (branchColors.length > 0) {
      console.log('=== СТАТИСТИКА ЦВЕТОВ ВЕТОК (первые 10, режим БЕЗ подсветки) ===');
      branchColors.forEach((branch, index) => {
        console.log(`${index + 1}. "${branch.name}": оттенок ${branch.hue.toFixed(1)}°, яркость ${branch.lightness.toFixed(1)}%, ${branch.rgb}`);
      });
      console.log('=== КОНЕЦ СТАТИСТИКИ ===');
    }
    
    if (ballCandidates.length > 0) {
      console.log('Кандидаты в шарики (первые 10 небольших объектов):', ballCandidates);
    }
      
      // Пересчитываем bounding box после скрытия фона, чтобы получить правильный центр
      // Делаем это синхронно, чтобы избежать проблем с рендерингом
      const box = new THREE.Box3().setFromObject(clonedObj);
      const newSize = box.getSize(new THREE.Vector3());
      const newCenter = box.getCenter(new THREE.Vector3());
      
      // Устанавливаем все состояния синхронно для предотвращения мигания
      // Используем новый центр и размер, если они валидны, иначе сохраняем предыдущие
      if (newSize.y > 0 && newCenter) {
        setRecalculatedCenter(newCenter);
        setModelSize(newSize);
        previousRecalculatedCenterRef.current = newCenter; // Сохраняем для следующего переключения
        previousModelSizeRef.current = newSize; // Сохраняем для следующего переключения
      } else {
        // Если новые значения невалидны, сохраняем предыдущие для избежания мигания
        if (previousRecalculatedCenter) {
          setRecalculatedCenter(previousRecalculatedCenter);
          previousRecalculatedCenterRef.current = previousRecalculatedCenter;
        }
        if (previousModelSize && previousModelSize.y > 0) {
          setModelSize(previousModelSize);
          previousModelSizeRef.current = previousModelSize;
        }
      }
      
      console.log('Пересчитанный центр после скрытия фона:', {
        center: { x: newCenter.x.toFixed(2), y: newCenter.y.toFixed(2), z: newCenter.z.toFixed(2) },
        size: { x: newSize.x.toFixed(2), y: newSize.y.toFixed(2), z: newSize.z.toFixed(2) },
        glowEnabled: glowEnabled
      });
  }, [clonedObj, materials]); // Убрали glowEnabled из зависимостей, чтобы не пересоздавать материалы при переключении режимов

  // Палитра цветов для анимированного переливания по всей ёлке
  // Включает также эффект прозрачности (прибавление/убавление)
  // Убраны белые/светлые цвета для более насыщенного эффекта
  // Увеличена прозрачность для лучшей видимости контуров веток
  const colorPalette = useMemo(() => [
    { h: 270, s: 100, l: 50, opacity: 0.85 },   // Фиолетовый (немного прозрачный)
    { h: 240, s: 100, l: 50, opacity: 0.85 },   // Индиго (немного прозрачный)
    { h: 200, s: 100, l: 50, opacity: 0.85 },   // Голубой (немного прозрачный)
    { h: 300, s: 100, l: 55, opacity: 0.85 },   // Сиреневый (немного прозрачный)
    { h: 120, s: 100, l: 50, opacity: 0.85 },   // Зеленый (немного прозрачный)
    { h: 90, s: 100, l: 50, opacity: 0.85 },    // Салатовый (немного прозрачный)
    { h: 45, s: 100, l: 50, opacity: 0.85 },    // Золотой (немного прозрачный)
    { h: 15, s: 100, l: 50, opacity: 0.85 },     // Оранжевый (немного прозрачный)
    { h: 180, s: 100, l: 50, opacity: 0.65 },   // Неоновый голубой (более прозрачный)
    { h: 300, s: 100, l: 55, opacity: 0.7 },   // Неоновый розовый (более прозрачный)
    { h: 120, s: 100, l: 50, opacity: 0.75 },   // Неоновый зеленый (более прозрачный)
    { h: 270, s: 100, l: 50, opacity: 0.6 },   // Фиолетовый (еще более прозрачный)
    { h: 200, s: 100, l: 50, opacity: 0.55 },   // Голубой (еще более прозрачный)
    { h: 120, s: 100, l: 50, opacity: 0.5 },   // Зеленый (самый прозрачный для контуров)
    { h: 270, s: 100, l: 50, opacity: 0.8 },   // Фиолетовый (менее прозрачный)
    { h: 200, s: 100, l: 50, opacity: 0.85 },   // Голубой (немного прозрачный)
  ], []);

  // Палитра цветов для анимации мигания шариков в режиме с подсветкой
  // Радужные яркие цвета для эффекта мигания
  const ballFlashColors = useMemo(() => [
    { h: 0, s: 100, l: 50 },     // Красный
    { h: 30, s: 100, l: 50 },   // Оранжевый
    { h: 60, s: 100, l: 55 },   // Желтый
    { h: 120, s: 100, l: 45 },  // Зеленый
    { h: 180, s: 100, l: 50 },  // Голубой
    { h: 240, s: 100, l: 50 },  // Синий
    { h: 270, s: 100, l: 50 },  // Индиго
    { h: 300, s: 100, l: 55 },  // Розовый/магента
    { h: 330, s: 100, l: 55 },  // Пурпурный
    { h: 345, s: 100, l: 55 },  // Фуксия
  ], []);

  useFrame((state) => {
    // УБРАНО автоматическое вращение елки - теперь только через OrbitControls с ограничениями
    
    // ПРИМЕНЯЕМ ПРОЗРАЧНОСТЬ ЕЛКИ ВО ВСЕХ РЕЖИМАХ!
    const currentTreeOpacity = treeOpacityRef.current;
    
    // АГРЕССИВНО скрываем елку при низкой прозрачности
    // Применяем видимость КАЖДЫЙ кадр для надежности
    if (treeRef.current) {
      // Елка полностью скрывается при прозрачности <= 0
      const shouldBeVisible = currentTreeOpacity > 0;
      if (treeRef.current.visible !== shouldBeVisible) {
        treeRef.current.visible = shouldBeVisible;
      }
    }
    
    // Также управляем видимостью отдельных мешей для плавного исчезновения
    const shouldMeshesBeVisible = currentTreeOpacity > 0;
    meshRefs.current.forEach((mesh) => {
      if (mesh && mesh.visible !== shouldMeshesBeVisible) {
        mesh.visible = shouldMeshesBeVisible;
      }
    });
    
    // В режиме БЕЗ подсветки восстанавливаем исходные цвета материалов
    if (!glowEnabled) {
      meshMaterialsRef.current.forEach((material, index) => {
        if (!material || !originalColorsRef.current[index]) return;
        const originalColor = originalColorsRef.current[index];
        const originalIntensity = originalEmissiveIntensitiesRef.current[index] ?? 0.05;
        material.color.copy(originalColor);
        material.emissive.copy(originalColor);
        material.emissiveIntensity = originalIntensity; // Восстанавливаем исходную интенсивность
        const currentTreeOpacity = treeOpacityRef.current;
        material.opacity = 1.0 * currentTreeOpacity; // Применяем общую прозрачность елки
        material.transparent = currentTreeOpacity < 1.0; // Включаем прозрачность если opacity < 1.0
        material.needsUpdate = true; // Важно: обновляем материал!
        if (material.map) material.map.needsUpdate = true; // Обновляем текстуру если есть
      });
      return; // В режиме без подсветки не применяем анимацию переливания для ёлки
    }
    
    // Анимируем цвета всех материалов для переливания по всей ёлке
    // ВСЯ ёлка переливается ОДНИМ цветом одновременно по очереди!
    // Используем МИНИМАЛЬНОЕ свечение, чтобы сохранить видимость контуров и рельефности веток
    // Включаем анимацию прозрачности (прибавление/убавление)
    const time = state.clock.elapsedTime;
    const cycleSpeed = 0.6; // УСКОРЕННАЯ скорость переливания цветов
    
    // Вычисляем текущий цвет для ВСЕЙ ёлки (одинаковый для всех материалов)
    const phase = (time * cycleSpeed) % (colorPalette.length * 2);
    const colorIndex = Math.floor(phase / 2);
    const nextColorIndex = (colorIndex + 1) % colorPalette.length;
    const t = (phase % 2) / 2; // От 0 до 1 для интерполяции (плавный переход)
    
    const color1 = colorPalette[colorIndex];
    const color2 = colorPalette[nextColorIndex];
    
    // Плавная интерполяция между двумя цветами для мягкого перехода
    const hue = color1.h + (color2.h - color1.h) * t;
    const saturation = (color1.s + (color2.s - color1.s) * t) / 100;
    const lightness = (color1.l + (color2.l - color1.l) * t) / 100;
    
    // Интерполируем прозрачность (opacity)
    const opacity = color1.opacity + (color2.opacity - color1.opacity) * t;
    
    // Создаем цвет с минимальным отливом (сохраняем рельефность и контуры!)
    const currentColor = new THREE.Color().setHSL(hue / 360, saturation, lightness);
    
    // Применяем ОДИНАКОВЫЙ цвет ко всем материалам с МИНИМАЛЬНЫМ свечением
    // НО исключаем шарики и звезды - они сохраняют свои разноцветные цвета!
    meshMaterialsRef.current.forEach((material, index) => {
      if (!material) return;
      
      // Обрабатываем шарики и звезды отдельно
      if (isBallOrStarMaterialRef.current[index]) {
        const originalColor = originalColorsRef.current[index];
        const originalIntensity = originalEmissiveIntensitiesRef.current[index] ?? 0.05;
        
        if (originalColor) {
          // Используем ref для точного определения звезды
          const isStar = isStarMaterialRef.current[index] === true;
          
          if (glowEnabled && !isStar) {
            // В режиме с подсветкой шарики мигают разными цветами
            // Используем индекс материала и время для создания уникальной анимации для каждого шарика
            const ballFlashSpeed = 2.0; // Скорость мигания
            const ballFlashOffset = index * 0.5; // Смещение для каждого шарика
            const flashIndex = Math.floor((time * ballFlashSpeed + ballFlashOffset) % ballFlashColors.length);
            const flashColorHSL = ballFlashColors[flashIndex];
            
            // Плавное переключение между цветами
            const nextFlashIndex = (flashIndex + 1) % ballFlashColors.length;
            const nextFlashColorHSL = ballFlashColors[nextFlashIndex];
            const flashProgress = (time * ballFlashSpeed + ballFlashOffset) % 1;
            
            // Интерполяция между текущим и следующим цветом
            const currentH = flashColorHSL.h + (nextFlashColorHSL.h - flashColorHSL.h) * flashProgress;
            const currentS = flashColorHSL.s + (nextFlashColorHSL.s - flashColorHSL.s) * flashProgress;
            const currentL = flashColorHSL.l + (nextFlashColorHSL.l - flashColorHSL.l) * flashProgress;
            
            const flashColor = new THREE.Color().setHSL(
              currentH / 360,
              currentS / 100,
              currentL / 100
            );
            
            // Яркое мигающее свечение
            const flashIntensity = 1.2 + Math.sin(time * 4 + index * 0.3) * 0.3; // От 0.9 до 1.5
            
            material.color.copy(flashColor);
            material.emissive.copy(flashColor);
            material.emissiveIntensity = flashIntensity;
            const currentTreeOpacity = treeOpacityRef.current;
            material.opacity = 1.0 * currentTreeOpacity; // Применяем общую прозрачность елки
            material.transparent = currentTreeOpacity < 1.0; // Включаем прозрачность если opacity < 1.0
            material.needsUpdate = true; // Важно: обновляем материал!
            if (material.map) material.map.needsUpdate = true; // Обновляем текстуру если есть
          } else if (glowEnabled && isStar) {
            // В режиме с подсветкой звезды переливаются цветами из палитры ёлки
            // НО с другой скоростью и смещением, чтобы переливаться независимо от ёлки
            // ВСЕ части звезды используют ОДИНАКОВОЕ смещение для единого цвета
            const starCycleSpeed = 0.8; // Другая скорость для звезды (быстрее)
            const starTimeOffset = 5; // Фиксированное смещение для всех частей звезды (единый цвет!)
            const phase = ((time + starTimeOffset) * starCycleSpeed) % (colorPalette.length * 2);
            const colorIndex = Math.floor(phase / 2);
            const nextColorIndex = (colorIndex + 1) % colorPalette.length;
            const t = (phase % 2) / 2; // От 0 до 1 для интерполяции
            
            const color1 = colorPalette[colorIndex];
            const color2 = colorPalette[nextColorIndex];
            
            // Плавная интерполяция между двумя цветами
            const hue = color1.h + (color2.h - color1.h) * t;
            const saturation = (color1.s + (color2.s - color1.s) * t) / 100;
            const lightness = (color1.l + (color2.l - color1.l) * t) / 100;
            
            // Интерполируем прозрачность так же, как для ёлки
            const starOpacity = color1.opacity + (color2.opacity - color1.opacity) * t;
            
            const baseStarColor = new THREE.Color().setHSL(hue / 360, saturation, lightness);
            
            // Добавляем вариацию яркости для эффекта "отливов" и рельефности (как у ёлки)
            // Используем фиксированный индекс для синхронности всех частей звезды
            const starBrightnessVariation = 0.92 + (Math.sin(time * 1.5) * 0.08); // От 0.84 до 1.0
            const variedStarColor = baseStarColor.clone().multiplyScalar(starBrightnessVariation);
            
            // Яркое свечение для звезды с пульсацией (более яркое, чем у ёлки)
            // Все части звезды пульсируют синхронно
            const starIntensity = 1.0 + Math.sin(time * 4) * 0.3; // От 0.7 до 1.3 (ярче!)
            
            // Для лучшей видимости контуров: немного темнее основной цвет для контраста
            const darkerStarColor = variedStarColor.clone().multiplyScalar(0.75); // Темнее для теней
            
            material.color.copy(darkerStarColor); // Основной цвет с вариациями для рельефности
            material.emissive.copy(variedStarColor); // Эмиссия с вариациями для свечения
            material.emissiveIntensity = starIntensity;
            
            // Добавляем вариации roughness для рельефности (как у ёлки)
            material.roughness = 0.5 + Math.sin(time * 0.8) * 0.15; // От 0.35 до 0.65 для рельефности
            material.metalness = 0.15 + Math.sin(time * 1.2) * 0.1; // От 0.05 до 0.25 для вариаций блеска
            
            // Используем ту же прозрачность, что и у ёлки, с учетом общей прозрачности елки
            const currentTreeOpacity = treeOpacityRef.current;
            material.opacity = starOpacity * currentTreeOpacity; // Применяем общую прозрачность елки
            material.transparent = true; // Всегда включаем прозрачность для корректной работы
            material.needsUpdate = true; // Важно: обновляем материал!
            if (material.map) material.map.needsUpdate = true; // Обновляем текстуру если есть
            material.needsUpdate = true; // Важно: обновляем материал!
          } else if (!glowEnabled) {
            // В режиме БЕЗ подсветки - сохраняем исходные цвета (и для шариков, и для звезд)
            material.color.copy(originalColor);
            material.emissive.copy(originalColor);
            material.emissiveIntensity = originalIntensity;
            material.opacity = 1.0 * treeOpacity; // Применяем общую прозрачность елки
            material.transparent = treeOpacity < 1.0; // Включаем прозрачность только если нужно
          }
        }
        return;
      }
      
      // Применяем распределение тонов и теней в зависимости от группы цвета материала
      const colorGroup = materialColorGroupRef.current[index] || 'main';
      let brightnessVariation: number;
      let intensityVariation: number;
      
      if (colorGroup === 'shadow') {
        // Почти черные (глубокие тени) - темнее и с меньшим свечением
        brightnessVariation = 0.65 + (Math.sin(time * 0.8 + index * 0.1) * 0.1); // От 0.55 до 0.75 (темнее!)
        intensityVariation = 0.3 + (Math.sin(time * 1.0 + index * 0.12) * 0.15); // От 0.15 до 0.45 (меньше свечение)
      } else if (colorGroup === 'dark') {
        // Темные зеленые (тени) - средняя яркость и свечение
        brightnessVariation = 0.80 + (Math.sin(time * 1.0 + index * 0.09) * 0.12); // От 0.68 до 0.92
        intensityVariation = 0.5 + (Math.sin(time * 1.2 + index * 0.1) * 0.2); // От 0.3 до 0.7
      } else {
        // Основные зеленые - ярче и с большим свечением
        brightnessVariation = 0.95 + (Math.sin(time * 1.2 + index * 0.08) * 0.05); // От 0.90 до 1.0 (ярче!)
        intensityVariation = 0.6 + (Math.sin(time * 1.4 + index * 0.08) * 0.25); // От 0.35 до 0.85 (больше свечение)
      }
      
      const variedColor = currentColor.clone().multiplyScalar(brightnessVariation);
      
      material.color.copy(variedColor);
      material.emissive.copy(variedColor);
      
      // Применяем вариации свечения в зависимости от группы для создания теней и распределения тонов
      // Используем intensityVariation, вычисленную выше для каждой группы
      material.emissiveIntensity = intensityVariation * 0.015; // Масштабируем для сохранения минимального свечения
      
      // Применяем прозрачность (opacity) в зависимости от расстояния до центра елки
      // Ближе к центру - более плотно (меньше прозрачность), дальше - более фантомно (больше прозрачность)
      const relativePosition = materialPositionsRef.current[index];
      let distanceFromCenter = 0;
      if (relativePosition) {
        // Используем только горизонтальное расстояние (X и Z), игнорируем Y (высоту)
        const horizontalDistance = Math.sqrt(relativePosition.x * relativePosition.x + relativePosition.z * relativePosition.z);
        distanceFromCenter = horizontalDistance;
      }
      
      // Вычисляем максимальный радиус елки из modelSize (используем максимальный размер по X или Z)
      // Если modelSize недоступен, вычисляем из bounding box елки
      let maxRadius = 50; // Fallback значение
      if (modelSize.x > 0 && modelSize.z > 0) {
        maxRadius = Math.max(modelSize.x, modelSize.z) / 2; // Половина максимального размера
      } else if (treeRef.current) {
        // Вычисляем из bounding box елки
        const box = new THREE.Box3().setFromObject(treeRef.current);
        const size = new THREE.Vector3();
        box.getSize(size);
        maxRadius = Math.max(size.x, size.z) / 2;
      }
      
      const normalizedDistance = Math.min(distanceFromCenter / maxRadius, 1.0); // От 0 до 1
      
      // Ближе к центру (normalizedDistance близко к 0) - меньше прозрачность (0.9-1.0)
      // Дальше от центра (normalizedDistance близко к 1) - больше прозрачность (0.5-0.7)
      // Используем плавную функцию для перехода (smoothstep для более естественного перехода)
      const smoothstep = (t: number) => t * t * (3 - 2 * t);
      const smoothDistance = smoothstep(normalizedDistance);
      const baseOpacity = 0.95 - (smoothDistance * 0.35); // От 0.95 (центр) до 0.6 (край)
      
      // Комбинируем с анимированной прозрачностью из палитры (но не слишком сильно, чтобы сохранить эффект плотности)
      const finalOpacity = baseOpacity * (0.7 + opacity * 0.3); // Учитываем opacity из палитры, но не полностью
      
      // Учитываем общую прозрачность елки (для плавного исчезновения во время новогодней анимации)
      const baseMaterialOpacity = Math.max(0.5, Math.min(0.95, finalOpacity)); // Ограничиваем от 0.5 до 0.95
      const currentTreeOpacity = treeOpacityRef.current;
      material.opacity = baseMaterialOpacity * currentTreeOpacity; // Применяем общую прозрачность елки
      material.transparent = true; // Всегда включаем прозрачность для корректной работы
      material.needsUpdate = true; // Важно: обновляем материал!
      if (material.map) material.map.needsUpdate = true; // Обновляем текстуру если есть
      
      // Улучшаем контуры: увеличиваем контрастность через roughness и metalness
      // Более высокий roughness делает контуры более четкими
      if (material.roughness !== undefined) {
        material.roughness = Math.max(0.7, material.roughness); // Минимум 0.7 для четких контуров
      }
      if (material.metalness !== undefined) {
        material.metalness = Math.min(0.15, material.metalness); // Максимум 0.15 для четких контуров
      }
    });
  });

  if (error) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </group>
    );
  }

  if (error) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </group>
    );
  }

  // Позиционируем модель так, чтобы она была центрирована и правильно масштабирована
  // Смещаем ёлку в нижнюю треть экрана
  // В Three.js положительный Y идет вверх, отрицательный - вниз
  // Камера на высоте Y=2, смотрит на Y=0, поэтому смещаем ёлку вниз (отрицательный Y)
  // Вычисляем нижнюю точку модели и позиционируем её внизу
  // Проверяем, что modelSize инициализирован и clonedObj существует
  // Используем сохраненное значение из ref, если текущее modelSize.y === 0
  // чтобы избежать мигания при переключении режимов
  const effectiveModelSize = modelSize.y > 0 ? modelSize : (previousModelSizeRef.current || modelSize);
  
  if (!clonedObj || effectiveModelSize.y === 0) {
    // Если размер еще не вычислен, используем временное позиционирование
  return (
      <group ref={treeRef} scale={[scale, scale, scale]} position={[0, -10, 0]}>
        {clonedObj && <primitive object={clonedObj} />}
          </group>
        );
  }
  
  // СТРОГОЕ центрирование: всегда [0, Y, 0] для горизонтального центрирования на любом устройстве
  // Используем пересчитанный центр только для вертикального позиционирования
  const actualCenter = recalculatedCenter || center;
  
      // Центрируем елку: компенсируем смещение центра модели
      // Используем пересчитанный центр для точного позиционирования
      const positionX = -actualCenter.x * scale;
      const positionZ = -actualCenter.z * scale;
  
  // Центрируем по Y, затем смещаем вниз на фиксированное значение
  // Камера на Y=2, смотрит на Y=0, поэтому для нижней трети экрана нужно сместить вниз
  const centeredY = -actualCenter.y * scale; // Центрированная позиция (используем пересчитанный центр)
  const offsetDown = -32; // Смещение вниз (немного уменьшено, чтобы поднять ёлку)
  const positionY = centeredY + offsetDown;
  
  // Логирование позиционирования отключено для производительности

          // ПОЛНОСТЬЮ УДАЛЯЕМ ЕЛКУ при появлении черного фона (космоса) - не через прозрачность!
          // Елка удаляется СРАЗУ при включении черного фона (14 секунд) - АБСОЛЮТНО УДАЛЯЕМ!
          // Используем showBlackBackground для надежного удаления, или проверяем treeOpacity
          const shouldHideTree = showBlackBackground || (isNewYearAnimation && treeOpacity <= 0);
          
          return (
    <>
      {!shouldHideTree && (
    <group 
      ref={treeRef} 
      scale={[scale, scale, scale]}
      position={[positionX, positionY, positionZ]}
    >
          {/* Сама 3D-ёлка */}
      <primitive object={clonedObj} />
          {/* Свечение ствола изнутри */}
          <TrunkGlow enabled={glowEnabled} />
          {/* Снежинки на ёлке (только в режиме БЕЗ подсветки) */}
          {!glowEnabled && (
            <TreeSnowflakes 
              count={40} 
              size={0.1}
              treeHeight={effectiveModelSize.y}
              treeWidth={Math.max(effectiveModelSize.x, effectiveModelSize.z)}
            />
          )}
    </group>
      )}
    </>
  );
}

// Компонент свечения ствола ёлки - переливающийся свет от центра (оси) ёлки
// ТОЛЬКО источники света, БЕЗ видимых объектов
function TrunkGlow({ enabled = true }: { enabled?: boolean }) {
  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);
  
  // Высота ёлки - используем те же значения, что и для шаров (от -4 до 8)
  const bottomY = -4;
  const topY = 8;
  const height = topY - bottomY;
  const lightCount = 12; // Источники света для освещения ёлки
  
  // Расширенная палитра ЯРКИХ и ТЁМНЫХ переливающихся цветов
  // ЗЕЛЁНЫЙ (#00ff00) и САЛАТОВЫЙ (#7fff00) цвета добавлены и будут появляться по очереди!
  const colorPalette = [
    new THREE.Color('#ffff00'), // яркий жёлтый
    new THREE.Color('#00ff00'), // СОЧНЫЙ яркий зелёный - ОБЯЗАТЕЛЬНО
    new THREE.Color('#ff00ff'), // яркий розовый/магента
    new THREE.Color('#7fff00'), // СОЧНЫЙ салатовый - ОБЯЗАТЕЛЬНО
    new THREE.Color('#00ffff'), // яркий голубой/cyan
    new THREE.Color('#00ff00'), // СОЧНЫЙ яркий зелёный (повтор)
    new THREE.Color('#ff8800'), // яркий оранжевый
    new THREE.Color('#7fff00'), // СОЧНЫЙ салатовый (повтор)
    new THREE.Color('#ff0088'), // яркий пурпурный
    new THREE.Color('#00ff00'), // СОЧНЫЙ яркий зелёный (еще раз)
    new THREE.Color('#0088ff'), // яркий синий
    new THREE.Color('#7fff00'), // СОЧНЫЙ салатовый (еще раз)
    new THREE.Color('#8800ff'), // тёмный фиолетовый
    new THREE.Color('#00ff00'), // СОЧНЫЙ яркий зелёный (еще раз)
    new THREE.Color('#880000'), // тёмный красный
    new THREE.Color('#7fff00'), // СОЧНЫЙ салатовый (еще раз)
    new THREE.Color('#000088'), // тёмный синий
    new THREE.Color('#00ff00'), // СОЧНЫЙ яркий зелёный (еще раз)
    new THREE.Color('#ff4444'), // яркий красный
    new THREE.Color('#7fff00'), // СОЧНЫЙ салатовый (еще раз)
    new THREE.Color('#44ff44'), // яркий лайм
    new THREE.Color('#00ff00'), // СОЧНЫЙ яркий зелёный (еще раз)
    new THREE.Color('#4444ff'), // яркий индиго
    new THREE.Color('#7fff00'), // СОЧНЫЙ салатовый (еще раз)
    new THREE.Color('#ff8844'), // тёплый оранжевый
    new THREE.Color('#00ff00'), // СОЧНЫЙ яркий зелёный (еще раз)
    new THREE.Color('#8844ff'), // тёмный индиго
    new THREE.Color('#7fff00'), // СОЧНЫЙ салатовый (еще раз)
    new THREE.Color('#ff44ff'), // яркий фуксия
    new THREE.Color('#00ff00'), // СОЧНЫЙ яркий зелёный (еще раз)
    new THREE.Color('#00ff88'), // СОЧНЫЙ зелёный (светло-зелёный)
    new THREE.Color('#7fff00'), // СОЧНЫЙ салатовый (еще раз)
    new THREE.Color('#00aaff'), // голубой
    new THREE.Color('#00ff00'), // СОЧНЫЙ яркий зелёный (еще раз)
    new THREE.Color('#ffd700'), // золотой
    new THREE.Color('#7fff00'), // СОЧНЫЙ салатовый (финальный)
    new THREE.Color('#00ff00'), // СОЧНЫЙ яркий зелёный (финальный)
  ];

  // Анимация переливания цветов с ЯРКИМ миганием
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Анимация источников света с ярким миганием
    lightRefs.current.forEach((light, index) => {
      if (!light) return;
      
      // Более быстрое переливание цветов
      const phase = (time * 1.2 + index * 0.4) % (colorPalette.length * 2);
      const colorIndex = Math.floor(phase / 2);
      const nextColorIndex = (colorIndex + 1) % colorPalette.length;
      const t = (phase % 2) / 2;
      
      const color1 = colorPalette[colorIndex];
      const color2 = colorPalette[nextColorIndex];
      const currentColor = new THREE.Color().lerpColors(color1, color2, t);
      
      // ЯРКОЕ мигание - интенсивность сильно меняется (от 8 до 15)
      const baseIntensity = 10.0;
      const pulse = Math.sin(time * 4 + index * 0.8) * 0.5 + 0.5; // От 0 до 1
      const intensity = baseIntensity + pulse * 7.0; // От 10 до 17
      
      // Дополнительное мигание для эффекта "переливания"
      const flicker = Math.sin(time * 8 + index * 1.2) * 0.3 + 0.7; // От 0.4 до 1.0
      const finalIntensity = intensity * flicker;
      
      light.color.copy(currentColor);
      light.intensity = finalIntensity;
    });
  });

  // Если подсветка выключена, не рендерим источники света
  if (!enabled) {
    return null;
  }
              
              return (
    <group>
      {/* ТОЛЬКО источники света - БЕЗ видимых объектов */}
      {Array.from({ length: lightCount }).map((_, index) => {
        const y = bottomY + (index / (lightCount - 1)) * height;
        const initialColor = colorPalette[index % colorPalette.length];
        
        return (
          <pointLight
            key={index}
            ref={(ref) => {
              lightRefs.current[index] = ref;
            }}
            position={[0, y, 0]} // По центру оси (x=0, z=0)
            intensity={10.0} // Высокая начальная интенсивность
            distance={25} // Увеличенное расстояние
            decay={0.8} // Меньшее затухание для яркого света
            color={initialColor}
          />
              );
            })}
          </group>
        );
}


// Система анимации для новогоднего эффекта (1 января)
// Шары слетают с ёлки, закручиваются в спираль и рассыпаются по космосу
function NewYearAnimation({
  toys,
  onComplete,
  onTreeOpacityChange,
}: {
  toys: Toy[];
  onComplete?: () => void;
  onTreeOpacityChange?: (opacity: number) => void;
}) {
  const animationRef = useRef<THREE.Group>(null);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'flying' | 'spiral' | 'scattering' | 'complete'>('idle');
  const [showFireworks, setShowFireworks] = useState<boolean>(false); // Состояние для управления видимостью фейерверков/конфетти
  const [showSigns, setShowSigns] = useState<boolean>(false); // Состояние для управления видимостью табличек с поздравлениями
  const [showWishSigns, setShowWishSigns] = useState<boolean>(false); // Состояние для управления видимостью табличек с желаниями
  const [showBlackBackground, setShowBlackBackground] = useState<boolean>(false); // Состояние для черного фона
  const [treeOpacity, setTreeOpacity] = useState<number>(1.0); // Прозрачность елки (для плавного исчезновения)
  const elapsedTimeRef = useRef<number>(0); // Ref для отслеживания времени анимации
  const startTimeRef = useRef<number>(0);
  const sparkRefs = useRef<THREE.Mesh[]>([]);
  const fireworksShownRef = useRef<boolean>(false); // Ref для отслеживания, были ли уже показаны фейерверки
  const signsShownRef = useRef<boolean>(false); // Ref для отслеживания, были ли уже показаны таблички с поздравлениями
  const wishSignsShownRef = useRef<boolean>(false); // Ref для отслеживания, были ли уже показаны таблички с желаниями
  const blackBackgroundShownRef = useRef<boolean>(false); // Ref для отслеживания черного фона

  // Количество «искорок» в анимации (берём по количеству шаров, но не больше 80)
  const sparksCount = Math.min(toys.length > 0 ? toys.length : 50, 80);

  useEffect(() => {
    // Запускаем анимацию при монтировании
    setAnimationPhase('flying');
    startTimeRef.current = Date.now();
    fireworksShownRef.current = false; // Сбрасываем флаг фейерверков
    signsShownRef.current = false; // Сбрасываем флаг табличек с поздравлениями
    wishSignsShownRef.current = false; // Сбрасываем флаг табличек с желаниями
    blackBackgroundShownRef.current = false; // Сбрасываем флаг черного фона
    setShowFireworks(false); // Сбрасываем состояние
    setShowSigns(false); // Сбрасываем состояние табличек с поздравлениями
    setShowWishSigns(false); // Сбрасываем состояние табличек с желаниями
    setShowBlackBackground(false); // Сбрасываем состояние черного фона
    setTreeOpacity(1.0); // Сбрасываем прозрачность елки
  }, []);

  useFrame((state) => {
    if (!animationRef.current || animationPhase === 'idle' || animationPhase === 'complete') return;

    const elapsed = (Date.now() - startTimeRef.current) / 1000; // Время в секундах
    elapsedTimeRef.current = elapsed; // Обновляем ref времени для управления фейерверками/конфетти
    
    // Включаем таблички с поздравлениями на 5 секунде (задержка на пару секунд)
    if (elapsed >= 5 && !signsShownRef.current) {
      signsShownRef.current = true;
      setShowSigns(true);
      console.log('🎊 Таблички с поздравлениями включены! Время:', elapsed.toFixed(2), 'сек');
    }
    // Включаем фейерверки/конфетти на 4 секунде (только один раз)
    if (elapsed >= 4 && !fireworksShownRef.current) {
      fireworksShownRef.current = true;
      setShowFireworks(true);
      console.log('🎆 Фейерверки и конфетти включены! Время:', elapsed.toFixed(2), 'сек');
    }
    // Включаем таблички с желаниями на 7.5 секунде (смена табличек)
    if (elapsed >= 7.5 && !wishSignsShownRef.current) {
      wishSignsShownRef.current = true;
      setShowWishSigns(true);
      console.log('💫 Таблички с желаниями включены! Время:', elapsed.toFixed(2), 'сек');
    }
    // Выключаем таблички с поздравлениями на 7.5 секунде (полная смена на таблички с желаниями)
    if (elapsed >= 7.5 && showSigns) {
      setShowSigns(false);
      console.log('🎊 Таблички с поздравлениями выключены');
    }
    // ПЛАВНОЕ исчезновение елки с 12 до 14 секунд
    if (elapsed >= 12 && elapsed < 14) {
      const fadeProgress = (elapsed - 12) / 2; // 0-1 за 2 секунды (12-14 сек)
      const newOpacity = Math.max(0, 1 - fadeProgress); // Плавно от 1 до 0
      setTreeOpacity(newOpacity);
      if (onTreeOpacityChange) {
        onTreeOpacityChange(newOpacity);
      }
    }
    // Включаем черный фон ПЕРЕД взрывом на 20 секунде (за 2 секунды до взрыва на 22 секунде)
    if (elapsed >= 20 && !blackBackgroundShownRef.current) {
      blackBackgroundShownRef.current = true;
      setShowBlackBackground(true);
      console.log('🌌 Черный фон включен ПЕРЕД взрывом! Время:', elapsed.toFixed(2), 'сек');
    }
    // Выключаем фейерверки/конфетти на 14 секунде (когда фон становится черным)
    if (elapsed >= 14 && showFireworks) {
      setShowFireworks(false);
      console.log('🎆 Фейерверки и конфетти выключены');
    }
    // ПОЛНОСТЬЮ УДАЛЯЕМ ЕЛКУ при появлении черного фона (14 секунд) - не через прозрачность!
    // Елка уже удалена при включении черного фона выше, здесь ничего не делаем
    

    // Улучшенная анимация согласно сценарию:
    // Фаза 1 (0-6 сек): шарики слетают с ёлки и превращаются в белые точки
    // Фаза 2 (6-13 сек): закручиваются в спираль-комету
    // Фаза 3 (13+ сек): рассыпаются по космосу

    for (let i = 0; i < sparksCount; i++) {
      const mesh = sparkRefs.current[i];
      if (!mesh) continue;

      const t = i / sparksCount; // 0..1
      const material = mesh.material as THREE.MeshStandardMaterial;
      
      // Начальные позиции (на ёлке)
      const startY = -5 + t * 15; // От низа до верха ёлки
      const startRadius = 1 + t * 3;
      const startAngle = t * Math.PI * 4;

      if (animationPhase === 'flying' && elapsed < 6) {
        // Фаза 1: слетают с ёлки и собираются в кучу, превращаясь в яркие разноцветные точки
        const k = elapsed / 6; // 0..1
        
        // Яркие неоновые разноцветные цвета с максимальным разнообразием!
        // Используем разные диапазоны оттенков для каждого шарика
        let baseHue: number;
        const colorGroup = Math.floor(i % 6);
        if (colorGroup === 0) baseHue = 0; // Красный
        else if (colorGroup === 1) baseHue = 0.1; // Оранжевый
        else if (colorGroup === 2) baseHue = 0.3; // Желтый/зеленый
        else if (colorGroup === 3) baseHue = 0.5; // Голубой
        else if (colorGroup === 4) baseHue = 0.7; // Синий/фиолетовый
        else baseHue = 0.85; // Пурпурный/розовый
        
        const hue = (baseHue + (elapsed * 0.1) + (t * 0.3)) % 1; // Меняющийся оттенок с вариациями
        const saturation = 1; // Максимальная насыщенность
        const lightness = 0.45 + Math.sin(elapsed * 2 + t * 10) * 0.12; // Яркость с пульсацией (0.33-0.57) - яркие, но не белые!
        const sparkColor = new THREE.Color().setHSL(hue, saturation, lightness);
        
        material.color.setRGB(sparkColor.r, sparkColor.g, sparkColor.b);
        material.emissive.setRGB(sparkColor.r, sparkColor.g, sparkColor.b);
        material.emissiveIntensity = 3.5; // Очень яркое неоновое свечение!
        material.needsUpdate = true;
        
        // Размер шаров - крупные и заметные!
        const sizeProgress = Math.min(k * 2, 1);
        const targetSize = 0.4; // Увеличили с 0.08 до 0.4 - крупные шары!
        const startSize = 0.5; // Увеличили с 0.15 до 0.5 - очень заметные!
        mesh.scale.setScalar(startSize + (targetSize - startSize) * sizeProgress);
        
        // Плавное движение: сначала собираются в кучу, потом немного разлетаются
        let finalX: number, finalY: number, finalZ: number;
        
        if (k < 0.4) {
          // Фаза 1 (0-40%): собираются в кучу
          const gatherK = k / 0.4; // 0..1
          const centerX = 0;
          const centerY = 5; // Над ёлкой
          const centerZ = 0;
          const startX = Math.cos(startAngle) * startRadius;
          const startZ = Math.sin(startAngle) * startRadius;
          
          // Плавная интерполяция к центру
          finalX = startX + (centerX - startX) * gatherK;
          finalY = startY + (centerY - startY) * gatherK;
          finalZ = startZ + (centerZ - startZ) * gatherK;
        } else {
          // Фаза 2 (40-100%): немного разлетаются из кучи
          const scatterK = (k - 0.4) / 0.6; // 0..1
          const scatterRadius = scatterK * 1.5; // Небольшой разлет
          const scatterAngle = startAngle + scatterK * Math.PI;
          finalX = Math.cos(scatterAngle) * scatterRadius;
          finalY = 5 + scatterK * 3; // Поднимаются немного выше
          finalZ = Math.sin(scatterAngle) * scatterRadius;
        }
        
        mesh.position.set(finalX, finalY, finalZ);
        
        if (elapsed >= 6) {
          setAnimationPhase('spiral');
        }
      } else if (animationPhase === 'spiral' && elapsed < 13) {
        // Фаза 2: закручиваются в спираль-комету (6-7 секунд)
        const k = (elapsed - 6) / 7; // 0..1
        
        // Яркие неоновые разноцветные точки (звездная спираль) с максимальным разнообразием!
        const colorGroup = Math.floor(i % 6);
        let baseHue: number;
        if (colorGroup === 0) baseHue = 0;
        else if (colorGroup === 1) baseHue = 0.1;
        else if (colorGroup === 2) baseHue = 0.3;
        else if (colorGroup === 3) baseHue = 0.5;
        else if (colorGroup === 4) baseHue = 0.7;
        else baseHue = 0.85;
        
        const hue = (baseHue + (elapsed * 0.15) + (t * 0.4)) % 1; // Меняющийся оттенок с вариациями
        const saturation = 1; // Максимальная насыщенность
        const lightness = 0.45 + Math.sin(elapsed * 3 + t * 8) * 0.12; // Яркость с пульсацией (0.33-0.57) - яркие, но не белые!
        const sparkColor = new THREE.Color().setHSL(hue, saturation, lightness);
        
        material.color.setRGB(sparkColor.r, sparkColor.g, sparkColor.b);
        material.emissive.setRGB(sparkColor.r, sparkColor.g, sparkColor.b);
        material.emissiveIntensity = 3.5; // Очень яркое неоновое свечение!
        material.needsUpdate = true;
        mesh.scale.setScalar(0.4); // Крупные шары для видимости!
        
        // Закручивание в спираль-комету
        // Спираль закручивается вокруг центральной оси
        const spiralTurns = 3; // Количество витков спирали
        const spiralAngle = startAngle + k * Math.PI * 2 * spiralTurns;
        const spiralRadius = 0.5 + k * 2; // Радиус спирали увеличивается
        const spiralY = 8 + k * 5; // Движение вверх
        
        // Создаем эффект кометы - более плотная спираль в начале
        const cometDensity = 1 - k * 0.7; // Плотность уменьшается
        const offset = (1 - cometDensity) * 2;
        
        mesh.position.set(
          Math.cos(spiralAngle) * (spiralRadius + offset),
          spiralY,
          Math.sin(spiralAngle) * (spiralRadius + offset),
        );
        
        if (elapsed >= 13) {
          setAnimationPhase('scattering');
        }
      } else if (animationPhase === 'scattering' && elapsed < 20) {
        // Фаза 3: рассыпаются по космосу (звездные системы и галактики)
        const k = (elapsed - 13) / 7; // 0..1
        
        // Яркие неоновые разноцветные звезды в космосе с максимальным разнообразием!
        const colorGroup = Math.floor(i % 6);
        let baseHue: number;
        if (colorGroup === 0) baseHue = 0;
        else if (colorGroup === 1) baseHue = 0.1;
        else if (colorGroup === 2) baseHue = 0.3;
        else if (colorGroup === 3) baseHue = 0.5;
        else if (colorGroup === 4) baseHue = 0.7;
        else baseHue = 0.85;
        
        const hue = (baseHue + (elapsed * 0.05) + (t * 0.2)) % 1; // Медленно меняющийся оттенок с вариациями
        const saturation = 1; // Максимальная насыщенность
        const lightness = 0.45 + Math.sin(elapsed * 2 + t * 5) * 0.12; // Яркость с пульсацией (0.33-0.57) - яркие, но не белые!
        const starColor = new THREE.Color().setHSL(hue, saturation, lightness);
        
        material.color.setRGB(starColor.r, starColor.g, starColor.b);
        material.emissive.setRGB(starColor.r, starColor.g, starColor.b);
        material.emissiveIntensity = 3.5 + Math.sin(k * Math.PI * 4) * 0.5; // Очень яркое пульсирующее неоновое свечение!
        material.needsUpdate = true;
        
        // Разлетаются в разные стороны
        const scatterAngle = startAngle + k * Math.PI * 8;
        const scatterRadius = 3 + k * 15; // Разлетаются далеко
        const scatterY = 13 + k * 10;
        
        mesh.position.set(
          Math.cos(scatterAngle) * scatterRadius,
          scatterY + Math.sin(k * Math.PI * 2) * 5, // Волнообразное движение
          Math.sin(scatterAngle) * scatterRadius,
        );
        
        if (elapsed >= 20) {
          setAnimationPhase('complete');
          onComplete?.();
        }
      }
    }
  });

  // Фейерверки и конфетти активны с 4 секунды до конца анимации (20 секунд)
  const showConfetti = showFireworks; // Конфетти показывается вместе с фейерверками

  // Тестовые «искорки» для визуализации новогодней анимации
  return (
    <>
      <group ref={animationRef}>
        {Array.from({ length: sparksCount }).map((_, index) => {
          // Разнообразные начальные цвета
          const colorGroup = index % 6;
          let hue: number;
          if (colorGroup === 0) hue = 0; // Красный
          else if (colorGroup === 1) hue = 0.1; // Оранжевый
          else if (colorGroup === 2) hue = 0.3; // Желтый/зеленый
          else if (colorGroup === 3) hue = 0.5; // Голубой
          else if (colorGroup === 4) hue = 0.7; // Синий/фиолетовый
          else hue = 0.85; // Пурпурный/розовый
          
          const color = new THREE.Color();
          color.setHSL(hue, 1, 0.45); // Начальная яркость - яркие, но не белые!
          return (
            <mesh 
              key={index}
              ref={(ref) => {
                if (ref) sparkRefs.current[index] = ref;
              }}
            >
              <sphereGeometry args={[0.25, 12, 12]} />
              <meshStandardMaterial 
                color={color}
                emissive={color}
                emissiveIntensity={2.5}
              />
            </mesh>
          );
        })}
      </group>
      
      {/* Фейерверки и салюты - активны с 4 секунды */}
      {showFireworks && (
        <Fireworks count={8} enabled={true} />
      )}
      
      {/* Конфетти - активно с 4 секунды */}
      {showConfetti && (
        <Confetti count={60} enabled={true} />
      )}
      
      {/* Таблички с поздравлениями на разных языках */}
      {showSigns && (
        <NewYearSigns enabled={true} startTime={startTimeRef.current} />
      )}
      
      {/* Таблички с желаниями из пользовательских шаров */}
      {showWishSigns && (
        <WishSigns 
          enabled={true} 
          toys={toys} 
          startTime={startTimeRef.current}
          onExplosionComplete={() => {
            console.log('🌟 Новая Вселенная создана!');
          }}
        />
      )}
      
      {/* Черный фон (космос) после исчезновения новогодних элементов - на 14 секунде */}
      {showBlackBackground && (
        <>
          {/* Огромный черный фон сзади - покрывает весь экран */}
          <mesh position={[0, 0, -200]} renderOrder={-10}>
            <planeGeometry args={[1000, 1000]} />
            <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
        </mesh>
          {/* Дополнительный фон ближе для надежности */}
          <mesh position={[0, 0, -100]} renderOrder={-9}>
            <planeGeometry args={[800, 800]} />
            <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
          </mesh>
          {/* Еще один слой для полного покрытия */}
          <mesh position={[0, 0, -50]} renderOrder={-8}>
            <planeGeometry args={[600, 600]} />
            <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </>
  );
}

// Основной компонент сцены (оптимизирован для миллионов шаров)
function TreeScene({ toys, currentUserId, onBallClick, onBallLike, userHasLiked, treeImageUrl, treeType, treeModel, isNewYearAnimation, onAnimationComplete, glowEnabled = false }: VirtualTreeProps) {
  const { camera, scene } = useThree();
  const [visibleToys, setVisibleToys] = useState<Toy[]>([]);
  const [treeOpacity, setTreeOpacity] = useState<number>(1.0); // Прозрачность елки - непрозрачная
  const controlsRef = useRef<any>(null);
  const [treePosition, setTreePosition] = useState<[number, number, number]>([0, -32, 0]); // Позиция елки (по умолчанию)
  const treeGroupRef = useRef<THREE.Group | null>(null);
  const treeRotationGroupRef = useRef<THREE.Group | null>(null); // Ref для группы вращения елки
  const [isTreeLoaded, setIsTreeLoaded] = useState<boolean>(false); // Флаг загрузки елки
  
  // Создаем 200 тестовых шаров с фиксированными позициями
  const testToys = useMemo(() => {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#00CED1'];
    return Array.from({ length: 200 }, (_, i) => ({
      id: `test-ball-${i}`,
      user_id: `test-user-${i}`,
      shape: 'ball' as const,
      color: colors[i % colors.length],
      pattern: null,
      sticker: undefined,
      wish_text: `Желание`,
      wish_for_others: undefined,
      image_url: undefined,
      user_photo_url: undefined,
      status: 'on_tree' as const,
      room_id: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ball_size: 0.5 + (Math.random() * 0.5), // Размер от 0.5 до 1.0
      surface_type: 'glossy' as const,
      effects: undefined,
      filters: undefined,
      second_color: undefined,
      user_name: undefined,
      selected_country: undefined,
      birth_year: undefined,
      is_on_tree: true,
      position: undefined,
      support_count: 0,
      author_tg_id: undefined,
    } as Toy));
  }, []);
  
  // Множество занятых позиций пользовательскими шарами (0-199)
  // Новые шары должны заменять тестовые на соответствующих позициях
  const occupiedPositions = useMemo(() => {
    const set = new Set<number>();
    toys.forEach(toy => {
      // Извлекаем position_index из toy.position_index или из toy.position
      let positionIndex: number | undefined = (toy as any).position_index;
      if (positionIndex === undefined || positionIndex === null) {
        if (toy.position && typeof toy.position === 'object' && 'position_index' in toy.position) {
          positionIndex = (toy.position as any).position_index;
        }
      }
      if (positionIndex !== undefined && positionIndex !== null && positionIndex >= 0 && positionIndex < 200) {
        set.add(positionIndex);
      }
    });
    return set;
  }, [toys]);
  
  // Создаем массив из 200 позиций: пользовательские шары заменяют тестовые на соответствующих позициях
  const allToys = useMemo(() => {
    const positions: (Toy | null)[] = Array.from({ length: 200 }, (_, i) => {
      // Ищем пользовательский шар с position_index === i
      const userToy = toys.find(toy => {
        let positionIndex: number | undefined = (toy as any).position_index;
        if (positionIndex === undefined || positionIndex === null) {
          if (toy.position && typeof toy.position === 'object' && 'position_index' in toy.position) {
            positionIndex = (toy.position as any).position_index;
          }
        }
        return positionIndex === i;
      });
      
      // Если есть пользовательский шар на этой позиции - используем его, иначе тестовый
      return userToy || testToys[i];
    });
    
    // Фильтруем null (не должно быть, но на всякий случай)
    const result = positions.filter((toy): toy is Toy => toy !== null);
    
    // Добавляем пользовательские шары БЕЗ position_index (старые шары, которые не заменяют тестовые)
    const toysWithoutPosition = toys.filter(toy => {
      let positionIndex: number | undefined = (toy as any).position_index;
      if (positionIndex === undefined || positionIndex === null) {
        if (toy.position && typeof toy.position === 'object' && 'position_index' in toy.position) {
          positionIndex = (toy.position as any).position_index;
        }
      }
      return positionIndex === undefined || positionIndex === null || positionIndex < 0 || positionIndex >= 200;
    });
    
    // Добавляем три тестовых шара на верхушку елки
    const topBall: Toy = {
      id: 'test-ball-top',
      user_id: 'test-user-top',
      shape: 'ball' as const,
      color: '#FFD700', // Золотой цвет для верхушки
      pattern: null,
      sticker: undefined,
      wish_text: 'Желание',
      wish_for_others: undefined,
      image_url: undefined,
      user_photo_url: undefined,
      status: 'on_tree' as const,
      room_id: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ball_size: 0.8,
      surface_type: 'glossy' as const,
      effects: undefined,
      filters: undefined,
      second_color: undefined,
      user_name: undefined,
      selected_country: undefined,
      birth_year: undefined,
      is_on_tree: true,
      position: undefined,
      support_count: 0,
      author_tg_id: undefined,
    };
    
    const topBall2: Toy = {
      id: 'test-ball-top-2',
      user_id: 'test-user-top-2',
      shape: 'ball' as const,
      color: '#FF6B6B', // Красный цвет
      pattern: null,
      sticker: undefined,
      wish_text: 'Желание',
      wish_for_others: undefined,
      image_url: undefined,
      user_photo_url: undefined,
      status: 'on_tree' as const,
      room_id: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ball_size: 0.7,
      surface_type: 'glossy' as const,
      effects: undefined,
      filters: undefined,
      second_color: undefined,
      user_name: undefined,
      selected_country: undefined,
      birth_year: undefined,
      is_on_tree: true,
      position: undefined,
      support_count: 0,
      author_tg_id: undefined,
    };
    
    const topBall3: Toy = {
      id: 'test-ball-top-3',
      user_id: 'test-user-top-3',
      shape: 'ball' as const,
      color: '#4ECDC4', // Бирюзовый цвет
      pattern: null,
      sticker: undefined,
      wish_text: 'Желание',
      wish_for_others: undefined,
      image_url: undefined,
      user_photo_url: undefined,
      status: 'on_tree' as const,
      room_id: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ball_size: 0.7,
      surface_type: 'glossy' as const,
      effects: undefined,
      filters: undefined,
      second_color: undefined,
      user_name: undefined,
      selected_country: undefined,
      birth_year: undefined,
      is_on_tree: true,
      position: undefined,
      support_count: 0,
      author_tg_id: undefined,
    };
    
    return [...toysWithoutPosition, ...result, topBall, topBall2, topBall3];
  }, [toys, testToys]);
  
  // Сбрасываем флаг загрузки при изменении модели елки
  useEffect(() => {
    setIsTreeLoaded(false);
    treeGroupRef.current = null;
  }, [treeModel]);
  
  // Логируем количество шаров на елке
  useEffect(() => {
    console.log(`[VirtualTree] Всего шаров на елке: ${allToys.length} (реальных: ${toys.length}, тестовых: ${testToys.length})`);
    console.log(`[VirtualTree] Видимых шаров: ${visibleToys.length}`);
  }, [allToys.length, toys.length, testToys.length, visibleToys.length]);
  
  // Получаем реальную позицию елки из сцены - улучшенный поиск
  useEffect(() => {
    const findTreePosition = () => {
      let found = false;
      scene.traverse((object) => {
        if (found) return;
        
        // Ищем группу елки более точно - по наличию множества мешей (ветки елки)
        if (object instanceof THREE.Group) {
          const meshCount = object.children.filter(child => child instanceof THREE.Mesh).length;
          // Елка обычно имеет много мешей (ветки)
          if (meshCount > 10) {
            const worldPosition = new THREE.Vector3();
            object.getWorldPosition(worldPosition);
            setTreePosition([worldPosition.x, worldPosition.y, worldPosition.z]);
            treeGroupRef.current = object;
            setIsTreeLoaded(true); // Елка найдена и загружена!
            found = true;
          }
        }
      });
    };
    
    // Пытаемся найти позицию елки с задержкой (елка может загружаться)
    const timer = setTimeout(findTreePosition, 100);
    const interval = setInterval(findTreePosition, 1000); // Обновляем каждую секунду
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [scene, treeModel]);
  
  // Обновляем позицию елки в useFrame для точности
  useFrame(() => {
    if (treeGroupRef.current) {
      const worldPosition = new THREE.Vector3();
      treeGroupRef.current.getWorldPosition(worldPosition);
      setTreePosition([worldPosition.x, worldPosition.y, worldPosition.z]);
    }
  });

  useEffect(() => {
    // Камера четко по центру для любого устройства (мобильные и десктоп)
    // Позиционирование елки одинаково для всех устройств
    camera.position.set(0, 2, 18);
    camera.lookAt(0, 0, 0);
    
    // Принудительно устанавливаем target для OrbitControls
    // Одинаково для всех устройств
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [camera]);

  // Автоматическое вращение елки вправо-влево в пределах разрешенных градусов
  // ПРИМЕНЯЕТСЯ ОДИНАКОВО ДЛЯ ВСЕХ УСТРОЙСТВ (мобильные и десктоп)
  useFrame((state, delta) => {
    if (treeRotationGroupRef.current) {
      // Базовый поворот: -48 градусов (было -46, добавили еще 2 градуса влево)
      const baseRotation = -48 * (Math.PI / 180);
      // Диапазон вращения: от -0.5 до 7 градусов (как разрешено для пользователей)
      const minAngle = -0.5 * (Math.PI / 180);
      const maxAngle = 7 * (Math.PI / 180);
      const range = maxAngle - minAngle;
      
      // Плавное движение туда-сюда с периодом ~8 секунд
      const time = state.clock.elapsedTime;
      const oscillation = Math.sin(time * 0.5) * 0.5 + 0.5; // От 0 до 1
      const currentOffset = minAngle + oscillation * range;
      
      // Применяем базовый поворот + текущее смещение
      treeRotationGroupRef.current.rotation.y = baseRotation + currentOffset;
    }
  });

  // Виртуализация: отображаем все шары на елке (отключен frustum culling, чтобы шары были видны со всех сторон)
  useFrame(() => {
    // Показываем все шары на елке, чтобы они были видны со всех сторон при повороте
    // Ограничиваем только общее количество для производительности
    const maxVisible = 500; // Максимум 500 шаров одновременно
    
    // Сортируем шары по расстоянию от камеры для оптимизации рендеринга
    const toysWithDistance: Array<{ toy: Toy; index: number; distance: number }> = [];
    let userBall: { toy: Toy; index: number; distance: number } | null = null;
    
    for (let i = 0; i < allToys.length; i++) {
      const toy = allToys[i];
      const isUserBall = currentUserId && toy.user_id === currentUserId;
      const pos = getBallPosition(toy.id);
      const point = new THREE.Vector3(...pos);
      const distance = camera.position.distanceTo(point);
      
      // Сохраняем шарик пользователя отдельно
      if (isUserBall) {
        userBall = { toy, index: i, distance };
      }
      
      toysWithDistance.push({ toy, index: i, distance });
    }

    // Сортируем: шарик пользователя всегда первый, остальные по расстоянию
    toysWithDistance.sort((a, b) => {
      const aIsUser = currentUserId && a.toy.user_id === currentUserId;
      const bIsUser = currentUserId && b.toy.user_id === currentUserId;
      if (aIsUser && !bIsUser) return -1;
      if (!aIsUser && bIsUser) return 1;
      return a.distance - b.distance;
    });
    
    // Ограничиваем количество одновременно отображаемых шаров (для производительности)
    // Но всегда включаем шарик пользователя
    const result = toysWithDistance.slice(0, maxVisible);
    if (userBall && !result.find(v => v.toy.id === userBall!.toy.id)) {
      result.unshift(userBall); // Добавляем шарик пользователя в начало
    }
    setVisibleToys(result.map(v => v.toy));
  });

  // ФИКСИРОВАННОЕ позиционирование: каждому шару - своя конкретная позиция на елке
  // Позиция рассчитывается на основе индекса и формы елки (конус)
  const generateBaseBallPosition = (toyId: string, index: number = 0, totalCount: number = 1, useUniformDistribution: boolean = false): [number, number, number] => {
    // Если параметры не переданы, используем значения по умолчанию
    if (totalCount === 1) {
    let hash = 0;
    for (let i = 0; i < toyId.length; i++) {
        hash = ((hash << 5) - hash) + toyId.charCodeAt(i);
        hash = hash & hash;
      }
      index = Math.abs(hash) % 1000;
      totalCount = 1000;
    }
    
    // Параметры треугольника
    const minY = -8.5;  // Низ треугольника (поднят, чтобы шары не свисали ниже елки)
    const maxY = 8.5;   // Верх треугольника (вершина)
    const maxWidth = 7.2; // Максимальная ширина треугольника внизу (увеличено в 1.6 раза)
    
    // ПЛОСКАЯ ТРЕУГОЛЬНАЯ ФИГУРА с вершиной ВВЕРХУ
    // МЕНЬШЕ шаров ВВЕРХУ (вершина узкая), БОЛЬШЕ шаров ВНИЗУ (основание широкое)
    
    // Индекс от 0 до totalCount-1
    const normalizedIndex = index / Math.max(1, totalCount - 1); // От 0 до 1
    
    // Высота: малые индексы -> ВВЕРХ (maxY), большие индексы -> ВНИЗ (minY)
    // Если useUniformDistribution = true, используем функцию, которая дает меньше шаров на верхушке
    // но равномерно распределяет по остальной елке (степень 0.7 вместо квадратного корня)
    // Иначе используем квадратный корень для концентрации внизу
    const heightProgress = useUniformDistribution ? Math.pow(normalizedIndex, 0.7) : Math.sqrt(normalizedIndex); // От 0 до 1
    const baseHeight = maxY - heightProgress * (maxY - minY);
    
    // Ширина треугольника: зависит от высоты (вверху узко, внизу широко)
    // Увеличиваем угол вершины на 10%: вверху небольшая ширина вместо 0
    let widthAtHeight = (heightProgress * 0.9 + 0.1) * maxWidth; // Вверху 10% от maxWidth, внизу maxWidth
    
    // Расширяем обе половины треугольника в ширину в 1.2 раза
    const centerY = (maxY + minY) / 2; // Центр треугольника по вертикали
    if (baseHeight < centerY) {
      // Нижняя половина - увеличиваем ширину в 1.2 раза
      widthAtHeight = widthAtHeight * 1.2;
    } else if (baseHeight > centerY) {
      // Верхняя половина - также увеличиваем ширину в 1.2 раза
      widthAtHeight = widthAtHeight * 1.2;
    }
    
    // ОБЪЕМНЫЙ ТРЕУГОЛЬНИК: распределяем шары по окружности вокруг елки
    // Используем полярные координаты для создания объемного треугольника
    
    // Распределение по X: равномерное по ширине на данной высоте
    const xProgress = (index * 0.618033988749895) % 1; // Золотое сечение
    const normalizedX = (xProgress - 0.5) * 2; // От -1 (левый край) до 1 (правый край)
    const baseX = normalizedX * widthAtHeight;
    
    // УСИЛЕННАЯ ВЫПУКЛОСТЬ в центре треугольника
    // Центр выпирает сильнее, края заворачиваются назад
    const absNormalizedX = Math.abs(normalizedX); // От 0 (центр) до 1 (край)
    const convexity = 1 - absNormalizedX; // От 1 (центр) до 0 (край)
    // УСИЛЕНО: эффект выпуклости увеличен для более заметного эффекта
    const convexityEffect = Math.pow(convexity, 2) * 2.5; // УВЕЛИЧЕНО с 1.2 до 2.5
    
    // Базовое расстояние от центра елки (Z координата)
    // Верхняя половина - ближе к елке, нижняя - дальше
    let baseZ = 1.5;
    if (baseHeight > centerY) {
      // Верхняя половина - плавно приближаем к елке
      const topHalfRange = maxY - centerY;
      const distanceFromCenter = baseHeight - centerY;
      const progressToTop = distanceFromCenter / topHalfRange;
      baseZ = 1.0 - progressToTop * 0.7; // От 1.0 (центр) до 0.3 (верх)
      
      if (normalizedIndex < 0.015) {
        baseZ = baseZ - 0.15; // Самые верхние шары еще ближе
      }
    } else if (baseHeight < centerY) {
      // Нижняя половина - центральные шары дальше от елки
      const absX = Math.abs(baseX);
      const centerWidth = widthAtHeight * 0.4;
      if (absX < centerWidth) {
        const centerProgress = 1 - (absX / centerWidth);
        baseZ = 1.5 + centerProgress * 1.2; // УСИЛЕНО: центр дальше на 1.2 (было 0.8)
      }
    }
    
    // Применяем выпуклость: центр выпирает СИЛЬНО вперед, края уходят назад
    // УСИЛЕНО: центральные шары выпирают намного дальше от елки
    baseZ = baseZ + convexityEffect * 1.5 - 0.3; // Центр +3.75, края -0.3 (было +0.96, -0.4)
    
    // ЭФФЕКТ ЗАВОРАЧИВАНИЯ К НИЗУ: нижние углы заворачиваются назад вокруг елки
    let wrapAngle = 0; // Угол заворачивания (для распределения по окружности)
    let wrapZOffset = 0; // Смещение по Z при заворачивании
    let wrapYOffset = 0; // Смещение по Y при заворачивании
    
    if (baseHeight < centerY) {
      // Нижняя половина - заворачиваем края
      const bottomProgress = 1 - (baseHeight - minY) / (centerY - minY); // От 0 (центр) до 1 (низ)
      const edgeProgress = absNormalizedX; // От 0 (центр) до 1 (край)
      
      // Чем ниже и ближе к краю, тем сильнее заворачивание
      const wrapIntensity = bottomProgress * edgeProgress * edgeProgress; // Квадрат для плавности
      
      // Заворачиваем края назад (уменьшаем Z) и немного вниз
      wrapZOffset = -wrapIntensity * 0.6; // УСИЛЕНО: заворачивание назад на 0.6
      wrapYOffset = -wrapIntensity * 0.1; // Немного вниз
      
      // Распределяем по углу вокруг елки для объемного эффекта
      // Левый край заворачивается влево, правый - вправо
      wrapAngle = normalizedX * wrapIntensity * 0.3; // Угол заворачивания до ±0.3 радиан
    }
    
    // Применяем заворачивание
    baseZ = baseZ + wrapZOffset;
    
    // Преобразуем в декартовы координаты с учетом угла заворачивания
    // Это создает объемный эффект - шары распределяются по окружности
    const radius = Math.sqrt(baseX * baseX + baseZ * baseZ);
    const angle = Math.atan2(baseZ, baseX) + wrapAngle;
    const finalX = Math.cos(angle) * radius;
    const finalZ = Math.sin(angle) * radius;
    
    // Добавляем небольшую рандомность на основе toyId (детерминированная)
    const hash1 = toyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hash2 = toyId.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
    const hash3 = toyId.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 2), 0);
    
    const randomX = ((hash1 % 200) / 200 - 0.5) * 0.3; // ±0.15 случайного смещения по X
    const randomY = ((hash2 % 200) / 200 - 0.5) * 0.2; // ±0.1 случайного смещения по Y
    const randomZ = ((hash3 % 200) / 200 - 0.5) * 0.1; // ±0.05 случайного смещения по Z
    
    return [finalX + randomX, baseHeight + randomY + wrapYOffset, finalZ + randomZ];
  };

  // ПРОСТОЙ кэш позиций: генерируем позиции по индексу
  // Для шаров с position_index используем position_index как индекс
  // Для шаров без position_index распределяем равномерно по всей елке
  const ballPositionsCache = useMemo(() => {
    const cache = new Map<string, [number, number, number]>();
    
    // Считаем шары с position_index и без
    const toysWithPosition = allToys.filter(toy => {
      let positionIndex: number | undefined = (toy as any).position_index;
      if (positionIndex === undefined || positionIndex === null) {
        if (toy.position && typeof toy.position === 'object' && 'position_index' in toy.position) {
          positionIndex = (toy.position as any).position_index;
        }
      }
      return positionIndex !== undefined && positionIndex !== null && positionIndex >= 0 && positionIndex < 200;
    });
    
    const toysWithoutPosition = allToys.filter(toy => {
      let positionIndex: number | undefined = (toy as any).position_index;
      if (positionIndex === undefined || positionIndex === null) {
        if (toy.position && typeof toy.position === 'object' && 'position_index' in toy.position) {
          positionIndex = (toy.position as any).position_index;
        }
      }
      return positionIndex === undefined || positionIndex === null || positionIndex < 0 || positionIndex >= 200;
    });
    
    // Для шаров с position_index используем position_index как индекс
    for (const toy of toysWithPosition) {
      let positionIndex: number | undefined = (toy as any).position_index;
      if (positionIndex === undefined || positionIndex === null) {
        if (toy.position && typeof toy.position === 'object' && 'position_index' in toy.position) {
          positionIndex = (toy.position as any).position_index;
        }
      }
      if (positionIndex !== undefined && positionIndex !== null && positionIndex >= 0) {
        // Если индекс в диапазоне 0-199, используем его напрямую
        // Если индекс >= 200, это переполнение - размещаем внизу елки
        if (positionIndex < 200) {
          // Используем равномерное распределение для шаров с position_index
          // Это гарантирует, что шары будут и на верхушке, и внизу
          const pos = generateBaseBallPosition(toy.id, positionIndex, 200, true);
          cache.set(toy.id, pos);
        } else {
          // Для переполнения (>= 200) распределяем равномерно по всей елке
          // Используем остаток от деления на 200 для равномерного распределения
          const normalizedIndex = positionIndex % 200;
          const pos = generateBaseBallPosition(toy.id, normalizedIndex, 200, true);
          cache.set(toy.id, pos);
        }
      }
    }
    
    // Для шаров без position_index распределяем равномерно по всей елке
    // Используем хеш от toy.id для детерминированного, но равномерного распределения
    for (let i = 0; i < toysWithoutPosition.length; i++) {
      const toy = toysWithoutPosition[i];
      // Создаем хеш из toy.id для равномерного распределения по всей елке (0-199)
      let hash = 0;
      for (let j = 0; j < toy.id.length; j++) {
        hash = ((hash << 5) - hash) + toy.id.charCodeAt(j);
        hash = hash & hash;
      }
      // Используем хеш для получения индекса от 0 до 199 (равномерно по всей елке)
      const distributedIndex = Math.abs(hash) % 200;
      // Используем равномерное распределение для старых шаров без position_index
      const pos = generateBaseBallPosition(toy.id, distributedIndex, 200, true);
      cache.set(toy.id, pos);
    }
    
    // Добавляем позиции для тестовых шаров на верхушке
    const topBall = allToys.find(toy => toy.id === 'test-ball-top');
    const topBall2 = allToys.find(toy => toy.id === 'test-ball-top-2');
    const topBall3 = allToys.find(toy => toy.id === 'test-ball-top-3');
    
    if (topBall) {
      // Позиция на самой верхушке: Y = maxY (8.5), X = 0 (центр), Z = 0.3 (близко к елке)
      cache.set(topBall.id, [0, 8.5, 0.3]);
    }
    
    if (topBall2) {
      // Второй шар: чуть ниже (Y = 8.0), дальше влево (X = -0.7), близко к елке (Z = 0.3)
      cache.set(topBall2.id, [-0.7, 8.0, 0.3]);
    }
    
    if (topBall3) {
      // Третий шар: чуть ниже (Y = 8.0), дальше вправо (X = 0.7), близко к елке (Z = 0.3)
      cache.set(topBall3.id, [0.7, 8.0, 0.3]);
    }
    
    return cache;
  }, [allToys]);

  // Основная функция для получения позиции шара (использует кэш с проверкой расстояний)
  const getBallPosition = (toyId: string): [number, number, number] => {
    // Возвращаем позицию из кэша (уже с проверкой минимального расстояния)
    const cachedPos = ballPositionsCache.get(toyId);
    if (cachedPos) {
      return cachedPos;
    }
    // Если позиции нет в кэше (не должно происходить), генерируем базовую
    return generateBaseBallPosition(toyId);
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

      {/* Ёлка - разные варианты (на мобильных используем без MTL для ускорения) */}
      {treeType === '3d' && treeModel && treeModel.endsWith('.obj') && (
        <group ref={treeRotationGroupRef} rotation={[0, -48 * (Math.PI / 180), 0]}> {/* Базовый поворот налево на 48 градусов (было 46, добавили еще 2), автоматическое вращение добавляется в useFrame */}
        <Suspense fallback={null} key={`obj-${treeModel}`}>
          {/* На мобильных устройствах загружаем без MTL для ускорения */}
          {typeof window !== 'undefined' && window.innerWidth < 768 ? (
            <OBJTreeWithoutMTL objPath={treeModel} glowEnabled={glowEnabled} isNewYearAnimation={isNewYearAnimation} treeOpacity={treeOpacity} />
          ) : treeModel.startsWith('/') ? (
            <ErrorBoundary fallback={<OBJTreeWithoutMTL objPath={treeModel} glowEnabled={glowEnabled} isNewYearAnimation={isNewYearAnimation} treeOpacity={treeOpacity} />}>
              <OBJTreeWithMTL 
                objPath={treeModel} 
                mtlPath={treeModel.endsWith('.obj') ? treeModel.replace(/\.obj$/, '.mtl') : treeModel + '.mtl'}
                glowEnabled={glowEnabled}
                isNewYearAnimation={isNewYearAnimation}
                treeOpacity={treeOpacity}
              />
            </ErrorBoundary>
          ) : (
            <OBJTreeWithoutMTL objPath={treeModel} glowEnabled={glowEnabled} isNewYearAnimation={isNewYearAnimation} treeOpacity={treeOpacity} />
          )}
        </Suspense>
        </group>
      )}

      {/* Шары на ПЕРЕДНЕМ ПЛАНЕ - ВНЕ группы елки, статично на экране */}
      {/* Скрываем во время новогодней анимации и до загрузки елки */}
      {!isNewYearAnimation && isTreeLoaded && visibleToys.map((toy) => {
        const isUserBall = currentUserId && toy.user_id === currentUserId;
        const isTestBall = toy.id.startsWith('test-ball-');
        const position = getBallPosition(toy.id);
        const distance = getDistance(position);
        
        return (
          <BallOnTree
            key={toy.id}
            toy={toy}
            position={position}
            isUserBall={!!isUserBall}
            onClick={isTestBall ? () => {} : () => onBallClick?.(toy)}
            onLike={isTestBall ? () => {} : () => onBallLike?.(toy.id)}
            distance={distance}
          />
        );
      })}

      {/* Новогодняя анимация (1 января) */}
      {isNewYearAnimation && (
        <NewYearAnimation 
          toys={toys} 
          onComplete={onAnimationComplete}
          onTreeOpacityChange={(opacity) => {
            setTreeOpacity(opacity);
          }}
        />
      )}

      {/* Звёзды на фоне - скрываем во время новогодней анимации (будет черный космос) */}
      {!isNewYearAnimation && (
      <Stars radius={100} depth={50} count={5000} factor={4} fade speed={1} />
      )}

      {/* Падающий снег на фоне */}
      <FallingSnow />

      {/* Управление камерой - ПРИМЕНЯЕТСЯ ОДИНАКОВО ДЛЯ ВСЕХ УСТРОЙСТВ (мобильные и десктоп) */}
      {/* Строгие ограничения поворотов и наклонов одинаковы для всех устройств */}
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={10}
        maxDistance={30}
        minPolarAngle={Math.PI / 3} // Наклон вперед отключен (одинаково для всех устройств)
        maxPolarAngle={Math.PI / 3 + 2 * (Math.PI / 180)} // Отклонение назад максимум на 2 градуса (одинаково для всех устройств)
        minAzimuthAngle={-0.5 * (Math.PI / 180)} // Ограничение: влево максимум на 0.5 градуса (одинаково для всех устройств)
        maxAzimuthAngle={7 * (Math.PI / 180)}  // Ограничение: вправо максимум на 7 градусов (одинаково для всех устройств)
        enableDamping={true}
        dampingFactor={0.05}
        target={[0, 0, 0]} // Четко центр для всех устройств
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
  isNewYearAnimation = false,
  onAnimationComplete,
}: VirtualTreeProps) {
  // Состояние для переключателя подсветки
  const [glowEnabled, setGlowEnabled] = useState(false);
  
  // Проверяем, можно ли включить подсветку (только после 23:59 31 декабря, т.е. с 1 января)
  // Используем локальное время пользователя, а не UTC
  const canEnableGlow = (): boolean => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    const date = now.getDate();
    
    // Проверяем: если год >= 2026 И (месяц > 0 ИЛИ (месяц === 0 И дата >= 1))
    // То есть: 1 января 2026 или позже
    if (year > 2026) return true;
    if (year === 2026 && month > 0) return true;
    if (year === 2026 && month === 0 && date >= 1) return true;
    
    return false;
  };

  const isGlowEnabled = canEnableGlow();
  
  // Получаем текст для тултипа
  const glowTooltip = isGlowEnabled ? 'Переключить подсветку ёлки' : 'Подсветку елочки можно будет включить 1го января..';

  return (
    <div className="w-full bg-gradient-to-b from-indigo-950 via-purple-950 to-indigo-950 relative" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#1e1b4b' }}>
      {/* Переключатель подсветки - виден всем, но активен только с 1 января */}
      <button
        onClick={() => {
          if (isGlowEnabled) {
            setGlowEnabled(!glowEnabled);
          }
        }}
        disabled={!isGlowEnabled}
        className={`absolute top-20 left-4 z-50 bg-slate-800/90 backdrop-blur-md border-2 border-white/30 rounded-lg px-4 py-2 text-white text-xs font-bold shadow-xl transition-all ${
          isGlowEnabled 
            ? 'hover:bg-slate-700 cursor-pointer' 
            : 'opacity-60 cursor-not-allowed'
        }`}
        title={glowTooltip}
      >
        {glowEnabled ? '💡 Подсветка: ВКЛ' : '💡 Подсветка: ВЫКЛ'}
      </button>
      <Canvas 
        style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', top: 0, left: 0 }}
        gl={{ 
          preserveDrawingBuffer: true, 
          antialias: typeof window !== 'undefined' && window.innerWidth >= 768, // Отключаем antialiasing на мобильных для ускорения
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          alpha: false
        }}
        dpr={typeof window !== 'undefined' && window.innerWidth < 768 ? Math.min(window.devicePixelRatio, 1.5) : undefined} // Ограничиваем DPR на мобильных
      >
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
            isNewYearAnimation={isNewYearAnimation}
            onAnimationComplete={onAnimationComplete}
            glowEnabled={glowEnabled}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

