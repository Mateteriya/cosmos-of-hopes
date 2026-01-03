'use client';

/**
 * Компонент магического превращения 2D игрушки в 3D
 * Самая мощная визуализация превращения желания в реальную игрушку
 */

import { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface MagicTransformationProps {
  color: string;
  pattern: string | null;
  wishText: string;
  wishForOthers?: string;
  imageDataUrl: string | null;
  ballSize: number;
  surfaceType: 'glossy' | 'matte' | 'metal';
  effects: {
    sparkle: boolean;
    gradient: boolean;
    glow: boolean;
    stars: boolean;
  };
  onComplete: () => void;
  onClose: () => void;
}

// Компонент для 3D игрушки (всегда шар)
function Toy3D({ 
  color, 
  pattern, 
  imageDataUrl,
  isAnimating,
  ballSize,
  surfaceType,
  effects
}: { 
  color: string; 
  pattern: string | null;
  imageDataUrl: string | null;
  isAnimating: boolean;
  ballSize: number;
  surfaceType: 'glossy' | 'matte' | 'metal';
  effects: {
    sparkle: boolean;
    gradient: boolean;
    glow: boolean;
    stars: boolean;
  };
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const glowRefs = useRef<THREE.Mesh[]>([]);
  const [scale, setScale] = useState(1); // Начинаем с 1, чтобы шар был виден сразу
  const [glowIntensity, setGlowIntensity] = useState(1); // Начинаем с 1 для видимости

  // Анимация появления
  useEffect(() => {
    if (isAnimating) {
      // Начинаем анимацию с 0
      setScale(0);
      setGlowIntensity(0);
      
      const duration = 2000; // 2 секунды
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Плавное появление с эффектом "всасывания"
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        setScale(easeOutCubic);
        
        // Свечение
        setGlowIntensity(Math.sin(progress * Math.PI) * 2);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // После завершения анимации устанавливаем финальные значения
          setScale(1); // Полный масштаб
          setGlowIntensity(1); // Постоянное свечение
        }
      };
      
      animate();
    }
    // НЕ сбрасываем scale и glowIntensity когда isAnimating становится false
    // Это позволяет шару оставаться видимым после завершения анимации
  }, [isAnimating]);

  // Обновляем размер mesh при изменении ballSize (даже когда анимация не запущена)
  useEffect(() => {
    if (meshRef.current) {
      const geometry = meshRef.current.geometry;
      // Пересчитываем нормали после изменения размера для правильного освещения
      geometry.computeVertexNormals();
      const currentScale = scale > 0 ? scale : 1; // Если анимация не запущена, используем полный масштаб
      meshRef.current.scale.setScalar(currentScale * ballSize);
    }
  }, [ballSize, scale]);

  // Постоянная анимация пульсации
  useFrame((state) => {
    if (meshRef.current) {
      // Всегда применяем ballSize и scale вместе
      const finalScale = scale > 0 ? scale : 1; // Если scale = 0, используем 1
      
      if (isAnimating && scale > 0) {
        // Во время анимации добавляем пульсацию
        const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
        meshRef.current.scale.setScalar(finalScale * ballSize * pulse);
        
        // Усиленное вращение для полного оборота (примерно 3 полных оборота за 10 секунд)
        meshRef.current.rotation.y += 0.05;
      } else {
        // После завершения анимации - полный масштаб без пульсации, но с вращением
        meshRef.current.scale.setScalar(finalScale * ballSize);
        meshRef.current.rotation.y += 0.05; // Продолжаем вращение для полного оборота (быстрее)
      }
    }
    
    // Анимация многослойного свечения
    if (effects.glow && glowRefs.current.length > 0) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.15 + 0.85;
      glowRefs.current.forEach((glow, index) => {
        if (glow) {
          const finalScale = scale > 0 ? scale : 1;
          const scaleMultiplier = index === 0 ? 1.3 : index === 1 ? 1.4 : 1.25;
          glow.scale.setScalar(finalScale * ballSize * scaleMultiplier * (isAnimating ? pulse : 1));
        }
      });
    }
  });

  // Создаем текстуру из изображения, если есть (с seamless расширением для устранения швов)
  const [seamlessTexture, setSeamlessTexture] = useState<THREE.Texture | null>(null);
  
  useEffect(() => {
    if (imageDataUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Обрабатываем изображение для устранения черной полосы
        // Создаем canvas для обработки изображения
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          setSeamlessTexture(null);
          return;
        }
        
        // Используем размеры исходного изображения
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Используем цвет, который выбрал пользователь для шара, вместо белого
        // Если цвет не задан или черный, используем белый по умолчанию
        let backgroundColor = color || '#FFFFFF';
        if (backgroundColor === '#000000' || backgroundColor === '#000' || backgroundColor.toLowerCase() === 'black') {
          backgroundColor = '#FFFFFF';
        }
        
        // Заливаем фоном выбранного пользователем цвета (на случай прозрачных или черных краев)
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Переворачиваем координаты canvas для правильной ориентации изображения на сфере
        ctx.save();
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
        // Рисуем исходное изображение поверх фона (перевернутым)
        ctx.drawImage(img, 0, 0);
        ctx.restore();
        
        // Создаем текстуру из обработанного canvas
        const tex = new THREE.CanvasTexture(canvas);
        
        // Используем RepeatWrapping для возможности смещения
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.flipY = false;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = 16; // Улучшенная фильтрация для высокого качества
        
        // НЕ используем offset - это может создавать артефакты
        // Вместо этого используем текстуру как есть
        tex.offset.set(0, 0);
        tex.repeat.set(1, 1);
        
        tex.needsUpdate = true;
        setSeamlessTexture(tex);
      };
      img.onerror = () => setSeamlessTexture(null);
      img.src = imageDataUrl;
    } else {
      setSeamlessTexture(null);
    }
  }, [imageDataUrl, color]);
  
  const texture = seamlessTexture;

  // Создаем градиентную текстуру (улучшенная, более реалистичная)
  // ВАЖНО: градиент применяется только если нет пользовательского рисунка
  const gradientTexture = useMemo(() => {
    if (effects.gradient && !texture) {
      const canvas = document.createElement('canvas');
      canvas.width = 2048; // Увеличиваем разрешение для высокого качества
      canvas.height = 2048;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Создаем радиальный градиент с более плавными переходами
        const gradient = ctx.createRadialGradient(1024, 1024, 200, 1024, 1024, 1024);
        
        // Преобразуем HEX цвет в RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Более яркий центр
        const lightR = Math.min(255, r + 120);
        const lightG = Math.min(255, g + 120);
        const lightB = Math.min(255, b + 120);
        // Средний тон
        const midR = Math.min(255, r + 40);
        const midG = Math.min(255, g + 40);
        const midB = Math.min(255, b + 40);
        // Темные края
        const darkR = Math.max(0, r - 100);
        const darkG = Math.max(0, g - 100);
        const darkB = Math.max(0, b - 100);
        
        gradient.addColorStop(0, `rgb(${lightR}, ${lightG}, ${lightB})`);
        gradient.addColorStop(0.3, `rgb(${midR}, ${midG}, ${midB})`);
        gradient.addColorStop(0.7, color);
        gradient.addColorStop(1, `rgb(${darkR}, ${darkG}, ${darkB})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 2048, 2048);
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.flipY = false;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        return tex;
      }
    }
    return null;
  }, [effects.gradient, color, texture]);

  // Создаем текстуру узора
  const patternTexture = useMemo(() => {
    if (pattern === 'stripes' && !texture && !gradientTexture) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024; // Увеличиваем разрешение для высокого качества
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1024, 1024);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 40; // Увеличиваем толщину линии пропорционально разрешению
        for (let i = 0; i < 10; i++) {
          ctx.beginPath();
          ctx.moveTo(0, i * 102.4);
          ctx.lineTo(1024, i * 102.4);
          ctx.stroke();
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.flipY = false;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = 16; // Улучшенная фильтрация для высокого качества
        return tex;
      }
    } else if (pattern === 'dots' && !texture && !gradientTexture) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024; // Увеличиваем разрешение для высокого качества
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1024, 1024);
        ctx.fillStyle = '#fff';
        for (let x = 0; x < 1024; x += 256) {
          for (let y = 0; y < 1024; y += 256) {
            ctx.beginPath();
            ctx.arc(x, y, 60, 0, Math.PI * 2); // Увеличиваем размер точек пропорционально разрешению
            ctx.fill();
          }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.flipY = false;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.anisotropy = 16; // Улучшенная фильтрация для высокого качества
        return tex;
      }
    }
    return null;
  }, [pattern, color, texture, gradientTexture]);

  // Создаем материал с учетом типа поверхности и эффектов
  const material = useMemo(() => {
    // Настройки материала в зависимости от типа поверхности
    let metalness = 0.3;
    let roughness = 0.4;
    
    if (surfaceType === 'glossy') {
      metalness = 0.1;
      roughness = 0.1; // Глянец - низкая шероховатость
    } else if (surfaceType === 'matte') {
      metalness = 0.0;
      roughness = 0.9; // Мат - высокая шероховатость
    } else if (surfaceType === 'metal') {
      metalness = 0.9;
      roughness = 0.2; // Металл - высокий металлизм
    }
    
    // Если есть текстура, корректируем параметры для лучшей 3D-видимости
    if (texture || patternTexture || gradientTexture) {
      // Улучшаем параметры для подчеркивания 3D-формы даже с эффектами
      metalness = texture ? 0.2 : (effects.gradient || effects.glow ? 0.3 : metalness * 0.6);
      roughness = texture ? 0.15 : (effects.gradient || effects.glow ? 0.25 : roughness * 0.7);
    }
    
    // Определяем цвет материала: 
    // 1. Если есть пользовательский рисунок (texture) - ВСЕГДА белый для лучшей видимости рисунка
    // 2. Если есть градиент - белый
    // 3. Если нет ни того, ни другого - используем ТОЧНО тот цвет, который выбрал пользователь
    let materialColor: string;
    
    if (texture) {
      // Если есть рисунок пользователя - ВСЕГДА белый, чтобы рисунок был виден
      materialColor = '#ffffff';
    } else if (gradientTexture) {
      // Если есть градиент - тоже белый
      materialColor = '#ffffff';
    } else {
      // ИСПОЛЬЗУЕМ ТОЧНО ТОТ ЦВЕТ, КОТОРЫЙ ВЫБРАЛ ПОЛЬЗОВАТЕЛЬ!
      // ТОЛЬКО если он черный (#000000 или #000) - заменяем на красный
      materialColor = color || '#FF0000'; // По умолчанию красный, если цвет не задан
      
      // СТРОГАЯ ПРОВЕРКА: ТОЛЬКО черный цвет заменяем
      if (materialColor === '#000000' || materialColor === '#000' || materialColor.toLowerCase() === 'black') {
        materialColor = '#FF0000'; // Красный вместо черного
      }
      // ВСЕ ОСТАЛЬНЫЕ ЦВЕТА ИСПОЛЬЗУЕМ КАК ЕСТЬ - БЕЗ ИЗМЕНЕНИЙ!
    }
    
    // ФИНАЛЬНАЯ ГАРАНТИЯ: если по какой-то причине цвет стал черным - заменяем
    if (materialColor === '#000000' || materialColor === '#000' || materialColor.toLowerCase() === 'black' || !materialColor) {
      materialColor = texture ? '#ffffff' : (color && color !== '#000000' && color !== '#000' && color.toLowerCase() !== 'black' ? color : '#FF0000');
    }
    
    // ГАРАНТИЯ: материал НИКОГДА не будет черным
    // Если materialColor все еще черный по какой-то причине - принудительно заменяем
    if (!materialColor || materialColor === '#000000' || materialColor === '#000' || materialColor.toLowerCase() === 'black') {
      materialColor = texture ? '#ffffff' : (color && color !== '#000000' && color !== '#000' ? color : '#FF0000');
    }
    
    const mat = new THREE.MeshStandardMaterial({
      // ВАЖНО: Пользовательский рисунок (texture) имеет приоритет над всеми эффектами
      // Цвет материала - ТОЧНО тот, который выбрал пользователь (или белый для texture)
      // НО: если есть текстура, цвет должен быть белым, чтобы текстура отображалась правильно
      color: texture ? new THREE.Color('#ffffff') : new THREE.Color(materialColor), // Используем THREE.Color для гарантии правильного формата
      // Emissive только для эффекта glow
      emissive: effects.glow ? new THREE.Color(materialColor) : new THREE.Color('#000000'),
      emissiveIntensity: effects.glow ? Math.max(glowIntensity * 0.5, 0.3) : 0, // Без glow - без свечения
      metalness: metalness,
      roughness: roughness,
      transparent: false,
      opacity: 1.0,
      flatShading: false, // Плавные грани для реалистичности
      envMapIntensity: surfaceType === 'glossy' ? 1.5 : surfaceType === 'metal' ? 2.0 : 0.5, // Отражения для глянца и металла
      // Добавляем specular для эффекта отблеска света
      specular: new THREE.Color(0xffffff),
      shininess: surfaceType === 'glossy' ? 100 : surfaceType === 'metal' ? 80 : 30, // Блеск для подчеркивания 3D-формы
    });
    
      // ПРИОРИТЕТ: Пользовательский рисунок > Градиент > Узор
      if (texture && texture.image) {
        // Пользовательский рисунок всегда имеет приоритет
        mat.map = texture;
        mat.map.needsUpdate = true;
        // Используем RepeatWrapping без смещения
        mat.map.wrapS = THREE.RepeatWrapping;
        mat.map.wrapT = THREE.ClampToEdgeWrapping;
        mat.map.flipY = false;
        // Улучшенная фильтрация для высокого качества
        if (mat.map.anisotropy !== undefined) mat.map.anisotropy = 16;
        // Не используем offset - это может создавать черную полосу
        if (mat.map.offset) mat.map.offset.set(0, 0);
        if (mat.map.repeat) mat.map.repeat.set(1, 1);
      } else if (gradientTexture && gradientTexture.image) {
        mat.map = gradientTexture;
        mat.map.needsUpdate = true;
        mat.map.wrapS = THREE.ClampToEdgeWrapping;
        mat.map.wrapT = THREE.ClampToEdgeWrapping;
        mat.map.flipY = false;
        if (mat.map.anisotropy !== undefined) mat.map.anisotropy = 16;
      } else if (patternTexture && patternTexture.image) {
        mat.map = patternTexture;
        mat.map.needsUpdate = true;
        mat.map.wrapS = THREE.ClampToEdgeWrapping;
        mat.map.wrapT = THREE.ClampToEdgeWrapping;
        mat.map.flipY = false;
        if (mat.map.anisotropy !== undefined) mat.map.anisotropy = 16;
      } else {
        mat.map = null;
      }
    
    return mat;
  }, [color, glowIntensity, texture, patternTexture, gradientTexture, surfaceType, effects.glow, effects.gradient]);

  // Обновляем материал при изменении параметров
  useEffect(() => {
    if (material) {
      // Обновляем параметры поверхности
      if (surfaceType === 'glossy') {
        material.metalness = 0.1;
        material.roughness = 0.1;
      } else if (surfaceType === 'matte') {
        material.metalness = 0.0;
        material.roughness = 0.9;
      } else if (surfaceType === 'metal') {
        material.metalness = 0.9;
        material.roughness = 0.2;
      }
      
      // Определяем цвет для свечения: если цвет слишком темный, используем яркий розовый
      let glowColor = color;
      if (glowColor && glowColor !== '#000000' && glowColor !== 'black') {
        const hexColor = glowColor.startsWith('#') ? glowColor : `#${glowColor}`;
        const hex = hexColor.replace('#', '');
        if (hex.length === 6) {
          try {
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            if (r + g + b < 100) {
              glowColor = '#ff69b4'; // Яркий розовый по умолчанию
            }
          } catch (e) {
            glowColor = '#ff69b4';
          }
        } else {
          glowColor = '#ff69b4';
        }
      } else {
        glowColor = '#ff69b4';
      }
      
      // Определяем цвет материала с той же логикой, что и при создании
      let materialColorToUse: string;
      
      if (texture) {
        // Если есть рисунок пользователя - ВСЕГДА белый
        materialColorToUse = '#ffffff';
      } else if (gradientTexture) {
        // Если есть градиент - тоже белый
        materialColorToUse = '#ffffff';
      } else {
        // ИСПОЛЬЗУЕМ ТОЧНО ТОТ ЦВЕТ, КОТОРЫЙ ВЫБРАЛ ПОЛЬЗОВАТЕЛЬ!
        materialColorToUse = color || '#FF0000';
        
        // СТРОГАЯ ПРОВЕРКА: ТОЛЬКО черный цвет заменяем
        if (materialColorToUse === '#000000' || materialColorToUse === '#000' || materialColorToUse.toLowerCase() === 'black') {
          materialColorToUse = '#FF0000'; // Красный вместо черного
        }
        // ВСЕ ОСТАЛЬНЫЕ ЦВЕТА ИСПОЛЬЗУЕМ КАК ЕСТЬ - БЕЗ ИЗМЕНЕНИЙ!
      }
      
      // ФИНАЛЬНАЯ ГАРАНТИЯ: если по какой-то причине цвет стал черным - заменяем
      if (materialColorToUse === '#000000' || materialColorToUse === '#000' || materialColorToUse.toLowerCase() === 'black' || !materialColorToUse) {
        materialColorToUse = texture ? '#ffffff' : (color && color !== '#000000' && color !== '#000' && color.toLowerCase() !== 'black' ? color : '#FF0000');
      }
      
      // Обновляем цвет материала - ТОЧНО таким, как выбран пользователем
      material.color = new THREE.Color(materialColorToUse);
      
      // Emissive только для эффекта glow
      material.emissive = effects.glow ? new THREE.Color(glowColor) : new THREE.Color('#000000');
      material.emissiveIntensity = effects.glow ? Math.max(glowIntensity * 0.5, 0.3) : 0; // Без glow - без свечения
      
      // Обновляем текстуру с правильным приоритетом
      // ПРИОРИТЕТ: Пользовательский рисунок > Градиент > Узор
      if (texture && texture.image) {
        // Пользовательский рисунок всегда имеет приоритет
        material.map = texture;
        material.map.needsUpdate = true;
        // Используем RepeatWrapping без смещения
        material.map.wrapS = THREE.RepeatWrapping;
        material.map.wrapT = THREE.ClampToEdgeWrapping;
        material.map.flipY = false;
        // Улучшенная фильтрация для высокого качества
        if (material.map.anisotropy !== undefined) material.map.anisotropy = 16;
        // Не используем offset - это может создавать черную полосу
        if (material.map.offset) material.map.offset.set(0, 0);
        if (material.map.repeat) material.map.repeat.set(1, 1);
      } else if (effects.gradient && gradientTexture && gradientTexture.image) {
        material.map = gradientTexture;
        material.map.needsUpdate = true;
        material.map.wrapS = THREE.ClampToEdgeWrapping;
        material.map.wrapT = THREE.ClampToEdgeWrapping;
        material.map.flipY = false;
        if (material.map.anisotropy !== undefined) material.map.anisotropy = 16;
      } else if (patternTexture && patternTexture.image) {
        material.map = patternTexture;
        material.map.needsUpdate = true;
        material.map.wrapS = THREE.ClampToEdgeWrapping;
        material.map.wrapT = THREE.ClampToEdgeWrapping;
        material.map.flipY = false;
        if (material.map.anisotropy !== undefined) material.map.anisotropy = 16;
      } else {
        material.map = null;
      }
      
      material.needsUpdate = true;
    }
  }, [glowIntensity, material, effects.glow, effects.gradient, color, surfaceType, gradientTexture, texture, patternTexture]);


  return (
    <group ref={groupRef} scale={scale > 0 ? scale : 1}>
      {/* Основная форма игрушки - всегда шар */}
      {/* ballSize применяется в useFrame, поэтому здесь не нужно */}
      <mesh ref={meshRef} material={material} castShadow receiveShadow>
        {/* Оптимизированное количество сегментов для плавной сферы без артефактов */}
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
      
      {/* Эффект блеска (sparkle) - улучшенный, более яркий */}
      {effects.sparkle && (
        <>
          {/* Основные частицы блеска */}
          <points scale={ballSize}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={150}
                array={new Float32Array(
                  Array.from({ length: 150 * 3 }, () => {
                    const angle = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const r = 1.02 + Math.random() * 0.1; // Немного выше поверхности
                    return [
                      r * Math.sin(phi) * Math.cos(angle),
                      r * Math.sin(phi) * Math.sin(angle),
                      r * Math.cos(phi)
                    ];
                  }).flat()
                )}
                itemSize={3}
                args={[new Float32Array(150 * 3), 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              color="#FFD700"
              size={0.15}
              transparent
              opacity={1}
              sizeAttenuation={true}
            />
          </points>
          {/* Дополнительные яркие частицы */}
          <points scale={ballSize}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={50}
                array={new Float32Array(
                  Array.from({ length: 50 * 3 }, () => {
                    const angle = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const r = 1.03;
                    return [
                      r * Math.sin(phi) * Math.cos(angle),
                      r * Math.sin(phi) * Math.sin(angle),
                      r * Math.cos(phi)
                    ];
                  }).flat()
                )}
                itemSize={3}
                args={[new Float32Array(50 * 3), 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              color="#FFFFFF"
              size={0.25}
              transparent
              opacity={1}
              sizeAttenuation={true}
            />
          </points>
        </>
      )}
      
      {/* Эффект звезд на поверхности - улучшенный, более заметный */}
      {effects.stars && (
        <>
          {/* Основные звезды */}
          <points scale={ballSize}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={40}
                array={new Float32Array(
                  Array.from({ length: 40 * 3 }, () => {
                    const angle = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const r = 1.02;
                    return [
                      r * Math.sin(phi) * Math.cos(angle),
                      r * Math.sin(phi) * Math.sin(angle),
                      r * Math.cos(phi)
                    ];
                  }).flat()
                )}
                itemSize={3}
                args={[new Float32Array(40 * 3), 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              color="#FFFFFF"
              size={0.2}
              transparent
              opacity={1}
              sizeAttenuation={true}
            />
          </points>
          {/* Яркие центральные звезды */}
          <points scale={ballSize}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={15}
                array={new Float32Array(
                  Array.from({ length: 15 * 3 }, () => {
                    const angle = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const r = 1.025;
                    return [
                      r * Math.sin(phi) * Math.cos(angle),
                      r * Math.sin(phi) * Math.sin(angle),
                      r * Math.cos(phi)
                    ];
                  }).flat()
                )}
                itemSize={3}
                args={[new Float32Array(15 * 3), 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              color="#FFFF00"
              size={0.35}
              transparent
              opacity={1}
              sizeAttenuation={true}
            />
          </points>
        </>
      )}

      {/* Ушко для ниточки */}
      <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]} scale={scale}>
        <torusGeometry args={[0.15, 0.05, 8, 16]} />
        <meshStandardMaterial color="#8B4513" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Ниточка */}
      <mesh position={[0, 1.5, 0]} scale={scale}>
        <cylinderGeometry args={[0.01, 0.01, 2, 8]} />
        <meshStandardMaterial color="#F5F5DC" />
      </mesh>

      {/* Многослойное свечение вокруг игрушки (улучшенное) */}
      {effects.glow && (
        <>
          {/* Внешний слой свечения */}
          <mesh ref={(el) => { if (el) glowRefs.current[0] = el; }}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={glowIntensity * 0.8}
              transparent
              opacity={0.4}
            />
          </mesh>
          {/* Средний слой свечения */}
          <mesh ref={(el) => { if (el) glowRefs.current[1] = el; }}>
            <sphereGeometry args={[1.1, 32, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={glowIntensity * 0.5}
              transparent
              opacity={0.25}
            />
          </mesh>
          {/* Внутренний яркий слой */}
          <mesh ref={(el) => { if (el) glowRefs.current[2] = el; }}>
            <sphereGeometry args={[1.05, 32, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={glowIntensity * 1.2}
              transparent
              opacity={0.5}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

// Компонент для частиц желания, которые "всасываются" в игрушку
function WishParticles({ 
  text, 
  isAnimating, 
  targetPosition 
}: { 
  text: string; 
  isAnimating: boolean;
  targetPosition: [number, number, number];
}) {
  const particlesRef = useRef<THREE.Points>(null);
  const [positions, setPositions] = useState<Float32Array>(new Float32Array(0));
  const initialPositionsRef = useRef<Float32Array | null>(null);

  // Инициализация частиц
  useEffect(() => {
    if (isAnimating && text) {
      // Создаем частицы из букв
      const particleCount = Math.min(text.length * 3, 100);
      const initialPositions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        initialPositions[i * 3] = (Math.random() - 0.5) * 4;
        initialPositions[i * 3 + 1] = 3 + Math.random() * 2;
        initialPositions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      }
      
      initialPositionsRef.current = initialPositions;
      setPositions(initialPositions);
    } else {
      setPositions(new Float32Array(0));
      initialPositionsRef.current = null;
    }
  }, [isAnimating, text]);

  // Анимация движения частиц
  useEffect(() => {
    if (!isAnimating || !text || !initialPositionsRef.current) return;

    const duration = 1500;
    const startTime = Date.now();
    const initialPositions = initialPositionsRef.current;
    const particleCount = initialPositions.length / 3;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const newPositions = new Float32Array(initialPositions.length);
      const easeInCubic = progress * progress * progress;
      
      for (let i = 0; i < particleCount; i++) {
        const startX = initialPositions[i * 3];
        const startY = initialPositions[i * 3 + 1];
        const startZ = initialPositions[i * 3 + 2];
        
        newPositions[i * 3] = startX + (targetPosition[0] - startX) * easeInCubic;
        newPositions[i * 3 + 1] = startY + (targetPosition[1] - startY) * easeInCubic;
        newPositions[i * 3 + 2] = startZ + (targetPosition[2] - startZ) * easeInCubic;
      }
      
      setPositions(newPositions);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [isAnimating, text, targetPosition]);

  // Обновляем геометрию при изменении позиций
  useEffect(() => {
    if (particlesRef.current && positions.length > 0) {
      const geometry = particlesRef.current.geometry;
      const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
      if (positionAttribute && positionAttribute.array) {
        // Обновляем массив напрямую
        const array = positionAttribute.array as Float32Array;
        array.set(positions);
        positionAttribute.needsUpdate = true;
      }
    }
  }, [positions]);

  if (!text || positions.length === 0) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#FFD700"
        size={0.15}
        transparent
        opacity={0.9}
        sizeAttenuation={true}
      />
    </points>
  );
}

export default function MagicTransformation({
  color,
  pattern,
  wishText,
  wishForOthers,
  imageDataUrl,
  ballSize,
  surfaceType,
  effects,
  onComplete,
  onClose,
}: MagicTransformationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [stage, setStage] = useState<'initial' | 'wish-absorbing' | 'transforming' | 'complete'>('initial');

  const handleStart = () => {
    setStage('wish-absorbing');
    setIsAnimating(true);
    
    // Через 1.5 секунды начинаем трансформацию
    setTimeout(() => {
      setStage('transforming');
    }, 1500);
    
    // Через 4 секунды завершаем анимацию, но оставляем игрушку висеть
    setTimeout(() => {
      setStage('complete');
      // НЕ закрываем автоматически - пользователь сам закроет
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900 via-black to-indigo-900 flex items-center justify-center">
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-lg"
        >
          ✕ Закрыть
        </button>
      </div>

      {stage === 'initial' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="text-center mb-8">
            <div className="text-8xl mb-4 animate-pulse">✨</div>
            <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-2xl">
              Волшебная палочка
            </h2>
            <p className="text-white/80 text-xl mb-8">Превратим ваше желание в настоящую игрушку!</p>
          </div>
          <button
            onClick={handleStart}
            className="px-12 py-6 bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 text-white text-3xl font-bold rounded-2xl shadow-2xl hover:scale-110 transition-transform animate-pulse"
          >
            ✨ Начать магию ✨
          </button>
        </div>
      )}

      <div className="w-full h-full">
        <Canvas shadows gl={{ preserveDrawingBuffer: true, antialias: true }}>
          <Suspense fallback={
            <div className="absolute inset-0 flex items-center justify-center text-white z-50">
              <div className="text-2xl">Загрузка магии...</div>
            </div>
          }>
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            {/* Улучшенное освещение для подчеркивания 3D-формы и отблеска */}
            <ambientLight intensity={0.4} />
            {/* Основной направленный свет для отблеска (specular highlight) */}
            <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
            {/* Дополнительные источники света для подчеркивания 3D-формы */}
            <directionalLight position={[-5, 3, -5]} intensity={0.8} />
            <directionalLight position={[0, -5, 0]} intensity={0.6} />
            {/* Точечные источники для объемности */}
            <pointLight position={[-5, -5, -5]} intensity={0.8} color={color || '#ffffff'} />
            <pointLight position={[5, 5, 5]} intensity={0.8} color={color || '#ffffff'} />
            <pointLight position={[0, 5, 0]} intensity={0.7} color="#ffffff" />
            <pointLight position={[0, -5, 0]} intensity={0.5} color="#ffffff" />
            {/* Spot light для создания яркого отблеска на шаре */}
            <spotLight position={[8, 8, 8]} angle={0.4} penumbra={0.3} intensity={2.0} castShadow />
            <spotLight position={[0, 10, 0]} angle={0.5} penumbra={0.4} intensity={1.2} castShadow />
            
            <Stars radius={100} depth={50} count={5000} factor={4} fade speed={1} />
            
            {(isAnimating || stage !== 'initial') && (
              <>
                <Toy3D
                  color={color}
                  pattern={pattern}
                  imageDataUrl={imageDataUrl}
                  isAnimating={stage === 'complete' || isAnimating}
                  ballSize={ballSize}
                  surfaceType={surfaceType}
                  effects={effects}
                />
                
                {stage === 'wish-absorbing' && (
                  <WishParticles
                    text={wishText}
                    isAnimating={isAnimating}
                    targetPosition={[0, 0, 0]}
                  />
                )}
              </>
            )}
            
            <OrbitControls enableZoom={false} enablePan={false} />
          </Suspense>
        </Canvas>
      </div>

      {stage === 'complete' && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 backdrop-blur-sm pointer-events-none">
          <div className="text-center pointer-events-auto animate-fade-in">
            <div className="text-6xl mb-3 animate-bounce">✨</div>
            <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-2xl">Игрушка готова!</h2>
            <p className="text-white/80 text-lg mb-4">Ваше желание теперь в игрушке</p>
            <p className="text-white/60 text-sm mb-4">Игрушка останется висеть, пока вы не закроете окно</p>
            <button
              onClick={onComplete}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 text-white text-lg font-bold rounded-xl hover:scale-105 transition-transform shadow-xl"
            >
              Продолжить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
