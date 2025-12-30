'use client';

/**
 * Упрощенный компонент для статичной 3D визуализации шара (без анимации)
 */

import { Suspense, useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface Ball3DPreviewProps {
  color: string;
  pattern: string | null;
  imageDataUrl: string | null;
  ballSize: number;
  surfaceType: 'glossy' | 'matte' | 'metal';
  effects: {
    sparkle: boolean;
    gradient: boolean;
    glow: boolean;
    stars: boolean;
  };
}

function Toy3DPreview({
  color,
  pattern,
  imageDataUrl,
  ballSize,
  surfaceType,
  effects,
}: Ball3DPreviewProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // Загружаем текстуру изображения, если есть
  useEffect(() => {
    if (imageDataUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(
        imageDataUrl,
        (loadedTexture) => {
          loadedTexture.flipY = false;
          loadedTexture.needsUpdate = true;
          setTexture(loadedTexture);
        },
        undefined,
        () => setTexture(null)
      );
    } else {
      setTexture(null);
    }
  }, [imageDataUrl]);

  // Медленное вращение
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  // Настройки материала в зависимости от типа поверхности
  const metalness = surfaceType === 'glossy' ? 0.1 : surfaceType === 'matte' ? 0.0 : 0.9;
  const roughness = surfaceType === 'glossy' ? 0.1 : surfaceType === 'matte' ? 0.9 : 0.2;

  return (
    <group>
      <mesh ref={meshRef} scale={ballSize}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial
          map={texture || null}
          color={texture ? '#ffffff' : color}
          metalness={metalness}
          roughness={roughness}
          emissive={effects.glow ? color : '#000000'}
          emissiveIntensity={effects.glow ? 0.3 : 0}
        />
      </mesh>
      {effects.sparkle && (
        <pointLight position={[0, 0, 0]} intensity={1.5} color={color} distance={5} />
      )}
    </group>
  );
}

export default function Ball3DPreview(props: Ball3DPreviewProps) {
  return (
    <div className="w-full h-full">
      <Canvas shadows gl={{ preserveDrawingBuffer: true, antialias: true }}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
          <directionalLight position={[-5, 3, -5]} intensity={0.7} />
          <pointLight position={[0, 5, 0]} intensity={0.7} color="#ffffff" />
          <Stars radius={100} depth={50} count={2000} factor={4} fade speed={0.5} />
          <Toy3DPreview {...props} />
          <OrbitControls enableZoom={true} enablePan={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}

