'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ConfettiProps {
  count?: number;
  enabled?: boolean;
}

interface ConfettiParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  color: THREE.Color;
}

export function Confetti({ count = 60, enabled = true }: ConfettiProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  // Инициализация частиц конфетти
  useEffect(() => {
    if (!enabled) {
      setParticles([]);
      return;
    }
    
    console.log('🎊 Инициализация конфетти:', count, 'частиц');
    const newParticles: ConfettiParticle[] = [];
    
    for (let i = 0; i < count; i++) {
      // Яркие неоновые праздничные цвета с максимальным разнообразием!
      // Используем разные диапазоны оттенков для большего разнообразия
      let hue: number;
      if (i % 3 === 0) {
        // Теплые цвета (красный, оранжевый, желтый)
        hue = Math.random() * 0.15; // 0-54 градусов
      } else if (i % 3 === 1) {
        // Холодные цвета (синий, фиолетовый, пурпурный)
        hue = 0.5 + Math.random() * 0.3; // 180-252 градусов
      } else {
        // Зеленые и голубые
        hue = 0.3 + Math.random() * 0.2; // 108-180 градусов
      }
      const saturation = 1.0; // Максимальная насыщенность
      const lightness = 0.45 + Math.random() * 0.15; // Яркость (0.45-0.6) - яркие, но не белые!
      const color = new THREE.Color().setHSL(hue, saturation, lightness);
      
      newParticles.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 30,
          10 + Math.random() * 20,
          (Math.random() - 0.5) * 30
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          -Math.random() * 2 - 1,
          (Math.random() - 0.5) * 2
        ),
        rotation: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        color: color,
      });
    }
    
    setParticles(newParticles);
    console.log('🎊 Конфетти инициализировано:', newParticles.length, 'частиц');
  }, [count, enabled]);

  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(0.4, 0.4); // Увеличен размер конфетти
  }, []);

  const meshRefs = useRef<{ [key: number]: THREE.Mesh | null }>({});

  useFrame((state, delta) => {
    if (!groupRef.current || !enabled || particles.length === 0) return;
    
    particles.forEach((particle, index) => {
      // Обновляем позицию (медленнее, чтобы не выглядело как ускоренный снег)
      particle.position.add(particle.velocity.clone().multiplyScalar(delta * 3));
      
      // Гравитация (слабее)
      particle.velocity.y -= 1.5 * delta;
      
      // Вращение
      particle.rotation.x += delta * 2;
      particle.rotation.y += delta * 1.5;
      particle.rotation.z += delta * 1.8;
      
      // Если упало вниз, возвращаем наверх
      if (particle.position.y < -20) {
        particle.position.set(
          (Math.random() - 0.5) * 30,
          10 + Math.random() * 20,
          (Math.random() - 0.5) * 30
        );
        particle.velocity.set(
          (Math.random() - 0.5) * 2,
          -Math.random() * 2 - 1,
          (Math.random() - 0.5) * 2
        );
      }
      
      // Обновляем позицию, вращение и цвет меша
      const mesh = meshRefs.current[index];
      if (mesh) {
        mesh.position.copy(particle.position);
        mesh.rotation.copy(particle.rotation);
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (material) {
          // Обновляем только если цвет изменился (оптимизация)
          if (Math.abs(material.color.r - particle.color.r) > 0.01 ||
              Math.abs(material.color.g - particle.color.g) > 0.01 ||
              Math.abs(material.color.b - particle.color.b) > 0.01) {
            material.color.setRGB(particle.color.r, particle.color.g, particle.color.b);
            material.emissive.setRGB(particle.color.r, particle.color.g, particle.color.b);
          }
        }
      }
    });
  });

  if (!enabled || particles.length === 0) return null;

  return (
    <group ref={groupRef}>
      {particles.map((particle, index) => {
        // Создаем уникальный ключ на основе цвета для пересоздания материала
        const colorKey = `${particle.color.r.toFixed(3)}-${particle.color.g.toFixed(3)}-${particle.color.b.toFixed(3)}`;
        return (
          <mesh
            key={`confetti-${index}-${colorKey}`}
            ref={(ref) => {
              meshRefs.current[index] = ref;
            }}
            geometry={geometry}
            position={particle.position}
            rotation={particle.rotation}
          >
            <meshStandardMaterial
              color={particle.color}
              emissive={particle.color}
              emissiveIntensity={3.5}
              side={THREE.DoubleSide}
              transparent={false}
              roughness={0.1}
              metalness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

