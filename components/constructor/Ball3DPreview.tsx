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
  const [seamlessTexture, setSeamlessTexture] = useState<THREE.Texture | null>(null);

  // Создаем текстуру из изображения пользователя
  useEffect(() => {
    if (imageDataUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          setSeamlessTexture(null);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        let backgroundColor = color || '#FFFFFF';
        if (backgroundColor === '#000000' || backgroundColor === '#000' || backgroundColor.toLowerCase() === 'black') {
          backgroundColor = '#FFFFFF';
        }

        // Заливаем фоном
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Переворачиваем координаты canvas для правильной ориентации изображения на сфере
        ctx.save();
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
        // Рисуем исходное изображение (перевернутым)
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.flipY = false;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
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

  // Создаем градиентную текстуру
  const gradientTexture = useMemo(() => {
    if (effects.gradient && !texture) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 256);
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const lightR = Math.min(255, r + 120);
        const lightG = Math.min(255, g + 120);
        const lightB = Math.min(255, b + 120);
        const midR = Math.min(255, r + 40);
        const midG = Math.min(255, g + 40);
        const midB = Math.min(255, b + 40);
        const darkR = Math.max(0, r - 100);
        const darkG = Math.max(0, g - 100);
        const darkB = Math.max(0, b - 100);

        gradient.addColorStop(0, `rgb(${lightR}, ${lightG}, ${lightB})`);
        gradient.addColorStop(0.3, `rgb(${midR}, ${midG}, ${midB})`);
        gradient.addColorStop(0.7, color);
        gradient.addColorStop(1, `rgb(${darkR}, ${darkG}, ${darkB})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
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
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 10;
        for (let i = 0; i < 10; i++) {
          ctx.beginPath();
          ctx.moveTo(0, i * 25.6);
          ctx.lineTo(256, i * 25.6);
          ctx.stroke();
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.flipY = false;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        return tex;
      }
    } else if (pattern === 'dots' && !texture && !gradientTexture) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#fff';
        for (let x = 0; x < 256; x += 64) {
          for (let y = 0; y < 256; y += 64) {
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
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
        return tex;
      }
    }
    return null;
  }, [pattern, color, texture, gradientTexture]);

  // Материал с учетом всех параметров
  const material = useMemo(() => {
    let metalness = 0.3;
    let roughness = 0.4;

    if (surfaceType === 'glossy') {
      metalness = 0.1;
      roughness = 0.1;
    } else if (surfaceType === 'matte') {
      metalness = 0.0;
      roughness = 0.9;
    } else if (surfaceType === 'metal') {
      metalness = 0.9;
      roughness = 0.2;
    }

    if (texture || patternTexture || gradientTexture) {
      metalness = texture ? 0.1 : metalness * 0.5;
      roughness = texture ? 0.2 : roughness;
    }

    let materialColor: string;
    if (texture) {
      materialColor = '#ffffff';
    } else if (gradientTexture) {
      materialColor = '#ffffff';
    } else {
      materialColor = color || '#FF0000';
      if (materialColor === '#000000' || materialColor === '#000' || materialColor.toLowerCase() === 'black') {
        materialColor = '#FF0000';
      }
    }

    const mat = new THREE.MeshStandardMaterial({
      color: texture ? new THREE.Color('#ffffff') : new THREE.Color(materialColor),
      emissive: effects.glow ? new THREE.Color(materialColor) : new THREE.Color('#000000'),
      emissiveIntensity: effects.glow ? 0.5 : 0,
      metalness: metalness,
      roughness: roughness,
    });

    if (texture && texture.image) {
      mat.map = texture;
      mat.map.needsUpdate = true;
      mat.map.wrapS = THREE.RepeatWrapping;
      mat.map.wrapT = THREE.ClampToEdgeWrapping;
      mat.map.flipY = false;
      if (mat.map.offset) mat.map.offset.set(0, 0);
      if (mat.map.repeat) mat.map.repeat.set(1, 1);
    } else if (gradientTexture && gradientTexture.image) {
      mat.map = gradientTexture;
      mat.map.needsUpdate = true;
      mat.map.wrapS = THREE.ClampToEdgeWrapping;
      mat.map.wrapT = THREE.ClampToEdgeWrapping;
      mat.map.flipY = false;
    } else if (patternTexture && patternTexture.image) {
      mat.map = patternTexture;
      mat.map.needsUpdate = true;
      mat.map.wrapS = THREE.ClampToEdgeWrapping;
      mat.map.wrapT = THREE.ClampToEdgeWrapping;
      mat.map.flipY = false;
    } else {
      mat.map = null;
    }

    return mat;
  }, [color, texture, patternTexture, gradientTexture, surfaceType, effects.glow]);

  // Медленное вращение
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} scale={ballSize}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <primitive object={material} attach="material" />
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

