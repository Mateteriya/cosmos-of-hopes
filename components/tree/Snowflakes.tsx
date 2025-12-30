'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SnowflakesProps {
  count?: number;
  speed?: number;
  size?: number;
  area?: { width: number; height: number; depth: number };
}

export function Snowflakes({ 
  count = 200, 
  speed = 0.5, 
  size = 0.05,
  area = { width: 50, height: 50, depth: 50 }
}: SnowflakesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<Float32Array | null>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  const countRef = useRef(count);

  // Обновляем countRef при изменении count
  countRef.current = count;

  // Создаем массив позиций и скоростей для снежинок
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Начальные позиции распределены по всей области
      pos[i * 3] = (Math.random() - 0.5) * area.width;
      pos[i * 3 + 1] = Math.random() * area.height + area.height * 0.5; // Начинаем сверху
      pos[i * 3 + 2] = (Math.random() - 0.5) * area.depth;
      
      // Случайная скорость падения для каждой снежинки
      vel[i] = 0.3 + Math.random() * 0.4; // От 0.3 до 0.7
    }
    
    particlesRef.current = pos;
    velocitiesRef.current = vel;
    
    return { positions: pos, velocities: vel };
  }, [count, area]);

  // Создаем геометрию для одной снежинки (простой круг для лучшей производительности)
  const snowflakeGeometry = useMemo(() => {
    // Используем простую сферу для лучшей производительности при большом количестве снежинок
    return new THREE.SphereGeometry(size, 4, 4);
  }, [size]);

  // Материал для снежинок (белый, полупрозрачный, с эмиссией для свечения)
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 1.0,
      roughness: 0.1,
      metalness: 0.0,
    });
  }, []);

  // Анимация падения снежинок
  useFrame((state, delta) => {
    if (!meshRef.current || !particlesRef.current || !velocitiesRef.current) return;
    
    const positions = particlesRef.current;
    const velocities = velocitiesRef.current;
    const currentCount = countRef.current;
    
    // Обновляем позиции снежинок
    for (let i = 0; i < currentCount; i++) {
      const i3 = i * 3;
      
      // Падение вниз
      positions[i3 + 1] -= velocities[i] * speed * delta * 60;
      
      // Легкое покачивание из стороны в сторону (эффект ветра)
      positions[i3] += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.01 * delta * 60;
      positions[i3 + 2] += Math.cos(state.clock.elapsedTime * 0.3 + i) * 0.01 * delta * 60;
      
      // Если снежинка упала вниз, возвращаем её наверх
      if (positions[i3 + 1] < -area.height * 0.5) {
        positions[i3 + 1] = area.height * 0.5 + Math.random() * area.height;
        positions[i3] = (Math.random() - 0.5) * area.width;
        positions[i3 + 2] = (Math.random() - 0.5) * area.depth;
      }
      
      // Обновляем матрицу для инстансированного рендеринга
      const matrix = new THREE.Matrix4();
      
      // Добавляем небольшое вращение для каждой снежинки
      const rotation = state.clock.elapsedTime * 0.5 + i;
      matrix.makeRotationZ(rotation);
      matrix.setPosition(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      
      meshRef.current.setMatrixAt(i, matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Инициализируем матрицы при монтировании
  useEffect(() => {
    if (meshRef.current && particlesRef.current) {
      const positions = particlesRef.current;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const matrix = new THREE.Matrix4();
        matrix.setPosition(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        meshRef.current.setMatrixAt(i, matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [count, positions]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[snowflakeGeometry, material, count]}
      frustumCulled={false}
      renderOrder={100}
    />
  );
}

