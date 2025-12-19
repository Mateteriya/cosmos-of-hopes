'use client';

/**
 * Виртуальная ёлка - главный экран приложения
 * 3D сцена с ёлкой, украшенной шарами со всего мира
 */

import { Suspense, useRef, useState, useEffect, useMemo, Component, ReactNode } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import type { Toy } from '@/types/toy';

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
function OBJTreeWithoutMTL({ objPath, glowEnabled = false }: { objPath: string; glowEnabled?: boolean }) {
  return <OBJTreeContent objPath={objPath} materials={null} glowEnabled={glowEnabled} />;
}

// Компонент для загрузки OBJ модели С MTL материалами
function OBJTreeWithMTL({ objPath, mtlPath, glowEnabled = false }: { objPath: string; mtlPath: string; glowEnabled?: boolean }) {
  // Настраиваем путь для загрузки текстур (относительно MTL файла)
  const mtlDir = mtlPath.includes('/') 
    ? mtlPath.substring(0, mtlPath.lastIndexOf('/') + 1) 
    : '/';
  
  // Загружаем материалы из MTL файла
  const materials = useLoader(MTLLoader, mtlPath, (loader) => {
    loader.setPath(mtlDir || '/');
  });
  
  return <OBJTreeContent objPath={objPath} materials={materials} glowEnabled={glowEnabled} />;
}

