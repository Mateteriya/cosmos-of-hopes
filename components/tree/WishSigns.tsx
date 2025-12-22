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

export function WishSigns({ enabled = true, toys, startTime, onExplosionComplete }: WishSignsProps) {
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
      
      // Сферическое распределение вокруг елки (но дальше, чем обычные таблички)
      const theta = (Math.PI * 2 * i) / count; // Азимут
      const phi = Math.acos(2 * (i / count) - 1); // Полярный угол
      const radius = 15 + Math.random() * 10; // Радиус от 15 до 25 (дальше обычных табличек)
      
      const x = Math.sin(phi) * Math.cos(theta) * radius;
      const y = (Math.sin(phi) * Math.sin(theta) * radius) + 5; // Смещение вверх
      const z = Math.cos(phi) * radius;
      
      const originalPosition = new THREE.Vector3(x, y, z);
      
      // Создаем минимум 3 целевые позиции для смены
      const targetPositions: THREE.Vector3[] = [originalPosition.clone()]; // Первая позиция - исходная
      
      for (let j = 0; j < 3; j++) {
        // Генерируем новые позиции вокруг елки
        const newTheta = (Math.PI * 2 * (i + j * 0.3)) / count;
        const newPhi = Math.acos(2 * ((i + j * 0.2) / count) - 1);
        const newRadius = 15 + Math.random() * 10;
        
        const newX = Math.sin(newPhi) * Math.cos(newTheta) * newRadius;
        const newY = (Math.sin(newPhi) * Math.sin(newTheta) * newRadius) + 5;
        const newZ = Math.cos(newPhi) * newRadius;
        
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
    const initialPositions = signs.map(s => s.position.clone());
    setSignPositions(initialPositions);
    lastPositionUpdateRef.current = 0; // Сбрасываем таймер обновления
    
    return signs;
  }, [enabled, toys]);

  // Обновляем позиции звезд в useFrame (объединено с основной анимацией)
  useFrame((state, delta) => {
    // Обновляем позиции звезд (если есть)
    if (explosionPhase === 'stars') {
      starParticlesRef.current.forEach((particle, index) => {
        if (starMeshesRef.current[index]) {
          starMeshesRef.current[index].position.copy(particle.position);
        }
      });
    }
    
    // Анимация цветов, прозрачности, масштаба и движения
    if (!enabled || signs.length === 0 || signPositions.length === 0) return;
    
    const elapsed = (Date.now() - startTimeRef.current) / 1000; // Время в секундах
    
    // СБОР ТАБЛИЧЕК В КУЧКУ перед взрывом (18-20 секунды)
    const gatherProgress = elapsed >= 18 && elapsed < 20 ? Math.min(1, (elapsed - 18) / 2) : 0; // 0-1 за 2 секунды (18-20 сек)
    const gatherCenter = new THREE.Vector3(0, 5, 0); // Центр сбора - немного выше центра
    
    // Уменьшение табличек до микроточек-звездочек начиная с 20 секунды
    // Но сначала применяем обычную анимацию, а затем уменьшение поверх нее
    let shrinkProgress = 0;
    if (elapsed >= 20 && explosionPhase === 'normal') {
      shrinkProgress = Math.min(1, (elapsed - 20) / 2); // 0-1 за 2 секунды (20-22 сек)
      
      // После 22 секунды таблички становятся микроточками-звездочками и начинают рассыпаться
      if (elapsed >= 22) {
        setExplosionPhase('stars');
          // Создаем звезды из позиций табличек (только один раз)
          if (starParticlesRef.current.length === 0) {
            // Используем центр сбора для всех звезд (все таблички собрались в кучку)
            const explosionCenter = gatherCenter.clone();
            
            // Создаем звезды из центра сбора, но с РАЗНЫМИ задержками и начальными позициями для несинхронности
            const totalParticleCount = signs.length * 75; // Общее количество звезд (75 на табличку в среднем)
            
            for (let i = 0; i < totalParticleCount; i++) {
              // РАЗНЫЕ задержки для разных групп звезд (0-2 секунды) - чтобы взрывы были НЕСИНХРОННЫМИ
              const explosionDelay = Math.random() * 2.0; // Увеличиваем разброс задержек
              
              // Небольшой разброс начальной позиции для каждой звезды (чтобы не было одной точки взрыва)
              const initialOffset = new THREE.Vector3(
                (Math.random() - 0.5) * 1.5, // Разброс 1.5 единицы
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5
              );
              const pos = explosionCenter.clone().add(initialOffset);
              
              // ПОЛНОСТЬЮ СЛУЧАЙНЫЙ угол - никаких паттернов!
              const angle = Math.random() * Math.PI * 2; // Полностью случайный угол 0-2π
              const speed = 0.3 + Math.random() * 0.7; // Более плавная скорость разлета (0.3-1.0)
              
              // РАЗНОЦВЕТНЫЕ звезды - используем весь спектр HSL для максимального разнообразия
              // ВАЖНО: ВСЕ звезды должны быть разноцветными, не только первые 5!
              // Для очень маленьких звезд нужны ОЧЕНЬ яркие и насыщенные цвета!
              const hue = Math.random(); // Полный спектр от 0 до 1 (все цвета радуги)
              const saturation = 1.0; // МАКСИМАЛЬНАЯ насыщенность (1.0) - самые яркие неоновые цвета!
              const lightness = 0.4 + Math.random() * 0.2; // Средняя яркость (0.4-0.6) - яркие, но НЕ белые!
              
              // Создаем цвет с максимальной насыщенностью
              const starColor = new THREE.Color().setHSL(hue, saturation, lightness);
              
              const particle: any = {
                position: pos.clone(),
                velocity: new THREE.Vector3(
                  Math.cos(angle) * speed,
                  (Math.random() - 0.5) * speed * 0.8, // Вертикальный разброс
                  Math.sin(angle) * speed
                ),
                color: starColor, // ВАЖНО: создаем НОВЫЙ Color для каждой звезды!
                size: (0.08 + Math.random() * 0.15) / 10, // УМЕНЬШИЛИ в 10 раз! (0.008-0.023)
                galaxyId: Math.floor(Math.random() * 10), // ID галактики для группировки
                originalAngle: Math.atan2(pos.z, pos.x), // Исходный угол для спирали
                explosionDelay: explosionDelay, // Задержка взрыва для несинхронности
                startTime: elapsed + explosionDelay, // Время начала движения этой звезды
              };
              starParticlesRef.current.push(particle);
            }
            console.log('⭐ Таблички уменьшились до микроточек-звездочек! Создано звезд:', starParticlesRef.current.length);
          }
      }
    }
    
    // Анимация рассыпания звезд и создания галактик (22+ секунды)
    if (explosionPhase === 'stars' && elapsed >= 22) {
      const scatterProgress = (elapsed - 22) / 8; // 0-1 за 8 секунд (22-30 сек) - ВРАЩЕНИЕ + 2 секунды
      const afterRotationTime = elapsed - 30; // Время после фиксации (30+ секунды)
      
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
        
        console.log('🌌 Облака плазмы созданы! Количество:', plasmaCloudsRef.current.length);
      }
      
      // Обновляем позиции звезд для рассыпания и цвета
      starParticlesRef.current.forEach((particle, index) => {
        const particleAny = particle as any;
        const explosionDelay = particleAny.explosionDelay || 0;
        const startTime = particleAny.startTime || 22;
        
        // Обновляем цвет материала звезды, если меш существует
        // КРИТИЧНО для очень маленьких звезд - цвета должны быть максимально яркими!
        if (starMeshesRef.current[index] && starMeshesRef.current[index].material) {
          const material = starMeshesRef.current[index].material as THREE.MeshStandardMaterial;
          if (particle.color && material.color) {
            // Копируем цвет напрямую
            material.color.copy(particle.color);
            material.emissive.copy(particle.color);
            // Увеличиваем интенсивность эмиссии для видимости маленьких звезд
            material.emissiveIntensity = 15;
            material.needsUpdate = true;
          }
        }
        
        // Проверяем, начался ли взрыв для этой звезды (с учетом задержки)
        if (elapsed < startTime) {
          return; // Звезда еще не начала двигаться
        }
        
        const localProgress = Math.min(1, (elapsed - startTime) / 8); // Локальный прогресс для этой звезды
        
        // ФАЗА 1: Вращение и формирование галактик (0-8 секунд после начала взрыва)
        if (localProgress < 1) {
          // Более плавное движение - используем меньшую скорость для плавности
          const moveSpeed = delta * (1.0 + localProgress * 0.5); // Плавное ускорение
          particle.position.add(particle.velocity.clone().multiplyScalar(moveSpeed));
          particle.velocity.multiplyScalar(0.999); // Более плавное замедление
          
          // Создаем эффект галактик и звездных систем - звезды группируются в спирали
          // Начинаем формировать спирали РАНЬШЕ и БОЛЕЕ АГРЕССИВНО
          if (localProgress > 0.1) {
            const particleAny = particle as any;
            const galaxyId = particleAny.galaxyId !== undefined ? particleAny.galaxyId : Math.floor(index / 20);
            const originalAngle = particleAny.originalAngle !== undefined ? particleAny.originalAngle : Math.atan2(particle.position.z, particle.position.x);
            
            // Центр галактики - смещаем относительно исходной позиции (используем localProgress)
            const galaxyCenterX = Math.cos(galaxyId * 0.5) * (3 + localProgress * 8);
            const galaxyCenterZ = Math.sin(galaxyId * 0.5) * (3 + localProgress * 8);
            const galaxyCenterY = (galaxyId % 3 - 1) * (1 + localProgress * 2);
            
            // Относительная позиция от центра галактики
            const relX = particle.position.x - galaxyCenterX;
            const relZ = particle.position.z - galaxyCenterZ;
            const relDistance = Math.sqrt(relX * relX + relZ * relZ);
            const relAngle = Math.atan2(relZ, relX);
            
            // БОЛЕЕ СИЛЬНОЕ спиральное движение (используем localProgress)
            const spiralSpeed = 0.05 + (galaxyId % 4) * 0.02; // Более быстрые и заметные скорости
            const newAngle = originalAngle + spiralSpeed * localProgress * 2; // Более сильное вращение
            
            // Спиральный радиус с более заметной спиралью
            const baseRadius = 2 + localProgress * 8;
            const spiralTightness = 0.3 + localProgress * 0.4; // Более заметная спираль
            const spiralRadius = baseRadius * (1 + Math.sin(newAngle * 2.5) * 0.2 * spiralTightness);
            
            // Позиция в спирали
            const newX = galaxyCenterX + Math.cos(newAngle) * spiralRadius;
            const newZ = galaxyCenterZ + Math.sin(newAngle) * spiralRadius;
            
            // ПЛАВНО интерполируем к спиральной позиции (используем localProgress)
            const interpolationFactor = Math.min(1, (localProgress - 0.1) * 0.4); // Более плавная интерполяция
            particle.position.x = particle.position.x * (1 - interpolationFactor * 0.15) + newX * interpolationFactor * 0.15;
            particle.position.z = particle.position.z * (1 - interpolationFactor * 0.15) + newZ * interpolationFactor * 0.15;
            
            // Вертикальное движение для 3D эффекта галактик
            const verticalWave = Math.sin(localProgress * Math.PI * 2 + galaxyId * 0.3) * 0.03;
            particle.position.y = galaxyCenterY + verticalWave * (1 - relDistance / 10);
          }
        } else {
          // ФАЗА 2: Фиксация и очень медленное движение (после 28 секунды)
          // Очень медленное плавное движение - едва заметное
          const slowSpeed = delta * 0.01; // ОЧЕНЬ медленное движение
          particle.position.add(particle.velocity.clone().multiplyScalar(slowSpeed));
          // Еще больше замедляем
          particle.velocity.multiplyScalar(0.9995);
        }
      });
      
      // Обновляем позиции облаков плазмы вместе с движением галактик
      plasmaCloudsRef.current.forEach((cloud: any) => {
        if (cloud && cloud.galaxyId !== undefined) {
          const galaxyId = cloud.galaxyId;
          const galaxyCenterX = Math.cos(galaxyId * 0.5) * (3 + scatterProgress * 8);
          const galaxyCenterZ = Math.sin(galaxyId * 0.5) * (3 + scatterProgress * 8);
          const galaxyCenterY = (galaxyId % 3 - 1) * (1 + scatterProgress * 2);
          
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
      
      if (onExplosionComplete && scatterProgress >= 1 && !hasCalledExplosionCompleteRef.current) {
        hasCalledExplosionCompleteRef.current = true;
        onExplosionComplete();
        console.log('🌟 Новая Вселенная создана! Галактики и звездные системы!');
      }
      
      // Пропускаем обычную анимацию во время рассыпания
      return;
    }
    
    // Обновляем позиции для смены (минимум 3 раза) - ОЧЕНЬ редко для производительности
    const updateInterval = 2.0; // Обновляем позиции раз в 2 секунды
    
    if (elapsed - lastPositionUpdateRef.current >= updateInterval) {
      lastPositionUpdateRef.current = elapsed;
      
      // СБОР ТАБЛИЧЕК В КУЧКУ перед взрывом (18-20 секунды)
      const gatherProgress = elapsed >= 18 && elapsed < 20 ? Math.min(1, (elapsed - 18) / 2) : 0;
      const gatherCenter = new THREE.Vector3(0, 5, 0); // Центр сбора - немного выше центра
      
      // Обновляем позиции через setState (но редко)
      const newPositions = signPositions.map((pos, index) => {
        const sign = signs[index];
        
        // Если идет сбор в кучку (18-20 секунды), собираем все таблички в центр
        if (gatherProgress > 0) {
          const currentPos = pos.clone();
          return currentPos.lerp(gatherCenter, gatherProgress);
        }
        
        if (!sign || !sign.targetPositions || sign.targetPositions.length < 2) return pos;
        
        // Время анимации: 20 секунд (от 6 до 26, так как появляются после слетания шаров)
        const animationDuration = 20;
        const animationTime = Math.max(0, Math.min(elapsed - 6, animationDuration)); // От 0 до 20, начиная с 6 сек
        
        // Разбиваем время на 4 фазы (исходная + 3 смены позиций)
        const phaseDuration = animationDuration / 4; // 5 секунд на каждую фазу
        const currentPhase = Math.floor(animationTime / phaseDuration);
        const phaseProgress = (animationTime % phaseDuration) / phaseDuration; // 0-1 внутри фазы
        
        // Определяем текущую и следующую позиции
        const fromIndex = Math.min(currentPhase, sign.targetPositions.length - 1);
        const toIndex = Math.min(currentPhase + 1, sign.targetPositions.length - 1);
        
        const fromPos = sign.targetPositions[fromIndex];
        const toPos = sign.targetPositions[toIndex];
        
        // Плавная интерполяция между позициями
        const smoothProgress = phaseProgress * phaseProgress * (3 - 2 * phaseProgress); // Smoothstep
        return fromPos.clone().lerp(toPos, smoothProgress);
      });
      
      // Обновляем позиции (редко, поэтому не тормозит)
      setSignPositions(newPositions);
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
      const baseOpacity = 0.75; // Начальная прозрачность
      const growProgress = Math.min(1, (elapsed - 6) / 12); // От 6 до 18 секунды (0-1)
      const dynamicOpacity = 0.75 + Math.sin(t * 0.8) * 0.2; // 0.55-0.95 (базовая пульсация)
      const opacity = Math.min(1, dynamicOpacity + growProgress * 0.25); // Постепенно увеличиваем до 1.0 (полностью непрозрачные)
      
      // Динамический масштаб с увеличением по очереди - становится КРУПНЕЕ со временем
      // Базовый масштаб увеличивается со временем
      const baseScaleGrowth = 0.7 + growProgress * 0.5; // От 0.7 до 1.2 (становится крупнее)
      const baseScale = baseScaleGrowth + Math.sin(t * 0.5) * 0.2; // 0.5-1.4 (базовая пульсация, крупный размер)
      
      // Увеличение по очереди - каждая табличка проходит минимум 3 цикла (от микро до максимума)
      const scaleWaveTime = elapsed - 6 - (sign.scaleDelay * 4); // Задержка от 0 до 4 секунд, начиная с 6 сек
      let scaleMultiplier = 1;
      
      if (scaleWaveTime > 0) {
        // Создаем минимум 3 полных цикла за время анимации (17 секунд от 6 до 23)
        // Частота: 3 цикла за 17 секунд = 3 * 2π / 17 ≈ 1.1 рад/сек
        const cycleSpeed = 1.1; // Скорость циклов (минимум 3 цикла за ~17 секунд)
        const wavePhase = (scaleWaveTime * cycleSpeed) % (Math.PI * 2); // Циклическая волна
        
        // Плавная синусоида от 0 до 1 (минимум до максимума)
        const pulse = Math.sin(wavePhase) * 0.5 + 0.5; // 0-1
        
        // Масштаб от микро (0.2) до максимума (3-4 раза)
        const minScale = 0.2; // Микро размер
        const maxScale = 2.5 + sign.scaleDelay * 0.5; // Максимальный размер (2.5-3)
        scaleMultiplier = minScale + pulse * (maxScale - minScale); // От микро до максимума
      }
      
      // Финальный масштаб (средний контролируемый размер)
      let scale = baseScale * scaleMultiplier;
      
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
      ref.element.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.2), 0 0 20px ${shadowColor}`;
    });
  });

  if (!enabled || signs.length === 0) return null;

  if (signPositions.length === 0) return null;
  
  return (
    <group>
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
                minWidth: '200px', // Минимальная ширина для читаемости
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

