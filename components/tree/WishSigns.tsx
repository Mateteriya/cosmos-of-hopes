'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Toy } from '@/types/toy';

// Компонент для рендеринга звезд с обновлением позиций
function StarsRenderer({ particles }: { particles: Array<{ position: THREE.Vector3; velocity: THREE.Vector3; color: THREE.Color; size: number }> }) {
  const meshesRef = useRef<THREE.Mesh[]>([]);
  
  useFrame(() => {
    // Обновляем позиции мешей из частиц
    particles.forEach((particle, index) => {
      if (meshesRef.current[index]) {
        meshesRef.current[index].position.copy(particle.position);
      }
    });
  });
  
  return (
    <group>
      {particles.map((particle, index) => (
        <mesh 
          key={`star-${index}`} 
          ref={(el) => {
            if (el) meshesRef.current[index] = el;
          }}
          position={particle.position}
        >
          <sphereGeometry args={[particle.size, 8, 8]} />
          <meshStandardMaterial
            color={particle.color}
            emissive={particle.color}
            emissiveIntensity={15}
            transparent
            opacity={1.0}
            roughness={0.0}
            metalness={0.0}
          />
        </mesh>
      ))}
    </group>
  );
}

interface WishSignsProps {
  enabled?: boolean;
  toys: Toy[]; // Пользовательские шары с желаниями
  startTime?: number; // Время начала анимации для синхронизации
  initialPositions?: THREE.Vector3[]; // Начальные позиции (позиции шаров на момент превращения)
  onExplosionComplete?: () => void; // Callback после завершения взрыва
}

interface WishSignData {
  position: THREE.Vector3;
  originalPosition: THREE.Vector3; // Исходная позиция
  targetPositions: THREE.Vector3[]; // Минимум 3 целевые позиции для смены
  text: string; // Текст желания
  authorName?: string; // Имя автора (если есть)
  baseHue: number;
  timeOffset: number;
  scaleDelay: number; // Задержка для увеличения по очереди (0-1)
  toyId: string; // ID шара для отслеживания
}

