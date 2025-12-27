'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface UserBallParticlesProps {
  position: [number, number, number];
  count?: number;
  enabled?: boolean;
}

/**
 * Частицы-звездочки вокруг шарика пользователя
 * Яркие неоновые точки, которые разлетаются от шара
 */
export function UserBallParticles({ 
  position, 
  count = 30,
  enabled = true 
}: UserBallParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<Array<{
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    size: number;
  }>>([]);

  // Инициализация частиц при монтировании
  useEffect(() => {
    if (!enabled) {
      particlesRef.current = [];
      return;
    }

    const particles: typeof particlesRef.current = [];
    const ballCenter = new THREE.Vector3(...position);
    
    for (let i = 0; i < count; i++) {
      // Начальная позиция - случайная точка на поверхности сферы вокруг шара
      const radius = 0.5;
      const theta = Math.random() * Math.PI * 2; // Азимутальный угол
      const phi = Math.acos(2 * Math.random() - 1); // Полярный угол
      
      const startPos = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );

      // Скорость - от центра наружу с небольшой случайностью
      const direction = startPos.clone().normalize();
      const speed = 0.5 + Math.random() * 0.5; // 0.5-1.0 (быстрее!)
      const velocity = direction.multiplyScalar(speed);
      
      // Небольшая случайная добавка к скорости для разнообразия
      velocity.x += (Math.random() - 0.5) * 0.3;
      velocity.y += (Math.random() - 0.5) * 0.3;
      velocity.z += (Math.random() - 0.5) * 0.3;

      particles.push({
        position: ballCenter.clone().add(startPos),
        velocity,
        life: 0,
        maxLife: 1.5 + Math.random() * 1.5, // 1.5-3 секунды жизни
        size: 0.1 + Math.random() * 0.12, // Размер частицы (крупные и заметные!)
      });
    }

    particlesRef.current = particles;
  }, [position[0], position[1], position[2], count, enabled]);

  // Геометрия частицы (крупная заметная сфера)
  const particleGeometry = useMemo(() => {
    return new THREE.SphereGeometry(0.12, 10, 10);
  }, []);

  // Материал для частиц - яркий неоновый цвет (розовый/фиолетовый/голубой)
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xff00ff, // Яркий неоновый розовый/фиолетовый
      emissive: 0xff00ff,
      emissiveIntensity: 5.0, // Очень яркие!
      transparent: false, // Не прозрачные для лучшей видимости
      opacity: 1.0,
      roughness: 0.0,
      metalness: 0.0,
    });
  }, []);

  // Анимация частиц
  useFrame((state, delta) => {
    if (!meshRef.current || !enabled || particlesRef.current.length === 0) return;

    const particles = particlesRef.current;

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      
      // Обновляем позицию
      particle.position.add(particle.velocity.clone().multiplyScalar(delta));
      
      // Обновляем время жизни
      particle.life += delta;
      
      // Медленное замедление
      particle.velocity.multiplyScalar(0.95);
      
      // Если частица слишком далеко или время жизни истекло - пересоздаем её у шара
      const ballCenter = new THREE.Vector3(...position);
      const distanceFromBall = particle.position.distanceTo(ballCenter);
      if (particle.life > particle.maxLife || distanceFromBall > 4) {
        // Пересоздаем частицу у шара
        const radius = 0.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const startPos = new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );

        const direction = startPos.clone().normalize();
        const speed = 0.5 + Math.random() * 0.5;
        const velocity = direction.multiplyScalar(speed);
        velocity.x += (Math.random() - 0.5) * 0.3;
        velocity.y += (Math.random() - 0.5) * 0.3;
        velocity.z += (Math.random() - 0.5) * 0.3;

        particle.position.copy(ballCenter.clone().add(startPos));
        particle.velocity.copy(velocity);
        particle.life = 0;
        particle.maxLife = 1.5 + Math.random() * 1.5;
      }

      // Обновляем матрицу для инстансированного рендеринга
      const matrix = new THREE.Matrix4();
      
      // Пульсация размера для эффекта "мерцания" - более заметная
      const baseSize = particle.size;
      const pulseSize = baseSize * (1 + Math.sin(state.clock.elapsedTime * 5 + i) * 0.5);
      
      // Сначала масштабируем, потом устанавливаем позицию
      matrix.makeScale(pulseSize, pulseSize, pulseSize);
      matrix.setPosition(particle.position);
      
      meshRef.current.setMatrixAt(i, matrix);
      
      // Для instanced mesh меняем цвет через отдельные материалы сложно,
      // но можно использовать базовый яркий неоновый цвет
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!enabled || particlesRef.current.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[particleGeometry, material, count]}
      frustumCulled={false}
    />
  );
}