// Основной компонент для загрузки OBJ модели
function OBJTreeContent({ objPath, materials, glowEnabled = false }: { objPath: string; materials: any; glowEnabled?: boolean }) {
  const treeRef = useRef<THREE.Group>(null);
  const meshMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]); // Ссылки на материалы для анимации
  const originalColorsRef = useRef<THREE.Color[]>([]); // Сохраняем исходные цвета материалов для восстановления
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
  useEffect(() => {
    if (!clonedObj) {
      return; // Не сбрасываем recalculatedCenter, чтобы избежать мигания при переключении режимов
    }
    
    // Сохраняем текущие значения перед применением материалов
    // чтобы избежать мигания при переключении режимов
    const previousRecalculatedCenter = previousRecalculatedCenterRef.current || recalculatedCenter;
    const previousModelSize = previousModelSizeRef.current || modelSize;
    
    // Очищаем массив материалов перед применением новых
    meshMaterialsRef.current = [];
      
      let meshCount = 0;
      let replacedCount = 0;
      
      // Если MTL не загружен (materials === null), заменяем ВСЕ материалы
      const shouldReplaceAll = !materials;
      
      clonedObj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshCount++;
          
          // Проверяем, не является ли объект очень большим плоским фоном
          // Если размер по одной из осей очень маленький, а по другим очень большой - это фон
          const geometry = child.geometry;
          if (geometry) {
            geometry.computeBoundingBox();
            const box = geometry.boundingBox;
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
          
          let needsMaterial = false;
          
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
            
            // Всегда создаем материалы с градиентом по умолчанию (режим БЕЗ подсветки)
            // В useFrame будем менять их свойства в зависимости от glowEnabled
            const gradientPos = (meshCount % 100) / 100;
            
            // Цвета градиента (HSL значения) - добавлены ЧИСТЫЕ глубокие зелёные цвета!
            const gradientColors = [
              { h: 120, s: 100, l: 30 },   // ЧИСТЫЙ глубокий темно-зеленый
              { h: 120, s: 100, l: 25 },   // ЧИСТЫЙ очень темно-зеленый
              { h: 120, s: 100, l: 35 },   // ЧИСТЫЙ темно-зеленый
              { h: 120, s: 100, l: 40 },   // ЧИСТЫЙ средне-зеленый
              { h: 120, s: 100, l: 30 },   // ЧИСТЫЙ глубокий темно-зеленый (повтор)
              { h: 270, s: 100, l: 50 },   // Фиолетовый
              { h: 120, s: 100, l: 25 },   // ЧИСТЫЙ очень темно-зеленый (повтор)
              { h: 270, s: 100, l: 30 },   // Глубокий фиолетовый
              { h: 120, s: 100, l: 35 },   // ЧИСТЫЙ темно-зеленый (повтор)
              { h: 240, s: 100, l: 50 },   // Индиго
              { h: 120, s: 100, l: 30 },   // ЧИСТЫЙ глубокий темно-зеленый (повтор)
              { h: 300, s: 100, l: 70 },   // Сиреневый
              { h: 120, s: 100, l: 25 },   // ЧИСТЫЙ очень темно-зеленый (повтор)
              { h: 200, s: 100, l: 50 },   // Сине-голубой
              { h: 120, s: 100, l: 35 },   // ЧИСТЫЙ темно-зеленый (повтор)
            ];
            
            // Находим два ближайших цвета для интерполяции
            const colorIndex = Math.floor(gradientPos * (gradientColors.length - 1));
            const nextColorIndex = Math.min(colorIndex + 1, gradientColors.length - 1);
            const t = (gradientPos * (gradientColors.length - 1)) - colorIndex;
            
            const color1 = gradientColors[colorIndex];
            const color2 = gradientColors[nextColorIndex];
            
            // Интерполируем между цветами БЕЗ вариаций для чистых зелёных цветов
            const hue = color1.h + (color2.h - color1.h) * t;
            const saturation = (color1.s + (color2.s - color1.s) * t) / 100;
            const lightness = (color1.l + (color2.l - color1.l) * t) / 100;
            
            // УБИРАЕМ вариации, которые делают цвета белыми/серебристыми/неоновыми
            const hueVariation = ((meshCount % 7) - 3) * 2;
            const saturationVariation = ((meshCount % 5) - 2) * 0.02;
            const lightnessVariation = ((meshCount % 6) - 2.5) * 0.02;
            
            const finalHue = (hue + hueVariation + 360) % 360;
            const finalSaturation = Math.max(0.7, Math.min(1.0, saturation + saturationVariation));
            const finalLightness = Math.max(0.2, Math.min(0.5, lightness + lightnessVariation));
            
            const color = new THREE.Color().setHSL(finalHue / 360, finalSaturation, finalLightness);
            const emissiveIntensity = 0.05 + (meshCount % 2) * 0.02;
            
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
            // Сохраняем исходный цвет материала для восстановления в режиме БЕЗ подсветки
            originalColorsRef.current.push(color.clone());
          }
    }
  });

      console.log(`Материалы применены: ${meshCount} мешей, ${replacedCount} заменено, MTL загружен: ${!!materials}`);
      
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
  const colorPalette = useMemo(() => [
    { h: 270, s: 100, l: 50, opacity: 1.0 },   // Фиолетовый
    { h: 240, s: 100, l: 50, opacity: 1.0 },   // Индиго
    { h: 200, s: 100, l: 50, opacity: 1.0 },   // Голубой
    { h: 300, s: 100, l: 70, opacity: 1.0 },   // Сиреневый
    { h: 120, s: 100, l: 50, opacity: 1.0 },   // Зеленый
    { h: 90, s: 100, l: 50, opacity: 1.0 },    // Салатовый
    { h: 45, s: 100, l: 50, opacity: 1.0 },    // Золотой
    { h: 0, s: 0, l: 75, opacity: 1.0 },       // Серебристый
    { h: 180, s: 100, l: 60, opacity: 0.7 },   // Неоновый голубой (с прозрачностью)
    { h: 300, s: 100, l: 80, opacity: 0.8 },   // Неоновый розовый (с прозрачностью)
    { h: 120, s: 100, l: 60, opacity: 0.9 },   // Неоновый зеленый (с прозрачностью)
    { h: 270, s: 100, l: 50, opacity: 0.6 },   // Фиолетовый (более прозрачный)
    { h: 200, s: 100, l: 50, opacity: 0.5 },   // Голубой (более прозрачный)
    { h: 120, s: 100, l: 50, opacity: 0.4 },   // Зеленый (более прозрачный)
    { h: 270, s: 100, l: 50, opacity: 0.9 },   // Фиолетовый (менее прозрачный)
    { h: 200, s: 100, l: 50, opacity: 1.0 },   // Голубой (полная непрозрачность)
  ], []);

  useFrame((state) => {
    if (treeRef.current) {
      // Медленное вращение ёлки
      treeRef.current.rotation.y += 0.001;
    }
    
    // В режиме БЕЗ подсветки восстанавливаем исходные цвета материалов
    if (!glowEnabled) {
      meshMaterialsRef.current.forEach((material, index) => {
        if (!material || !originalColorsRef.current[index]) return;
        const originalColor = originalColorsRef.current[index];
        material.color.copy(originalColor);
        material.emissive.copy(originalColor);
        material.emissiveIntensity = 0.05 + (index % 2) * 0.02; // Восстанавливаем исходную интенсивность
        material.opacity = 1.0;
        material.transparent = false;
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
    meshMaterialsRef.current.forEach((material, index) => {
      if (!material) return;
      
      // Очень небольшая вариация яркости для эффекта "отливов" (минимальная!)
      const brightnessVariation = 0.98 + (Math.sin(time * 1.2 + index * 0.08) * 0.02); // От 0.96 до 1.0 (еще меньше!)
      const variedColor = currentColor.clone().multiplyScalar(brightnessVariation);
      
      material.color.copy(variedColor);
      material.emissive.copy(variedColor);
      
      // МИНИМАЛЬНОЕ свечение для сохранения видимости контуров и рельефности (особенно веток в центре!)
      // Уменьшено еще больше для лучшей видимости контуров
      material.emissiveIntensity = 0.015 + Math.sin(time * 1.0 + index * 0.06) * 0.01; // От 0.005 до 0.025 (очень минимально!)
      
      // Применяем прозрачность (opacity) для эффекта прибавления/убавления
      material.opacity = opacity;
      material.transparent = opacity < 1.0; // Включаем прозрачность только если нужно
      
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

          return (
    <group 
      ref={treeRef} 
      scale={[scale, scale, scale]}
      position={[positionX, positionY, positionZ]}
    >
      {/* Сама 3D-ёлка */}
      <primitive object={clonedObj} />
      {/* Свечение ствола изнутри */}
      <TrunkGlow enabled={glowEnabled} />
    </group>
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
}: {
  toys: Toy[];
  onComplete?: () => void;
}) {
  const animationRef = useRef<THREE.Group>(null);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'flying' | 'spiral' | 'scattering' | 'complete'>('idle');
  const startTimeRef = useRef<number>(0);
  const sparkRefs = useRef<THREE.Mesh[]>([]);

  // Количество «искорок» в анимации (берём по количеству шаров, но не больше 80)
  const sparksCount = Math.min(toys.length > 0 ? toys.length : 50, 80);

  useEffect(() => {
    // Запускаем анимацию при монтировании
    setAnimationPhase('flying');
    startTimeRef.current = Date.now();
  }, []);

  useFrame((state) => {
    if (!animationRef.current || animationPhase === 'idle' || animationPhase === 'complete') return;

    const elapsed = (Date.now() - startTimeRef.current) / 1000; // Время в секундах

    // Простая тестовая анимация «искорок», чтобы было видно запуск:
    // Фаза 1: слетают с ёлки вверх и в сторону
    // Фаза 2: закручиваются в спираль
    // Фаза 3: разлетаются в космос

    for (let i = 0; i < sparksCount; i++) {
      const mesh = sparkRefs.current[i];
      if (!mesh) continue;

      const t = i / sparksCount; // 0..1
      const baseHeight = -2 + t * 10;
      const baseRadius = 2 + t * 2;
      const baseAngle = t * Math.PI * 4;

      if (animationPhase === 'flying' && elapsed < 3) {
        const k = elapsed / 3; // 0..1
        const angle = baseAngle + k * Math.PI * 2;
        const r = baseRadius * (1 + k * 0.5);
        const y = baseHeight + k * 4;
        mesh.position.set(
          Math.cos(angle) * r,
          y,
          Math.sin(angle) * r,
        );
        if (elapsed >= 3) {
          setAnimationPhase('spiral');
        }
      } else if (animationPhase === 'spiral' && elapsed < 6) {
        const k = (elapsed - 3) / 3; // 0..1
        const angle = baseAngle + k * Math.PI * 6;
        const r = baseRadius * (1.5 - k * 0.5);
        const y = baseHeight + 4 + k * 3;
        mesh.position.set(
          Math.cos(angle) * r,
          y,
          Math.sin(angle) * r,
        );
        if (elapsed >= 6) {
          setAnimationPhase('scattering');
        }
      } else if (animationPhase === 'scattering' && elapsed < 10) {
        const k = (elapsed - 6) / 4; // 0..1
        const angle = baseAngle + k * Math.PI * 8;
        const r = baseRadius * (2 + k * 3);
        const y = baseHeight + 7 + k * 8;
        mesh.position.set(
          Math.cos(angle) * r,
          y,
          Math.sin(angle) * r,
        );
        if (elapsed >= 10) {
          setAnimationPhase('complete');
          onComplete?.();
        }
      }
    }
  });

  // Тестовые «искорки» для визуализации новогодней анимации
  return (
    <group ref={animationRef}>
      {Array.from({ length: sparksCount }).map((_, index) => {
        const hue = (index / sparksCount);
        const color = new THREE.Color();
        color.setHSL(hue, 1, 0.6);
          return (
            <mesh 
            key={index}
            ref={(ref) => {
              if (ref) sparkRefs.current[index] = ref;
            }}
          >
            <sphereGeometry args={[0.15, 10, 10]} />
              <meshStandardMaterial 
              color={color}
              emissive={color}
              emissiveIntensity={1.6}
              />
            </mesh>
          );
        })}
    </group>
  );
}

// Основной компонент сцены (оптимизирован для миллионов шаров)
function TreeScene({ toys, currentUserId, onBallClick, onBallLike, userHasLiked, treeImageUrl, treeType, treeModel, isNewYearAnimation, onAnimationComplete, glowEnabled = false }: VirtualTreeProps) {
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
            <ErrorBoundary fallback={<OBJTreeWithoutMTL objPath={treeModel} glowEnabled={glowEnabled} />}>
              <OBJTreeWithMTL 
                objPath={treeModel} 
                mtlPath={treeModel.replace('.obj', '.mtl')}
                glowEnabled={glowEnabled}
              />
            </ErrorBoundary>
          ) : (
            <OBJTreeWithoutMTL objPath={treeModel} glowEnabled={glowEnabled} />
          )}
        </Suspense>
      )}

      {/* Новогодняя анимация (1 января) */}
      {isNewYearAnimation && (
        <NewYearAnimation toys={toys} onComplete={onAnimationComplete} />
      )}

      {/* Шары на ёлке (только видимые) */}
      {visibleToys.map((toy) => {
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
  isNewYearAnimation = false,
  onAnimationComplete,
}: VirtualTreeProps) {
  // Состояние для переключателя подсветки (только для разработчика)
  const [glowEnabled, setGlowEnabled] = useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="w-full h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 relative">
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
            isNewYearAnimation={isNewYearAnimation}
            onAnimationComplete={onAnimationComplete}
            glowEnabled={glowEnabled}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

