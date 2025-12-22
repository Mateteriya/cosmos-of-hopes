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
import { Snowflakes } from './Snowflakes';
import { TreeSnowflakes } from './TreeSnowflakes';
import { Fireworks } from './Fireworks';
import { Confetti } from './Confetti';
import { NewYearSigns } from './NewYearSigns';
import { WishSigns } from './WishSigns';

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
            side={THREE.DoubleSide} // Показываем обе стороны для лучшей видимости кастомного дизайна
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
    if (treeRef.current) {
      // Медленное вращение ёлки
      treeRef.current.rotation.y += 0.001;
    }
    
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
        material.transparent = true; // Всегда включаем прозрачность для корректной работы
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
            material.transparent = true; // Всегда включаем прозрачность для корректной работы
            material.needsUpdate = true; // Важно: обновляем материал!
            if (material.map) material.map.needsUpdate = true; // Обновляем текстуру если есть
            material.opacity = 1.0 * treeOpacity; // Применяем общую прозрачность елки
            material.transparent = treeOpacity < 1.0; // Включаем прозрачность только если нужно
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
  
  // Позиционируем модель: центрируем по горизонтали (X, Z), смещаем вниз по вертикали (Y)
  // Для точного центрирования используем пересчитанный центр после скрытия фона
  // Если пересчитанный центр доступен, используем его, иначе используем исходный центр
  const actualCenter = recalculatedCenter || center;
  // Если центр очень маленький (меньше 0.5), принудительно центрируем по X
  const positionX = Math.abs(actualCenter.x * scale) < 0.5 ? 0 : -actualCenter.x * scale;
  const positionZ = -actualCenter.z * scale; // Центрируем по Z (компенсируем смещение центра модели)
  
  // Если модель все еще смещена, возможно нужно принудительно центрировать
  // Но сначала проверим логи - там должно быть видно center.x
  
  // Центрируем по Y, затем смещаем вниз на фиксированное значение
  // Камера на Y=2, смотрит на Y=0, поэтому для нижней трети экрана нужно сместить вниз
  const centeredY = -actualCenter.y * scale; // Центрированная позиция (используем пересчитанный центр)
  const offsetDown = -32; // Смещение вниз (немного уменьшено, чтобы поднять ёлку)
  const positionY = centeredY + offsetDown;
  
  console.log('Позиционирование ёлки:', {
    originalCenter: { x: center.x.toFixed(2), y: center.y.toFixed(2), z: center.z.toFixed(2) },
    recalculatedCenter: recalculatedCenter ? { x: recalculatedCenter.x.toFixed(2), y: recalculatedCenter.y.toFixed(2), z: recalculatedCenter.z.toFixed(2) } : 'не пересчитан',
    actualCenter: { x: actualCenter.x.toFixed(2), y: actualCenter.y.toFixed(2), z: actualCenter.z.toFixed(2) },
    position: { x: positionX.toFixed(2), y: positionY.toFixed(2), z: positionZ.toFixed(2) },
    modelSizeY: modelSize.y.toFixed(2),
    centeredY: centeredY.toFixed(2),
    offsetDown,
    scale: scale.toFixed(4)
  });

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
      {/* Падающие снежинки (скрываем при новогодней анимации после 14 секунды) */}
      {!isNewYearAnimation && (
        <Snowflakes 
          count={150} 
          speed={0.4} 
          size={0.08}
          area={{ width: 60, height: 80, depth: 60 }}
        />
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
  const { camera } = useThree();
  const [visibleToys, setVisibleToys] = useState<Toy[]>([]);
  const [treeOpacity, setTreeOpacity] = useState<number>(1.0); // Прозрачность елки для новогодней анимации

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
      const pos = getBallPosition(toy.id);
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

  // Генерация позиций для шаров на ёлке - детерминированное распределение по всей ёлке
  // Использует toy.id для создания уникальной позиции каждого шара
  // Работает для любого количества шаров (сотни тысяч) без создания кучи
  const getBallPosition = (toyId: string): [number, number, number] => {
    // Создаем хеш из ID для детерминированного, но равномерного распределения
    // Используем простую хеш-функцию для преобразования строки в число
    let hash = 0;
    for (let i = 0; i < toyId.length; i++) {
      const char = toyId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Конвертируем в 32-битное число
    }
    // Нормализуем хеш в положительное число
    const normalizedHash = Math.abs(hash);
    
    // Распределение по всей высоте ёлки (от низа до верха)
    // Используем хеш для определения высоты - равномерное распределение
    const heightRatio = (normalizedHash % 10000) / 10000; // От 0 до 1
    // Высота от -4.5 (низ) до 7.0 (верх) - вся ёлка, верхние шары опущены ниже
    const height = -4.5 + heightRatio * 11.5; // От -4.5 до 7.0
    
    // Распределение углов - равномерное по всей окружности
    const angleRatio = ((normalizedHash >> 10) % 10000) / 10000; // От 0 до 1, используем другую часть хеша
    const angle = angleRatio * Math.PI * 2; // От 0 до 2π
    
    // ============================================================
    // ЗАФИКСИРОВАННОЕ ПРАВИЛО: Шары ВСЕГДА должны ПРИКАСАТЬСЯ к ёлке!
    // ============================================================
    // Ёлка имеет КОНУСООБРАЗНУЮ форму - сверху тоньше, снизу шире!
    // Вычисляем точный радиус поверхности ёлки на данной высоте:
    // - Внизу (height = -4.5): максимальный радиус = 4.8 единицы
    // - Вверху (height = 7.0): минимальный радиус = 0.4 единицы
    // - Линейная интерполяция между ними для точного конуса
    const minHeight = -4.5; // Нижняя точка ёлки (опущена ниже)
    const maxHeight = 7.0;  // Верхняя точка ёлки (опущена еще ниже для верхних шаров)
    const heightRange = maxHeight - minHeight; // 11.5 единиц
    
    // Нормированная высота от 0 (низ) до 1 (верх)
    const normalizedHeight = (height - minHeight) / heightRange;
    
    // Радиус конуса на данной высоте (линейная интерполяция)
    // ВАЖНО: Используем РЕАЛЬНЫЕ размеры видимой части ёлки (после скрытия фона)
    // Из логов видно, что модель масштабируется, но реальная видимая ёлка намного меньше
    // Используем правильные значения для соприкосновения шаров с ёлкой
    const maxRadius = 4.8;  // Максимальный радиус внизу (скорректировано для реальной формы)
    const minRadius = 0.4;  // Минимальный радиус вверху (скорректировано для реальной формы)
    const treeSurfaceRadius = maxRadius - (maxRadius - minRadius) * normalizedHeight;
    
    // Радиус самого шара
    const ballRadius = 0.4;
    
    // ============================================================
    // ПРАВИЛО ПРИЛИПАНИЯ: Шары ВСЕГДА должны ПРИЛИПАТЬ к краям ёлки!
    // ============================================================
    // Чтобы шар ПРИЛИПАЛ к поверхности ёлки, его центр должен быть ВНУТРИ поверхности ёлки
    // Используем МАКСИМАЛЬНО АГРЕССИВНОЕ уменьшение радиуса для гарантированного ПРИЛИПАНИЯ:
    // - Вычитаем ПОЛНЫЙ радиус шара (ballRadius)
    // - Дополнительно уменьшаем еще на 200-250% для гарантии, что шар "вдавливается" в ёлку
    // - Для ВСЕХ шаров используем одинаково агрессивное уменьшение
    // - Это гарантирует, что шар НИКОГДА не будет парить рядом с ёлкой - он ПРИЛИПАЕТ!
    const reductionFactor = 3.0; // МАКСИМАЛЬНЫЙ коэффициент уменьшения (200% дополнительно!)
    // ПРИЛИПАНИЕ: центр шара размещается ГЛУБОКО ВНУТРИ поверхности ёлки
    const ballCenterRadius = Math.max(0.05, treeSurfaceRadius - ballRadius * reductionFactor);
    
    // Позиция строго на поверхности ёлки (ШАР СОПРИКАСАЕТСЯ С ЁЛКОЙ!)
    // Учитываем вращение ёлки - угол уже вычислен выше
    const pos: [number, number, number] = [
      Math.cos(angle) * ballCenterRadius,
      height,
      Math.sin(angle) * ballCenterRadius,
    ];
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
      {treeType === '3d' && treeModel && treeModel.endsWith('.obj') && (
        <Suspense fallback={null} key={`obj-${treeModel}`}>
          {treeModel.startsWith('/') ? (
            <ErrorBoundary fallback={<OBJTreeWithoutMTL objPath={treeModel} glowEnabled={glowEnabled} isNewYearAnimation={isNewYearAnimation} treeOpacity={treeOpacity} />}>
              <OBJTreeWithMTL 
                objPath={treeModel} 
                mtlPath={treeModel.replace('.obj', '.mtl')}
                glowEnabled={glowEnabled}
                isNewYearAnimation={isNewYearAnimation}
                treeOpacity={treeOpacity}
              />
            </ErrorBoundary>
          ) : (
            <OBJTreeWithoutMTL objPath={treeModel} glowEnabled={glowEnabled} isNewYearAnimation={isNewYearAnimation} treeOpacity={treeOpacity} />
          )}
        </Suspense>
      )}

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

      {/* Шары на ёлке (только видимые) - скрываем во время новогодней анимации */}
      {!isNewYearAnimation && visibleToys.map((toy) => {
        const isUserBall = currentUserId && toy.user_id === currentUserId;
        const position = getBallPosition(toy.id);
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

      {/* Звёзды на фоне - скрываем во время новогодней анимации (будет черный космос) */}
      {!isNewYearAnimation && (
      <Stars radius={100} depth={50} count={5000} factor={4} fade speed={1} />
      )}

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
  isNewYearAnimation = false,
  onAnimationComplete,
}: VirtualTreeProps) {
  // Состояние для переключателя подсветки (только для разработчика)
  const [glowEnabled, setGlowEnabled] = useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="w-full h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Переключатель подсветки - виден только разработчику */}
      {isDevelopment && (
        <button
          onClick={() => setGlowEnabled(!glowEnabled)}
          className="absolute top-20 left-4 z-50 bg-slate-800/90 backdrop-blur-md border-2 border-white/30 rounded-lg px-4 py-2 text-white text-xs font-bold shadow-xl hover:bg-slate-700 transition-all"
          title="Переключить подсветку ёлки"
        >
          {glowEnabled ? '💡 Подсветка: ВКЛ' : '💡 Подсветка: ВЫКЛ'}
        </button>
      )}
      <Canvas style={{ width: '100%', height: '100%', display: 'block' }}>
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

