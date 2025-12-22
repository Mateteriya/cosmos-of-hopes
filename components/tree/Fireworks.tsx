'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FireworksProps {
  count?: number;
  enabled?: boolean;
}

interface Firework {
  id: number;
  phase: 'rising' | 'exploding' | 'dead'; // Фазы: взлет, взрыв, завершен
  launchPosition: THREE.Vector3; // Позиция запуска
  explosionPosition: THREE.Vector3; // Позиция взрыва
  launchTime: number; // Время запуска
  explosionTime: number; // Время взрыва
  color: THREE.Color; // Цвет фейерверка
  particles: Array<{
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
  }>;
}

export function Fireworks({ count = 8, enabled = true }: FireworksProps) {
  const groupRef = useRef<THREE.Group>(null);
  const fireworksRef = useRef<Firework[]>([]);
  const [fireworks, setFireworks] = useState<Firework[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  // Инициализация фейерверков
  useEffect(() => {
    if (!enabled) {
      setFireworks([]);
      return;
    }
    
    console.log('🎆 Инициализация фейерверков:', count, 'взрывов');
    startTimeRef.current = Date.now();
    
    const newFireworks: Firework[] = [];
    
    for (let i = 0; i < count; i++) {
      // Размещаем точки запуска вокруг елки на земле
      const angle = (Math.PI * 2 * i) / count;
      const radius = 5 + Math.random() * 10; // Радиус от 5 до 15
      const launchX = Math.cos(angle) * radius;
      const launchZ = Math.sin(angle) * radius;
      const launchY = 0; // Запускаем с земли
      
      // Позиция взрыва - выше и ближе к центру
      const explosionRadius = radius * 0.3; // Взрывается ближе к центру
      const explosionX = Math.cos(angle) * explosionRadius;
      const explosionZ = Math.sin(angle) * explosionRadius;
      const explosionY = 8 + Math.random() * 12; // Высота взрыва от 8 до 20
      
      // Время запуска - с задержкой для разных фейерверков
      const launchDelay = Math.random() * 3; // Задержка 0-3 секунды
      const riseTime = 1.5 + Math.random() * 1; // Время полета 1.5-2.5 секунды
      
      // Выбираем яркий цвет для фейерверка
      const colorType = Math.floor(Math.random() * 6);
      let hue: number;
      if (colorType === 0) hue = Math.random() * 0.15; // Красные, оранжевые
      else if (colorType === 1) hue = 0.15 + Math.random() * 0.1; // Желтые
      else if (colorType === 2) hue = 0.3 + Math.random() * 0.15; // Зеленые
      else if (colorType === 3) hue = 0.5 + Math.random() * 0.15; // Голубые, синие
      else if (colorType === 4) hue = 0.65 + Math.random() * 0.2; // Фиолетовые
      else hue = 0.85 + Math.random() * 0.15; // Розовые, пурпурные
      
      const color = new THREE.Color().setHSL(hue, 1, 0.6); // Яркий насыщенный цвет
      
      newFireworks.push({
        id: i,
        phase: 'rising',
        launchPosition: new THREE.Vector3(launchX, launchY, launchZ),
        explosionPosition: new THREE.Vector3(explosionX, explosionY, explosionZ),
        launchTime: launchDelay,
        explosionTime: launchDelay + riseTime,
        color: color,
        particles: [], // Частицы создаются при взрыве
      });
    }
    
    fireworksRef.current = newFireworks;
    setFireworks(newFireworks);
    console.log('🎆 Фейерверки инициализированы:', newFireworks.length, 'взрывов');
  }, [count, enabled]);

  useFrame((state, delta) => {
    if (!groupRef.current || !enabled || fireworksRef.current.length === 0) return;

    const currentTime = (Date.now() - startTimeRef.current) / 1000; // Время в секундах
    let needsUpdate = false;

    fireworksRef.current = fireworksRef.current.map(firework => {
        // Фаза 1: Взлет
        if (firework.phase === 'rising' && currentTime >= firework.launchTime) {
          if (currentTime >= firework.explosionTime) {
            // Взрыв! Создаем частицы
            const particleCount = 15 + Math.floor(Math.random() * 10); // 15-25 частиц на взрыв (оптимизировано)
            const particles: Array<{
              position: THREE.Vector3;
              velocity: THREE.Vector3;
              life: number;
              maxLife: number;
            }> = [];
            
            for (let i = 0; i < particleCount; i++) {
              // Сферический разлет частиц
              const theta = Math.random() * Math.PI * 2; // Азимут
              const phi = Math.acos(2 * Math.random() - 1); // Полярный угол
              const speed = 3 + Math.random() * 4; // Скорость разлета 3-7
              
              const velocity = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed,
                Math.cos(phi) * speed
              );
              
              // Небольшая вариация цвета для частиц
              const colorVariation = (Math.random() - 0.5) * 0.1; // ±5% оттенка
              const hsl = { h: 0, s: 0, l: 0 };
              firework.color.getHSL(hsl);
              const particleHue = (hsl.h + colorVariation) % 1;
              
              particles.push({
                position: firework.explosionPosition.clone(),
                velocity: velocity,
                life: 0,
                maxLife: 1.5 + Math.random() * 1, // Живут 1.5-2.5 секунды
              });
            }
            
            needsUpdate = true;
            return {
              ...firework,
              phase: 'exploding',
              particles: particles,
            };
          }
        }
        
        // Фаза 2: Взрыв - обновляем частицы
        if (firework.phase === 'exploding') {
          const updatedParticles = firework.particles.map(particle => {
            particle.life += delta;
            
            if (particle.life < particle.maxLife) {
              // Обновляем позицию
              particle.position.add(
                particle.velocity.clone().multiplyScalar(delta * 8)
              );
              // Гравитация
              particle.velocity.y -= 1.2 * delta;
            }
            
            return particle;
          }).filter(particle => particle.life < particle.maxLife);
          
          // Обновляем состояние только если частицы изменились
          if (updatedParticles.length !== firework.particles.length) {
            needsUpdate = true;
          }
          
          if (updatedParticles.length === 0) {
            // Все частицы погасли - перезапускаем фейерверк
            const angle = (Math.PI * 2 * firework.id) / fireworks.length;
            const radius = 5 + Math.random() * 10;
            const launchX = Math.cos(angle) * radius;
            const launchZ = Math.sin(angle) * radius;
            const explosionRadius = radius * 0.3;
            const explosionX = Math.cos(angle) * explosionRadius;
            const explosionZ = Math.sin(angle) * explosionRadius;
            
            // Новый цвет
            const colorType = Math.floor(Math.random() * 6);
            let hue: number;
            if (colorType === 0) hue = Math.random() * 0.15;
            else if (colorType === 1) hue = 0.15 + Math.random() * 0.1;
            else if (colorType === 2) hue = 0.3 + Math.random() * 0.15;
            else if (colorType === 3) hue = 0.5 + Math.random() * 0.15;
            else if (colorType === 4) hue = 0.65 + Math.random() * 0.2;
            else hue = 0.85 + Math.random() * 0.15;
            
            needsUpdate = true;
            return {
              ...firework,
              phase: 'rising',
              launchPosition: new THREE.Vector3(launchX, 0, launchZ),
              explosionPosition: new THREE.Vector3(explosionX, 8 + Math.random() * 12, explosionZ),
              launchTime: currentTime + Math.random() * 2, // Задержка перед перезапуском
              explosionTime: currentTime + Math.random() * 2 + 1.5 + Math.random() * 1,
              color: new THREE.Color().setHSL(hue, 1, 0.6),
              particles: [],
            };
          }
          
          return {
            ...firework,
            particles: updatedParticles,
          };
        }
        
        return firework;
    });
    
    // Обновляем состояние только при необходимости (не каждый кадр!)
    if (needsUpdate) {
      setFireworks([...fireworksRef.current]);
    }
  });

  if (!enabled || fireworksRef.current.length === 0) return null;

  return (
    <group ref={groupRef}>
      {fireworksRef.current.map((firework) => {
        // Рендерим ракету во время взлета
        if (firework.phase === 'rising') {
          const currentTime = (Date.now() - startTimeRef.current) / 1000;
          if (currentTime >= firework.launchTime && currentTime < firework.explosionTime) {
            // Интерполируем позицию между запуском и взрывом
            const progress = (currentTime - firework.launchTime) / (firework.explosionTime - firework.launchTime);
            const position = firework.launchPosition.clone().lerp(firework.explosionPosition, progress);
            
            return (
              <mesh key={`rocket-${firework.id}`} position={position}>
                <sphereGeometry args={[0.15, 6, 6]} />
                <meshStandardMaterial
                  color={firework.color}
                  emissive={firework.color}
                  emissiveIntensity={3.0}
                  roughness={0.1}
                  metalness={0.9}
                />
              </mesh>
            );
          }
        }
        
        // Рендерим частицы взрыва
        if (firework.phase === 'exploding') {
          return (
            <group key={`explosion-${firework.id}`}>
              {firework.particles.map((particle, index) => {
                const lifeProgress = particle.life / particle.maxLife;
                const opacity = Math.max(0, 1 - lifeProgress);
                const size = 0.2 + (1 - lifeProgress) * 0.3; // Уменьшается со временем
                
                return (
                  <mesh key={`particle-${firework.id}-${index}`} position={particle.position}>
                    <sphereGeometry args={[size, 6, 6]} />
                    <meshStandardMaterial
                      color={firework.color}
                      emissive={firework.color}
                      emissiveIntensity={4.0 - lifeProgress * 2} // Ярко светится и гаснет
                      transparent
                      opacity={opacity}
                      roughness={0.1}
                      metalness={0.9}
                    />
                  </mesh>
                );
              })}
            </group>
          );
        }
        
        return null;
      })}
    </group>
  );
}
