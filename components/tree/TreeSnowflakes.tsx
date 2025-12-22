'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TreeSnowflakesProps {
  count?: number;
  size?: number;
  treeHeight?: number;
  treeWidth?: number;
}

export function TreeSnowflakes({ 
  count = 40, 
  size = 0.1,
  treeHeight = 90,
  treeWidth = 20
}: TreeSnowflakesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const positionsRef = useRef<Float32Array | null>(null);
  const rotationsRef = useRef<Float32Array | null>(null);

  // Создаем позиции снежинок на ёлке (распределены по высоте и вокруг)
  const { positions, rotations } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const rot = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Распределяем по высоте ёлки (от низа до верха)
      const heightRatio = Math.random(); // От 0 до 1
      const y = -treeHeight * 0.5 + heightRatio * treeHeight;
      
      // Распределяем вокруг ёлки (радиус зависит от высоты - шире внизу, уже вверху)
      const widthAtHeight = treeWidth * (1 - heightRatio * 0.6); // Уже кверху
      const angle = Math.random() * Math.PI * 2;
      const radius = (Math.random() * 0.5 + 0.3) * widthAtHeight; // От 30% до 80% ширины
      
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
      
      // Случайные начальные вращения
      rot[i * 3] = Math.random() * Math.PI * 2;
      rot[i * 3 + 1] = Math.random() * Math.PI * 2;
      rot[i * 3 + 2] = Math.random() * Math.PI * 2;
    }
    
    positionsRef.current = pos;
    rotationsRef.current = rot;
    
    return { positions: pos, rotations: rot };
  }, [count, treeHeight, treeWidth]);

  // Легкое покачивание снежинок (как будто на ветках)
  useFrame((state) => {
    if (!meshRef.current || !positionsRef.current || !rotationsRef.current) return;
    
    const positions = positionsRef.current;
    const rotations = rotationsRef.current;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Легкое покачивание (очень медленное)
      const swayAmount = 0.02;
      const swaySpeed = 0.3;
      const swayX = Math.sin(state.clock.elapsedTime * swaySpeed + i) * swayAmount;
      const swayZ = Math.cos(state.clock.elapsedTime * swaySpeed * 0.7 + i) * swayAmount;
      
      // Очень медленное вращение
      rotations[i3 + 2] += 0.01;
      
      // Обновляем матрицу
      const matrix = new THREE.Matrix4();
      matrix.makeRotationZ(rotations[i3 + 2]);
      matrix.setPosition(
        positions[i3] + swayX,
        positions[i3 + 1],
        positions[i3 + 2] + swayZ
      );
      
      meshRef.current.setMatrixAt(i, matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Геометрия снежинки (простая сфера)
  const snowflakeGeometry = useMemo(() => {
    return new THREE.SphereGeometry(size, 4, 4);
  }, [size]);

  // Материал для снежинок на ёлке (белый, яркий, хорошо видимый)
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5, // Увеличена яркость свечения
      transparent: true,
      opacity: 0.9, // Увеличена непрозрачность для лучшей видимости
      roughness: 0.1, // Более блестящие
      metalness: 0.0,
    });
  }, []);

  return (
    <instancedMesh
      ref={meshRef}
      args={[snowflakeGeometry, material, count]}
      frustumCulled={false}
    />
  );
}