export function WishSigns({ enabled = true, toys, startTime, initialPositions, onExplosionComplete }: WishSignsProps) {
  const startTimeRef = useRef<number>(startTime || Date.now());
  
  // Обновляем время начала при изменении пропса
  useEffect(() => {
    if (startTime) {
      startTimeRef.current = startTime;
    }
  }, [startTime]);
  
  const signRefs = useRef<Array<{ element: HTMLDivElement | null; data: WishSignData }>>([]);
  const [signPositions, setSignPositions] = useState<THREE.Vector3[]>([]);
  const lastPositionUpdateRef = useRef<number>(0);
  const [explosionPhase, setExplosionPhase] = useState<'normal' | 'exploding' | 'stars'>('normal');
  const starParticlesRef = useRef<Array<{ position: THREE.Vector3; velocity: THREE.Vector3; color: THREE.Color; size: number }>>([]);
  const hasCalledExplosionCompleteRef = useRef<boolean>(false); // Ref для отслеживания вызова callback
  const starMeshesRef = useRef<THREE.Mesh[]>([]); // Ref для мешей звезд
  const plasmaCloudsRef = useRef<any[]>([]); // Ref для облаков плазмы (должен быть в начале!)
  const year2026ParticlesRef = useRef<Array<{ position: THREE.Vector3; color: THREE.Color; size: number; originalPosition: THREE.Vector3 }>>([]); // Ref для частиц "2026"
  const year2026MeshesRef = useRef<THREE.Mesh[]>([]); // Ref для мешей "2026"
  const backgroundStarsRef = useRef<Array<{ position: THREE.Vector3; color: THREE.Color; size: number }>>([]); // Ref для фоновых звездочек
  const backgroundStarsMeshesRef = useRef<THREE.Mesh[]>([]); // Ref для мешей фоновых звездочек

  // Фильтруем шары с желаниями и создаем таблички
  const signs = useMemo(() => {
    if (!enabled || !toys || toys.length === 0) return [];
    
    // Фильтруем только шары с желаниями (wish_text или wish_for_others)
    const toysWithWishes = toys.filter(toy => 
      (toy.wish_text && toy.wish_text.trim().length > 0) || 
      (toy.wish_for_others && toy.wish_for_others.trim().length > 0)
    );
    
    if (toysWithWishes.length === 0) return [];
    
    // Ограничиваем количество для производительности (максимум 50)
    const count = Math.min(toysWithWishes.length, 50);
    const signs: WishSignData[] = [];
    
    for (let i = 0; i < count; i++) {
      const toy = toysWithWishes[i];
      
      // Используем wish_text, если есть, иначе wish_for_others
      const wishText = (toy.wish_text && toy.wish_text.trim()) || 
                      (toy.wish_for_others && toy.wish_for_others.trim()) || 
                      'Желание';
      
      // Обрезаем текст до 100 символов для читаемости
      const displayText = wishText.length > 100 ? wishText.substring(0, 97) + '...' : wishText;
      
      // ВСЕ таблички появляются В ЦЕНТРЕ ЭКРАНА (в одной точке), загораживая всю елку!
      // Размещаем их перед камерой (ближе к камере, чем елка)
      const centerX = 0;
      const centerY = 0; // По центру экрана по вертикали
      const centerZ = -5; // Перед елкой (ближе к камере), чтобы загораживать ее
      
      // ВСЕ таблички в одной точке в центре - без смещения!
      const originalPosition = new THREE.Vector3(centerX, centerY, centerZ);
      
      // Создаем целевые позиции для разлета - ВСЕ таблички сначала в центре, потом разлетаются
      const targetPositions: THREE.Vector3[] = [originalPosition.clone()]; // Первая позиция - центр экрана (все вместе!)
      
      // ВСЕ таблички остаются в центре (первая позиция), затем разлетаются
      for (let j = 0; j < 3; j++) {
        // Генерируем позиции для разлета - таблички разлетаются в разные стороны от центра
        const scatterAngle = (Math.PI * 2 * (i + j * 0.3)) / count;
        const scatterRadius = 10 + j * 5; // Увеличивающийся радиус разлета (дальше!)
        const scatterHeight = (Math.random() - 0.5) * 8; // Вертикальный разброс (больше!)
        
        // Разлетаются от центра экрана в разные стороны
        const newX = Math.cos(scatterAngle) * scatterRadius;
        const newY = scatterHeight;
        const newZ = -5 + scatterRadius * 0.3; // Немного отдаляются от камеры при разлете
        
        targetPositions.push(new THREE.Vector3(newX, newY, newZ));
      }
      
      // Разные базовые цвета для каждой таблички
      const baseHue = (i / count) % 1; // Распределение по всему спектру
      const timeOffset = Math.random() * Math.PI * 2; // Случайное смещение для анимации
      const scaleDelay = i / count; // Задержка для увеличения по очереди (0-1)
      
      signs.push({
        position: originalPosition.clone(),
        originalPosition,
        targetPositions,
        text: displayText,
        authorName: toy.user_name || undefined,
        baseHue,
        timeOffset,
        scaleDelay,
        toyId: toy.id,
      });
    }
    
    // Инициализируем позиции (только один раз при создании)
    const initialSignPositions = signs.map(s => s.position.clone());
    setSignPositions(initialSignPositions);
    lastPositionUpdateRef.current = 0; // Сбрасываем таймер обновления
    
    return signs;
  }, [enabled, toys, initialPositions]);

  // Обновляем позиции звезд в useFrame (объединено с основной анимацией)
  useFrame((state, delta) => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000; // Время в секундах
    
    // ВАЖНО: Звездочки должны обновляться БЕСКОНЕЧНО, даже если таблички выключены!
    // Используем type assertion для проверки фазы взрыва
    const isStarsPhase = (explosionPhase as 'normal' | 'exploding' | 'stars') === 'stars';
    
    // После 38 секунды таблички становятся микроточками-звездочками и начинают рассыпаться
    if (elapsed >= 38 && !isStarsPhase) {
      setExplosionPhase('stars');
    }
    
    // Создаем звезды из позиций табличек (только один раз, когда переходим в фазу 'stars')
    // ВАЖНО: Это должно работать даже если таблички выключены!
    if (isStarsPhase && starParticlesRef.current.length === 0) {
      // Используем центр сбора для всех звезд (все таблички собрались в кучку)
      const gatherCenter = new THREE.Vector3(0, 5, 0); // Центр сбора - немного выше центра
      const explosionCenter = gatherCenter.clone();
      
      // Создаем простые звездочки-точечки - ОБЫЧНЫЕ точечки разной яркости
      const totalParticleCount = Math.max(500, (signs.length || 20) * 50); // Минимум 500 звезд для красивого звездного неба
      
      for (let i = 0; i < totalParticleCount; i++) {
        // Небольшой разброс начальной позиции для каждой звезды
        const initialOffset = new THREE.Vector3(
          (Math.random() - 0.5) * 2.0, // Разброс 2 единицы
          (Math.random() - 0.5) * 2.0,
          (Math.random() - 0.5) * 2.0
        );
        const pos = explosionCenter.clone().add(initialOffset);
        
        // ПОЛНОСТЬЮ СЛУЧАЙНЫЙ угол разлета - звезды разлетаются во все стороны
        const angle = Math.random() * Math.PI * 2; // Случайный угол 0-2π
        const elevation = (Math.random() - 0.5) * Math.PI; // Случайный угол возвышения
        const speed = 0.5 + Math.random() * 1.5; // Скорость разлета (0.5-2.0)
        
        // ОБЫЧНЫЕ звездочки - белые/желтоватые с разной яркостью (как настоящее звездное небо)
        const brightness = 0.7 + Math.random() * 0.3; // Яркость от 0.7 до 1.0 (разная яркость)
        const starColor = new THREE.Color().setRGB(brightness, brightness, brightness * 0.95); // Белый с легким желтоватым оттенком
        
        // Создаем галактики - группируем звезды в галактики
        const galaxyId = Math.floor(i / (totalParticleCount / 8)); // 8 галактик
        const originalAngle = Math.atan2(pos.z, pos.x);
        
        const particle: any = {
          position: pos.clone(),
          velocity: new THREE.Vector3(
            Math.cos(elevation) * Math.cos(angle) * speed,
            Math.sin(elevation) * speed,
            Math.cos(elevation) * Math.sin(angle) * speed
          ),
          color: starColor,
          size: 0.03 + Math.random() * 0.05, // Размер звездочек (0.03-0.08) - видимые точечки
          startTime: elapsed, // Начинают двигаться сразу
          galaxyId: galaxyId, // ID галактики для группировки
          originalAngle: originalAngle, // Исходный угол для спирали
        };
        starParticlesRef.current.push(particle);
      }
      console.log('⭐ Создано звезд для звездного неба:', starParticlesRef.current.length);
      
      // Создаем фоновые звездочки для заполнения неба (статические, не двигаются)
      if (backgroundStarsRef.current.length === 0) {
        const backgroundStarCount = 2000; // Много звездочек для заполнения неба
        
        for (let i = 0; i < backgroundStarCount; i++) {
          // Случайная позиция по всему экрану
          const x = (Math.random() - 0.5) * 100; // Ширина экрана
          const y = (Math.random() - 0.5) * 100; // Высота экрана
          const z = -20 + Math.random() * 40; // Глубина (от -20 до 20)
          
          // Разная яркость для реалистичности
          const brightness = 0.3 + Math.random() * 0.5; // От 0.3 до 0.8 (более тусклые, чем основные звезды)
          const starColor = new THREE.Color().setRGB(brightness, brightness, brightness * 0.95);
          
          const particle: any = {
            position: new THREE.Vector3(x, y, z),
            color: starColor,
            size: 0.02 + Math.random() * 0.03, // Размер меньше основных звезд (0.02-0.05)
          };
          backgroundStarsRef.current.push(particle);
        }
        console.log('⭐ Создано фоновых звездочек для неба:', backgroundStarsRef.current.length);
      }
    }
    
    // Обновляем позиции звезд (если есть) - это должно работать ВСЕГДА после взрыва
    if (isStarsPhase) {
      starParticlesRef.current.forEach((particle, index) => {
        if (starMeshesRef.current[index]) {
          starMeshesRef.current[index].position.copy(particle.position);
        }
      });
      
      // Анимация "2026" - легкая пульсация и мерцание
      year2026ParticlesRef.current.forEach((particle, index) => {
        const particleAny = particle as any;
        const pulse = Math.sin(elapsed * 2 + index * 0.1) * 0.1 + 1; // Пульсация размера
        const twinkle = Math.sin(elapsed * 3 + index * 0.2) * 0.3 + 0.7; // Мерцание яркости
        
        // Легкое движение вокруг исходной позиции
        const offsetX = Math.sin(elapsed * 0.5 + index * 0.1) * 0.2;
        const offsetY = Math.cos(elapsed * 0.5 + index * 0.1) * 0.2;
        
        particle.position.x = particleAny.originalPosition.x + offsetX;
        particle.position.y = particleAny.originalPosition.y + offsetY;
        particle.position.z = particleAny.originalPosition.z;
        
        // Обновляем цвет для мерцания
        if (year2026MeshesRef.current[index] && year2026MeshesRef.current[index].material) {
          const material = year2026MeshesRef.current[index].material as THREE.MeshStandardMaterial;
          const brightColor = particleAny.color.clone().multiplyScalar(twinkle);
          material.color.copy(brightColor);
          material.emissive.copy(brightColor);
          material.emissiveIntensity = 20 * twinkle;
          material.needsUpdate = true;
        }
        
        // Обновляем размер для пульсации
        if (year2026MeshesRef.current[index]) {
          const scale = particleAny.size * pulse;
          year2026MeshesRef.current[index].scale.setScalar(scale / particleAny.size);
        }
      });
    }
    
    // Анимация разлета звезд с галактиками и спиралями (38+ секунды) - БЕСКОНЕЧНАЯ!
    if (isStarsPhase && elapsed >= 38) {
      const timeSinceExplosion = elapsed - 38; // Время с момента взрыва (бесконечно растет)
      const scatterProgress = Math.min(1, timeSinceExplosion / 15); // 0-1 за 15 секунд, потом продолжается
      
      // Обновляем позиции звезд - разлет с формированием галактик и спиралей
      
      // Создаем облака плазмы вокруг галактик (только один раз, когда галактики начинают формироваться)
      if (plasmaCloudsRef.current.length === 0 && scatterProgress > 0.2) {
        const galaxyCenters = new Map<number, { x: number; y: number; z: number }>();
        
        // Находим центры всех галактик на основе звезд
        starParticlesRef.current.forEach((particle) => {
          const particleAny = particle as any;
          const galaxyId = particleAny.galaxyId !== undefined ? particleAny.galaxyId : 0;
          
          if (!galaxyCenters.has(galaxyId)) {
            const progress = scatterProgress;
            const centerX = Math.cos(galaxyId * 0.5) * (3 + progress * 8);
            const centerZ = Math.sin(galaxyId * 0.5) * (3 + progress * 8);
            const centerY = (galaxyId % 3 - 1) * (1 + progress * 2);
            galaxyCenters.set(galaxyId, { x: centerX, y: centerY, z: centerZ });
          }
        });
        
        // Создаем облака плазмы только для некоторых галактик (каждую 3-ю)
        galaxyCenters.forEach((center, galaxyId) => {
          // Облака плазмы только для галактик с ID кратных 3 (0, 3, 6, 9...)
          if (galaxyId % 3 !== 0) return;
          // Разные цвета для разных галактик: фиолет, сирень, голубой, бело-серебристый
          const colorTypes = [
            { hue: 0.75, saturation: 0.8, lightness: 0.6 }, // Фиолет
            { hue: 0.8, saturation: 0.7, lightness: 0.65 }, // Сирень
            { hue: 0.55, saturation: 0.9, lightness: 0.7 }, // Голубой
            { hue: 0.6, saturation: 0.3, lightness: 0.85 }, // Бело-серебристый
          ];
          const colorType = colorTypes[galaxyId % colorTypes.length];
          
          // Создаем несколько облаков вокруг центра галактики (4-6 облаков для лучшей видимости)
          const cloudCount = 4 + Math.floor(Math.random() * 3); // 4-6 облаков
          for (let i = 0; i < cloudCount; i++) {
            const cloudOffsetX = (Math.random() - 0.5) * 8; // Разброс облаков вокруг центра
            const cloudOffsetY = (Math.random() - 0.5) * 4;
            const cloudOffsetZ = (Math.random() - 0.5) * 8;
            const cloud = {
              position: new THREE.Vector3(
                center.x + cloudOffsetX,
                center.y + cloudOffsetY,
                center.z + cloudOffsetZ
              ),
              color: new THREE.Color().setHSL(colorType.hue, colorType.saturation, colorType.lightness),
              size: 3 + Math.random() * 5, // Размер облаков 3-8 (больше для лучшей видимости)
              galaxyId: galaxyId,
              originalOffsetX: cloudOffsetX, // Сохраняем смещения для обновления позиций
              originalOffsetY: cloudOffsetY,
              originalOffsetZ: cloudOffsetZ,
            };
            (plasmaCloudsRef.current as any[]).push(cloud);
          }
        });
        
        // Облака плазмы созданы (без логирования)
      }
      
      // Обновляем позиции звезд - разлет с формированием галактик и спиралей
      starParticlesRef.current.forEach((particle, index) => {
        const particleAny = particle as any;
        const startTime = particleAny.startTime || elapsed;
        const galaxyId = particleAny.galaxyId !== undefined ? particleAny.galaxyId : Math.floor(index / (starParticlesRef.current.length / 8));
        const originalAngle = particleAny.originalAngle !== undefined ? particleAny.originalAngle : Math.atan2(particle.position.z, particle.position.x);
        
        // Обновляем цвет материала звезды, если меш существует
        if (starMeshesRef.current[index] && starMeshesRef.current[index].material) {
          const material = starMeshesRef.current[index].material as THREE.MeshStandardMaterial;
          if (particle.color && material.color) {
            material.color.copy(particle.color);
            material.emissive.copy(particle.color);
            // Интенсивность эмиссии зависит от яркости звезды
            material.emissiveIntensity = 8 + (particle.color.r * 7); // 8-15 в зависимости от яркости
            material.needsUpdate = true;
          }
        }
        
        // ФАЗА 1: Первые 5 секунд - простой разлет во все стороны
        const timeSinceStart = elapsed - startTime;
        if (timeSinceStart < 5) {
          // Простое движение - звезды разлетаются по прямой линии
          const moveSpeed = delta * (0.8 + scatterProgress * 0.4);
          particle.position.add(particle.velocity.clone().multiplyScalar(moveSpeed));
          particle.velocity.multiplyScalar(0.998);
        } else {
          // ФАЗА 2: После 5 секунд - формирование галактик и спиралей
          const galaxyProgress = Math.min(1, (timeSinceStart - 5) / 10); // 0-1 за 10 секунд (5-15 сек)
          
          // Центр галактики - смещается от центра взрыва
          const galaxyCenterX = Math.cos(galaxyId * 0.5) * (3 + galaxyProgress * 12);
          const galaxyCenterZ = Math.sin(galaxyId * 0.5) * (3 + galaxyProgress * 12);
          const galaxyCenterY = (galaxyId % 3 - 1) * (1 + galaxyProgress * 3);
          
          // Спиральное движение - звезды закручиваются в спирали
          const spiralSpeed = 0.08 + (galaxyId % 4) * 0.03; // Скорость вращения спирали
          const newAngle = originalAngle + spiralSpeed * galaxyProgress * 3; // Вращение
          
          // Спиральный радиус - увеличивается со временем
          const baseRadius = 2 + galaxyProgress * 10;
          const spiralTightness = 0.4 + galaxyProgress * 0.3; // Плотность спирали
          const spiralRadius = baseRadius * (1 + Math.sin(newAngle * 2) * 0.3 * spiralTightness);
          
          // Позиция в спирали
          const targetX = galaxyCenterX + Math.cos(newAngle) * spiralRadius;
          const targetZ = galaxyCenterZ + Math.sin(newAngle) * spiralRadius;
          const targetY = galaxyCenterY + Math.sin(galaxyProgress * Math.PI * 2 + galaxyId * 0.5) * 2;
          
          // Плавная интерполяция к спиральной позиции
          const interpolationFactor = Math.min(1, galaxyProgress * 0.5);
          particle.position.x = particle.position.x * (1 - interpolationFactor * 0.1) + targetX * interpolationFactor * 0.1;
          particle.position.z = particle.position.z * (1 - interpolationFactor * 0.1) + targetZ * interpolationFactor * 0.1;
          particle.position.y = particle.position.y * (1 - interpolationFactor * 0.1) + targetY * interpolationFactor * 0.1;
          
          // После формирования спиралей - медленное вращение
          if (galaxyProgress >= 1) {
            const rotationSpeed = delta * 0.02; // Медленное вращение
            const currentAngle = Math.atan2(particle.position.z - galaxyCenterZ, particle.position.x - galaxyCenterX);
            const newRotatedAngle = currentAngle + rotationSpeed;
            const distance = Math.sqrt(
              Math.pow(particle.position.x - galaxyCenterX, 2) + 
              Math.pow(particle.position.z - galaxyCenterZ, 2)
            );
            particle.position.x = galaxyCenterX + Math.cos(newRotatedAngle) * distance;
            particle.position.z = galaxyCenterZ + Math.sin(newRotatedAngle) * distance;
          }
        }
      });
      
      // Обновляем позиции облаков плазмы вместе с движением галактик
      plasmaCloudsRef.current.forEach((cloud: any) => {
        if (cloud && cloud.galaxyId !== undefined) {
          const galaxyId = cloud.galaxyId;
          const galaxyCenterX = Math.cos(galaxyId * 0.5) * (3 + scatterProgress * 12);
          const galaxyCenterZ = Math.sin(galaxyId * 0.5) * (3 + scatterProgress * 12);
          const galaxyCenterY = (galaxyId % 3 - 1) * (1 + scatterProgress * 3);
          
          // Обновляем позицию облака относительно центра галактики
          const offsetX = cloud.originalOffsetX || (cloud.position.x - galaxyCenterX);
          const offsetY = cloud.originalOffsetY || (cloud.position.y - galaxyCenterY);
          const offsetZ = cloud.originalOffsetZ || (cloud.position.z - galaxyCenterZ);
          
          // Сохраняем оригинальные смещения при первом создании
          if (!cloud.originalOffsetX) {
            cloud.originalOffsetX = offsetX;
            cloud.originalOffsetY = offsetY;
            cloud.originalOffsetZ = offsetZ;
          }
          
          // Обновляем позицию облака
          cloud.position.x = galaxyCenterX + offsetX;
          cloud.position.y = galaxyCenterY + offsetY;
          cloud.position.z = galaxyCenterZ + offsetZ;
          
          // Обновляем позицию меша, если он существует
          if (cloud.mesh) {
            cloud.mesh.position.copy(cloud.position);
          }
        }
      });
      
      // Скрываем таблички полностью после начала рассыпания
      signRefs.current.forEach((ref) => {
        if (ref.element) {
          const hideProgress = Math.min(1, scatterProgress * 2); // Быстро скрываем
          ref.element.style.opacity = `${Math.max(0, 1 - hideProgress)}`;
        }
      });
      
      // Анимация продолжается БЕСКОНЕЧНО - звездочки продолжают двигаться и вращаться
      // Пропускаем обычную анимацию во время рассыпания
      return;
    }
    
    // Обновляем позиции для смены (минимум 3 раза) - ОЧЕНЬ редко для производительности
    const updateInterval = 2.0; // Обновляем позиции раз в 2 секунды
    
    if (elapsed - lastPositionUpdateRef.current >= updateInterval) {
      lastPositionUpdateRef.current = elapsed;
      
      // СБОР ТАБЛИЧЕК В КУЧКУ перед взрывом (38-40 секунды, после долгого кружения!)
      const gatherProgress = elapsed >= 38 && elapsed < 40 ? Math.min(1, (elapsed - 38) / 2) : 0;
      const gatherCenter = new THREE.Vector3(0, 5, 0); // Центр сбора - немного выше центра
      
      // Обновляем позиции через setState (но редко)
      const newPositions = signPositions.map((pos, index) => {
        const sign = signs[index];
        
        // Если идет сбор в кучку (34-36 секунды), собираем все таблички в центр
        if (gatherProgress > 0) {
          const currentPos = pos.clone();
          return currentPos.lerp(gatherCenter, gatherProgress);
        }
        
        if (!sign || !sign.targetPositions || sign.targetPositions.length < 2) return pos;
        
        // Таблички появляются на 6 секунде, остаются в центре 2 секунды, потом ЛЕТАЮТ ПО ВСЕМУ ЭКРАНУ
        const timeSinceAppearance = elapsed - 6; // Время с момента появления (6 секунда)
        
        // Фаза 1: все таблички в центре (0-2 сек после появления, т.е. 6-8 сек)
        if (timeSinceAppearance < 2) {
          // Все таблички остаются в центре - не двигаются!
          return sign.originalPosition.clone();
        }
        
        // Фаза 2: ЛЕТАЮТ ПО ВСЕМУ ЭКРАНУ (2+ сек после появления, т.е. 8+ сек)
        const scatterTime = timeSinceAppearance - 2; // Время с начала разлета
        const animationDuration = 34; // 34 секунд на полет (8-42 сек) - продлено еще на 6 секунд!
        const animationTime = Math.min(scatterTime, animationDuration); // От 0 до 34
        
        // Плавное движение по всему экрану - таблички летают ДАЛЕКО друг от друга, не загораживая друг друга
        // Используем синусоидальное движение для плавного полета с БОЛЬШИМ радиусом
        const flightSpeed = 0.15; // Медленная скорость полета для плавности
        const baseRadius = 25; // Базовый радиус увеличен (было 15)
        const radiusVariation = (index % 7) * 5; // Больший разброс радиусов (0-30 единиц)
        const flightRadius = baseRadius + radiusVariation; // Разный радиус для каждой таблички (25-55 единиц) - ДАЛЕКО друг от друга!
        const flightAngle = scatterTime * flightSpeed + (index * Math.PI * 2) / signs.length; // Уникальный угол для каждой таблички
        
        // УЛУЧШЕННОЕ вертикальное распределение - таблички гуляют ВЫШЕ и НИЖЕ!
        const baseVerticalOffset = (index % 5 - 2) * 4; // Базовое вертикальное смещение (-8 до 8 единиц)
        const verticalWave = Math.sin(scatterTime * flightSpeed * 0.7 + index * 0.5) * 12; // Большая вертикальная волна (было 8)
        const verticalOffset = baseVerticalOffset + verticalWave; // Комбинированное вертикальное движение
        
        // Позиция для полета по всему экрану - ДАЛЕКО друг от друга, ВЫШЕ и НИЖЕ!
        const flightX = Math.cos(flightAngle) * flightRadius;
        const flightY = verticalOffset; // Улучшенное вертикальное распределение
        const flightZ = -5 + Math.sin(flightAngle * 0.5) * 5; // Увеличенная глубина для 3D эффекта
        
        return new THREE.Vector3(flightX, flightY, flightZ);
      });
      
      // Обновляем позиции (редко, поэтому не тормозит)
      setSignPositions(newPositions);
    }
    
    // Уменьшение табличек до микроточек-звездочек начиная с 36 секунды
    let shrinkProgress = 0;
    if (elapsed >= 36 && (explosionPhase as 'normal' | 'exploding' | 'stars') === 'normal') {
      shrinkProgress = Math.min(1, (elapsed - 36) / 2); // 0-1 за 2 секунды (36-38 сек)
    }
    
    signRefs.current.forEach((ref, index) => {
      if (!ref.element || !ref.data) return;
      
      const sign = ref.data;
      const t = elapsed * 0.15 + sign.timeOffset; // Замедленная анимация для читаемости
      
      // Динамический цвет - меняется по спектру (медленнее)
      const hue = (sign.baseHue + Math.sin(t * 0.5) * 0.15 + elapsed * 0.05) % 1;
      const saturation = 0.8 + Math.sin(t * 1.0) * 0.2; // 0.6-1.0 (более насыщенные)
      const lightness = 0.6 + Math.sin(t * 1.5) * 0.2; // 0.4-0.8 (ярче)
      
      // Динамическая прозрачность - становится НЕпрозрачнее со временем (таблички становятся четче)
      // Эффект ВСПЫШКИ при появлении - таблички появляются ОГРОМНЫМИ в центре экрана!
      const timeSinceAppearance = elapsed - 6; // Время с момента появления (6 секунда)
      let scale = 1;
      let opacity = 1;
      let glowIntensity = 0;
      
      // ВСЕ таблички ОДИНАКОВОГО размера - увеличены в 3 раза!
      // Базовый размер контента: 200px (minWidth)
      // Фиксированный размер: 1200px → scale = 1200/200 = 6.0
      const baseScale = 6.0; // Единый размер для всех табличек (1200px) - увеличен в 3 раза!
      
      if (timeSinceAppearance < 0.5) {
        // Фаза вспышки (0-0.5 сек): таблички появляются с яркой вспышкой
        const flashProgress = timeSinceAppearance / 0.5; // 0..1
        scale = baseScale * (1.1 - flashProgress * 0.05); // Небольшая вспышка
        opacity = 0.3 + flashProgress * 0.7; // От полупрозрачных до непрозрачных
        glowIntensity = (1 - flashProgress) * 0.5; // Яркое свечение в начале
      } else {
        // После вспышки: все таблички одинакового размера, медленно плавают
        scale = baseScale; // Всегда одинаковый размер (1.25 = 250px)
        opacity = 1; // Полностью непрозрачные
        glowIntensity = 0; // Свечение исчезает
        
        // Легкая пульсация для красоты (очень медленная)
        const pulse = Math.sin(timeSinceAppearance * 0.5) * 0.03 + 1; // Очень медленная пульсация
        scale = scale * pulse;
      }
      
      // Применяем уменьшение поверх обычной анимации (если началось уменьшение)
      if (shrinkProgress > 0) {
        const minScale = 0.01;
        const shrinkScale = 1 - shrinkProgress * (1 - minScale); // От 1 до 0.01
        scale = scale * shrinkScale; // Уменьшаем финальный масштаб
      }
      
      // Применяем стили
      const hslColor = `hsl(${hue * 360}, ${saturation * 100}%, ${lightness * 100}%)`;
      const borderColor = `hsla(${hue * 360}, ${saturation * 100}%, ${lightness * 100}%, 0.8)`;
      const shadowColor = `hsla(${hue * 360}, ${saturation * 100}%, ${lightness * 100}%, 0.5)`;
      
      // Применяем уменьшение прозрачности поверх обычной анимации (если началось уменьшение)
      let finalOpacity = opacity;
      if (shrinkProgress > 0) {
        const minOpacity = 0.3; // Минимальная прозрачность для видимости звездочек
        finalOpacity = opacity * (1 - shrinkProgress * (1 - minOpacity / opacity));
        finalOpacity = Math.max(minOpacity, finalOpacity);
      }
      
      ref.element.style.background = `linear-gradient(135deg, hsla(${hue * 360}, ${saturation * 100}%, 95%, ${finalOpacity}) 0%, hsla(${hue * 360}, ${saturation * 100}%, 90%, ${finalOpacity}) 100%)`;
      ref.element.style.borderColor = borderColor;
      ref.element.style.color = hslColor;
      ref.element.style.opacity = `${finalOpacity}`;
      ref.element.style.transform = `scale(${scale}) translateZ(0)`;
      // Яркое свечение при вспышке
      const glowSize = glowIntensity > 0 ? 40 + glowIntensity * 60 : 20;
      ref.element.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.2), 0 0 ${glowSize}px ${shadowColor}`;
    });
  });

  // ВАЖНО: Звездочки должны рендериться даже после выключения табличек!
  // Проверяем, есть ли звездочки для рендеринга (после взрыва)
  const isStarsPhase = (explosionPhase as 'normal' | 'exploding' | 'stars') === 'stars';
  const hasStars = isStarsPhase && starParticlesRef.current.length > 0;
  const hasYear2026 = year2026ParticlesRef.current.length > 0; // "2026" появляется на 6 секунде, не зависит от isStarsPhase
  const hasBackgroundStars = isStarsPhase && backgroundStarsRef.current.length > 0;
  
  // Если нет ни табличек, ни звезд, ни "2026" - не рендерим ничего
  if (!enabled && !hasStars && !hasYear2026 && !hasBackgroundStars) return null;
  
  // Если есть таблички, но нет позиций - не рендерим таблички
  if (signs.length === 0 && !hasStars && !hasYear2026 && !hasBackgroundStars) return null;
  if (signPositions.length === 0 && signs.length > 0 && !hasStars && !hasYear2026 && !hasBackgroundStars) return null;
  
  return (
    <group>
      {/* Фоновые звездочки для заполнения неба (появляются на 38 секунде вместе с галактиками) */}
      {isStarsPhase && backgroundStarsRef.current.map((particle, index) => (
        <mesh 
          key={`bg-star-${index}`} 
          ref={(el) => {
            if (el) backgroundStarsMeshesRef.current[index] = el;
          }}
          position={particle.position}
        >
          <sphereGeometry args={[particle.size, 6, 6]} />
          <meshStandardMaterial
            color={particle.color}
            emissive={particle.color}
            emissiveIntensity={10}
            transparent
            opacity={0.8}
            roughness={0.0}
            metalness={0.0}
          />
        </mesh>
      ))}
      
      {/* Число "2026" из звездочек сверху экрана (появляется на 6 секунде) */}
      {hasYear2026 && year2026ParticlesRef.current.map((particle, index) => (
        <mesh 
          key={`year2026-${index}`} 
          ref={(el) => {
            if (el) year2026MeshesRef.current[index] = el;
          }}
          position={particle.position}
        >
          <sphereGeometry args={[particle.size, 8, 8]} />
          <meshStandardMaterial
            color={particle.color}
            emissive={particle.color}
            emissiveIntensity={20}
            transparent
            opacity={1.0}
            roughness={0.0}
            metalness={0.0}
          />
        </mesh>
      ))}
      
      {/* Звезды после взрыва - рендерим через ref для обновления позиций */}
      {explosionPhase === 'stars' && starParticlesRef.current.map((particle, index) => (
        <mesh 
          key={`star-${index}`} 
          ref={(el) => {
            if (el) starMeshesRef.current[index] = el;
          }}
          position={particle.position}
        >
          <sphereGeometry args={[particle.size, 8, 8]} />
          <meshStandardMaterial
            color={particle.color}
            emissive={particle.color}
            emissiveIntensity={15}
            transparent
            opacity={1.0}
            roughness={0.0}
            metalness={0.0}
          />
        </mesh>
      ))}
      
      {/* Облака плазмы вокруг галактик */}
      {explosionPhase === 'stars' && plasmaCloudsRef.current.map((cloud: any, index) => (
        <mesh 
          key={`plasma-${index}`} 
          ref={(el) => {
            if (el && plasmaCloudsRef.current[index]) {
              plasmaCloudsRef.current[index] = { ...cloud, mesh: el } as any;
            }
          }}
          position={cloud.position}
        >
          <sphereGeometry args={[cloud.size, 16, 16]} />
          <meshStandardMaterial
            color={cloud.color}
            emissive={cloud.color}
            emissiveIntensity={3}
            transparent
            opacity={0.4}
            roughness={0.0}
            metalness={0.1}
          />
        </mesh>
      ))}
      
      {/* Таблички с желаниями */}
      {signs.map((sign, index) => {
        const position = signPositions[index] || sign.position;
        
        return (
          <Html
            key={`wish-sign-${sign.toyId}`}
            position={position}
            center
            distanceFactor={10}
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <div
              ref={(el) => {
                if (el) {
                  signRefs.current[index] = { element: el, data: sign };
                }
              }}
              style={{
                // Выделенный стиль для табличек с желаниями - золотистый/звездный
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.95) 0%, rgba(255, 165, 0, 0.95) 50%, rgba(255, 140, 0, 0.95) 100%)',
                border: '3px solid rgba(255, 215, 0, 0.9)',
                borderRadius: '16px',
                padding: '14px 24px',
                fontSize: '18px',
                fontWeight: '800',
                color: '#1a1a2e',
                textAlign: 'center',
                boxShadow: '0 6px 20px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(15px)',
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto',
                transform: 'translateZ(0)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                transition: 'none', // Отключаем CSS transitions для плавной анимации через JS
                maxWidth: '400px', // Увеличиваем ширину для лучшего переноса по словам
                minWidth: '200px', // Базовый размер контента (для расчета scale)
                // Убираем minHeight, чтобы размер контролировался только через scale
                width: 'auto', // Автоматическая ширина
                height: 'auto', // Автоматическая высота
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            >
              {sign.authorName && (
                <div style={{ marginBottom: '6px', fontSize: '14px', opacity: 0.9, fontWeight: '700', color: '#8B4513', textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}>
                  ✨ {sign.authorName}
                </div>
              )}
              <div style={{ fontSize: '20px', fontWeight: '800', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>{sign.text}</div>
            </div>
          </Html>
        );
      })}
    </group>
  );
}

