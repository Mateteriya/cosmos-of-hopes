'use client';

/**
 * Полноценный Canvas редактор для создания игрушек
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import type { ToyShape, ToyPattern } from '@/types/toy';

interface CanvasEditorProps {
  shape: ToyShape;
  color: string;
  pattern: ToyPattern;
  onImageChange: (imageDataUrl: string) => void;
  ballSize?: number;
  surfaceType?: 'glossy' | 'matte' | 'metal';
  effects?: {
    sparkle: boolean;
    gradient: boolean;
    glow: boolean;
    stars: boolean;
  };
  filters?: {
    blur?: number;
    contrast?: number;
    saturation?: number;
    vignette?: number;
    grain?: number;
  };
  secondColor?: string; // Второй цвет для разноцветного шара
  language?: 'ru' | 'en'; // Язык интерфейса
  t?: (key: string) => string; // Функция перевода
}

export default function CanvasEditor({
  shape,
  color,
  pattern,
  onImageChange,
  ballSize = 1.0,
  surfaceType = 'glossy',
  effects = {
    sparkle: false,
    gradient: false,
    glow: false,
    stars: false,
  },
  filters = {
    blur: 0,
    contrast: 100,
    saturation: 100,
    vignette: 0,
    grain: 0,
  },
  secondColor,
  language = 'ru',
  t = (key: string) => key,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(10);
  const [brushColor, setBrushColor] = useState('#000000');
  const [isEraser, setIsEraser] = useState(false); // Режим ластика
  const [isDragging, setIsDragging] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const lastDataUrlRef = useRef<string | null>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  const userDrawingLayerRef = useRef<HTMLCanvasElement | null>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null); // Canvas для базового изображения
  const historyRef = useRef<string[]>([]); // История состояний canvas
  const historyIndexRef = useRef<number>(-1); // Индекс текущего состояния в истории

  // Получаем правильные координаты с учетом масштаба (для мыши)
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Получаем правильные координаты для touch-событий
  const getCanvasCoordinatesTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0] || e.changedTouches[0];
    
    if (!touch) return { x: 0, y: 0 };

    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  };

  // Рисуем базовую форму с профессиональными эффектами уровня Photoshop
  const drawBaseShape = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.4;
    const radius = baseRadius * ballSize;

    ctx.save();

    if (shape === 'ball') {
      // Создаем базовый цвет/градиент
      let baseFillStyle: string | CanvasGradient = color;
      
      // Разноцветный шар или градиент
      if (secondColor) {
        // Разноцветный шар - градиент между двумя цветами
        const gradient = ctx.createRadialGradient(
          centerX - radius * 0.3, centerY - radius * 0.3, 0,
          centerX, centerY, radius
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, secondColor);
        gradient.addColorStop(1, color);
        baseFillStyle = gradient;
      } else if (effects.gradient) {
        const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.15, centerX, centerY, radius);
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const lightR = Math.min(255, r + 140);
        const lightG = Math.min(255, g + 140);
        const lightB = Math.min(255, b + 140);
        const midR = Math.min(255, r + 50);
        const midG = Math.min(255, g + 50);
        const midB = Math.min(255, b + 50);
        const darkR = Math.max(0, r - 120);
        const darkG = Math.max(0, g - 120);
        const darkB = Math.max(0, b - 120);
        gradient.addColorStop(0, `rgb(${lightR}, ${lightG}, ${lightB})`);
        gradient.addColorStop(0.25, `rgb(${midR}, ${midG}, ${midB})`);
        gradient.addColorStop(0.6, color);
        gradient.addColorStop(1, `rgb(${darkR}, ${darkG}, ${darkB})`);
        baseFillStyle = gradient;
      }

      // Рисуем базовый шар
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = baseFillStyle;
      ctx.fill();

      // Тип поверхности - РЕАЛЬНЫЕ визуальные различия
      if (surfaceType === 'metal') {
        // Металл - добавляем блики и отражения
        const metalGradient = ctx.createLinearGradient(
          centerX - radius * 0.6, centerY - radius * 0.8,
          centerX + radius * 0.6, centerY + radius * 0.8
        );
        metalGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        metalGradient.addColorStop(0.3, 'rgba(200, 200, 200, 0.3)');
        metalGradient.addColorStop(0.5, 'rgba(100, 100, 100, 0.1)');
        metalGradient.addColorStop(0.7, 'rgba(200, 200, 200, 0.3)');
        metalGradient.addColorStop(1, 'rgba(255, 255, 255, 0.5)');
        ctx.fillStyle = metalGradient;
        ctx.fill();
        
        // Яркий блик сверху
        const highlightGradient = ctx.createRadialGradient(
          centerX - radius * 0.3, centerY - radius * 0.5, 0,
          centerX - radius * 0.3, centerY - radius * 0.5, radius * 0.6
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlightGradient;
        ctx.fill();
        
        // Темная тень снизу для объема
        const shadowGradient = ctx.createRadialGradient(
          centerX, centerY + radius * 0.6, 0,
          centerX, centerY + radius * 0.6, radius * 0.5
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGradient;
        ctx.fill();
      } else if (surfaceType === 'matte') {
        // Мат - мягкая поверхность без бликов, с легкой текстурой
        const matteGradient = ctx.createRadialGradient(
          centerX, centerY, radius * 0.3,
          centerX, centerY, radius
        );
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        matteGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.95)`);
        matteGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.85)`);
        matteGradient.addColorStop(1, `rgba(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)}, 0.9)`);
        ctx.fillStyle = matteGradient;
        ctx.fill();
        
        // Легкая текстура для матовой поверхности
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 50; i++) {
          const x = centerX + (Math.random() - 0.5) * radius * 1.5;
          const y = centerY + (Math.random() - 0.5) * radius * 1.5;
          const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          if (dist < radius) {
            ctx.fillStyle = `rgba(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)}, 0.3)`;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1.0;
      } else if (surfaceType === 'glossy') {
        // Глянец - яркий блик и отражения
        const glossGradient = ctx.createLinearGradient(
          centerX - radius * 0.5, centerY - radius * 0.7,
          centerX + radius * 0.5, centerY + radius * 0.7
        );
        glossGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        glossGradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.4)');
        glossGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        glossGradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.2)');
        glossGradient.addColorStop(1, 'rgba(255, 255, 255, 0.5)');
        ctx.fillStyle = glossGradient;
        ctx.fill();
      }

      // Обводка в зависимости от типа поверхности
      ctx.strokeStyle = surfaceType === 'metal' ? 'rgba(150, 150, 150, 0.5)' : 
                       surfaceType === 'matte' ? 'rgba(80, 80, 80, 0.3)' : 
                       'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = surfaceType === 'metal' ? 2 : surfaceType === 'matte' ? 1 : 2.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // РЕАЛЬНОЕ свечение уровня Photoshop - БЕЗ смазывания, используя композицию
      if (effects.glow) {
        ctx.save();
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Используем композицию для точного контроля свечения
        ctx.globalCompositeOperation = 'screen'; // Режим наложения для реалистичного свечения
        
        // Создаем маску для свечения только вокруг края
        const glowCanvas = document.createElement('canvas');
        glowCanvas.width = width;
        glowCanvas.height = height;
        const glowCtx = glowCanvas.getContext('2d');
        if (glowCtx) {
          // Рисуем свечение на отдельном canvas
          const glowGradient = glowCtx.createRadialGradient(
            centerX, centerY, radius * 0.98,
            centerX, centerY, radius * 1.12
          );
          glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`);
          glowGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.7)`);
          glowGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.4)`);
          glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          
          glowCtx.fillStyle = glowGradient;
          glowCtx.beginPath();
          glowCtx.arc(centerX, centerY, radius * 1.12, 0, Math.PI * 2);
          glowCtx.fill();
          
          // Применяем свечение к основному canvas
          ctx.drawImage(glowCanvas, 0, 0);
        }
        
        ctx.globalCompositeOperation = 'source-over'; // Возвращаем обычный режим
        ctx.restore();
      }
      
      // Добавляем эффект блеска (sparkle), если включен (улучшенный, более яркий)
      if (effects.sparkle) {
        ctx.save();
        // Создаем множество блестящих частиц
        const sparkleCount = 25;
        for (let i = 0; i < sparkleCount; i++) {
          const angle = (i / sparkleCount) * Math.PI * 2 + Math.random() * 0.5;
          const distance = radius * (0.5 + Math.random() * 0.4);
          const sparkleX = centerX + Math.cos(angle) * distance;
          const sparkleY = centerY + Math.sin(angle) * distance;
          const size = 2 + Math.random() * 4;
          
          // Градиент для каждой частицы
          const sparkleGradient = ctx.createRadialGradient(
            sparkleX, sparkleY, 0,
            sparkleX, sparkleY, size
          );
          sparkleGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
          sparkleGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.9)');
          sparkleGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
          
          ctx.fillStyle = sparkleGradient;
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, size, 0, Math.PI * 2);
          ctx.fill();
          
          // Добавляем яркое ядро
          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, size * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      
      // НАСТОЯЩИЕ звезды (не снежинки!) - классические 5-конечные звезды
      if (effects.stars) {
        ctx.save();
        const starCount = 15;
        for (let i = 0; i < starCount; i++) {
          const angle = (i / starCount) * Math.PI * 2 + Math.random() * 0.3;
          const distance = radius * (0.6 + Math.random() * 0.35);
          const starX = centerX + Math.cos(angle) * distance;
          const starY = centerY + Math.sin(angle) * distance;
          const distFromCenter = Math.sqrt((starX - centerX) ** 2 + (starY - centerY) ** 2);
          
          // Проверяем, что звезда внутри шара
          if (distFromCenter < radius * 0.95) {
            const starSize = 6 + Math.random() * 4;
            const outerRadius = starSize;
            const innerRadius = starSize * 0.4;
            
            ctx.translate(starX, starY);
            ctx.rotate(angle + Math.PI / 2);
            
            // Рисуем классическую 5-конечную звезду
            ctx.beginPath();
            for (let j = 0; j < 10; j++) {
              const currentAngle = (j * Math.PI) / 5;
              const currentRadius = j % 2 === 0 ? outerRadius : innerRadius;
              const x = Math.cos(currentAngle) * currentRadius;
              const y = Math.sin(currentAngle) * currentRadius;
              if (j === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            // Градиент для звезды
            const starGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius);
            starGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            starGradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.9)');
            starGradient.addColorStop(1, 'rgba(255, 255, 150, 0.7)');
            ctx.fillStyle = starGradient;
            ctx.fill();
            
            // Яркое ядро
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.beginPath();
            ctx.arc(0, 0, starSize * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.setTransform(1, 0, 0, 1, 0, 0);
          }
        }
        ctx.restore();
      }
    } else if (shape === 'star') {
      ctx.beginPath();
      const spikes = 5;
      const outerRadius = radius;
      const innerRadius = radius * 0.5;
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i * Math.PI) / spikes;
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (shape === 'heart') {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + radius * 0.3);
      ctx.bezierCurveTo(
        centerX,
        centerY,
        centerX - radius * 0.6,
        centerY - radius * 0.3,
        centerX - radius * 0.6,
        centerY
      );
      ctx.bezierCurveTo(
        centerX - radius * 0.6,
        centerY + radius * 0.3,
        centerX,
        centerY + radius * 0.6,
        centerX,
        centerY + radius * 0.9
      );
      ctx.bezierCurveTo(
        centerX,
        centerY + radius * 0.6,
        centerX + radius * 0.6,
        centerY + radius * 0.3,
        centerX + radius * 0.6,
        centerY
      );
      ctx.bezierCurveTo(
        centerX + radius * 0.6,
        centerY - radius * 0.3,
        centerX,
        centerY,
        centerX,
        centerY + radius * 0.3
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    
    ctx.restore();
  }, [shape, color, ballSize, surfaceType, effects, secondColor]);

  // Создаем clip path для формы
  const createShapeClip = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.4;
    const radius = baseRadius * ballSize; // Применяем размер шара

    ctx.beginPath();
    if (shape === 'ball') {
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    } else if (shape === 'star') {
      const spikes = 5;
      const outerRadius = radius;
      const innerRadius = radius * 0.5;
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i * Math.PI) / spikes;
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    } else if (shape === 'heart') {
      ctx.moveTo(centerX, centerY + radius * 0.3);
      ctx.bezierCurveTo(
        centerX,
        centerY,
        centerX - radius * 0.6,
        centerY - radius * 0.3,
        centerX - radius * 0.6,
        centerY
      );
      ctx.bezierCurveTo(
        centerX - radius * 0.6,
        centerY + radius * 0.3,
        centerX,
        centerY + radius * 0.6,
        centerX,
        centerY + radius * 0.9
      );
      ctx.bezierCurveTo(
        centerX,
        centerY + radius * 0.6,
        centerX + radius * 0.6,
        centerY + radius * 0.3,
        centerX + radius * 0.6,
        centerY
      );
      ctx.bezierCurveTo(
        centerX + radius * 0.6,
        centerY - radius * 0.3,
        centerX,
        centerY,
        centerX,
        centerY + radius * 0.3
      );
      ctx.closePath();
    }
  }, [shape, ballSize]);

  // Рисуем узоры (только внутри формы)
  const drawPattern = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!pattern) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.4;
    const radius = baseRadius * ballSize; // Применяем размер шара

    // Сохраняем состояние и применяем clip
    ctx.save();
    createShapeClip(ctx, width, height);
    ctx.clip();

    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 2;

    if (pattern === 'stripes') {
      for (let i = -2; i <= 2; i++) {
        const y = centerY + i * (radius * 0.3);
        ctx.beginPath();
        ctx.moveTo(centerX - radius, y);
        ctx.lineTo(centerX + radius, y);
        ctx.stroke();
      }
    } else if (pattern === 'dots') {
      const dotSize = 8;
      const positions = [
        { x: centerX - radius * 0.4, y: centerY - radius * 0.4 },
        { x: centerX + radius * 0.4, y: centerY - radius * 0.4 },
        { x: centerX, y: centerY },
        { x: centerX - radius * 0.4, y: centerY + radius * 0.4 },
        { x: centerX + radius * 0.4, y: centerY + radius * 0.4 },
      ];
      positions.forEach((pos) => {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (pattern === 'snowflakes') {
      const snowflakeSize = 12;
      const positions = [
        { x: centerX - radius * 0.3, y: centerY - radius * 0.3 },
        { x: centerX + radius * 0.3, y: centerY - radius * 0.3 },
        { x: centerX, y: centerY },
        { x: centerX - radius * 0.3, y: centerY + radius * 0.3 },
        { x: centerX + radius * 0.3, y: centerY + radius * 0.3 },
      ];
      positions.forEach((pos) => {
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(pos.x + Math.cos(angle) * snowflakeSize, pos.y + Math.sin(angle) * snowflakeSize);
          ctx.stroke();
        }
      });
    } else if (pattern === 'stars') {
      const starSize = 10;
      const positions = [
        { x: centerX - radius * 0.3, y: centerY - radius * 0.3 },
        { x: centerX + radius * 0.3, y: centerY - radius * 0.3 },
        { x: centerX, y: centerY },
        { x: centerX - radius * 0.3, y: centerY + radius * 0.3 },
        { x: centerX + radius * 0.3, y: centerY + radius * 0.3 },
      ];
      positions.forEach((pos) => {
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = starSize;
        const innerRadius = starSize * 0.5;
        for (let i = 0; i < spikes * 2; i++) {
          const angle = (i * Math.PI) / spikes;
          const r = i % 2 === 0 ? outerRadius : innerRadius;
          const px = pos.x + Math.cos(angle) * r;
          const py = pos.y + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      });
    }

    // Восстанавливаем состояние (убираем clip)
    ctx.restore();
  }, [pattern, createShapeClip, ballSize]);

  // Инициализируем canvas для пользовательского рисунка и базового изображения
  const CANVAS_SIZE = 350; // Увеличена высота окна редактора
  useEffect(() => {
    if (!userDrawingLayerRef.current) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = CANVAS_SIZE;
      tempCanvas.height = CANVAS_SIZE;
      userDrawingLayerRef.current = tempCanvas;
    }
    if (!baseCanvasRef.current) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = CANVAS_SIZE;
      tempCanvas.height = CANVAS_SIZE;
      baseCanvasRef.current = tempCanvas;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // CANVAS_SIZE - константа, не нужно в зависимостях

  // Перерисовка canvas (только базовая часть, без рисунка)
  const redrawBase = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Пользовательский рисунок уже сохранен в userDrawingLayerRef

    // Очищаем canvas
    ctx.clearRect(0, 0, width, height);

    // Рисуем базовую форму
    drawBaseShape(ctx, width, height);

    // Рисуем узоры поверх базовой формы
    drawPattern(ctx, width, height);

    // Применяем фильтры после полной отрисовки
    if (filters && (filters.blur || filters.contrast !== 100 || filters.saturation !== 100 || filters.vignette || filters.grain)) {
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.4;
      const radius = baseRadius * ballSize;
      
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Контраст
      if (filters.contrast !== undefined && filters.contrast !== 100) {
        const factor = (259 * (filters.contrast + 255)) / (255 * (259 - filters.contrast));
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
          data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
          data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
        }
      }
      
      // Насыщенность
      if (filters.saturation !== undefined && filters.saturation !== 100) {
        const factor = filters.saturation / 100;
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = Math.max(0, Math.min(255, gray + factor * (data[i] - gray)));
          data[i + 1] = Math.max(0, Math.min(255, gray + factor * (data[i + 1] - gray)));
          data[i + 2] = Math.max(0, Math.min(255, gray + factor * (data[i + 2] - gray)));
        }
      }
      
      // Зернистость
      if (filters.grain !== undefined && filters.grain > 0) {
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * filters.grain;
          data[i] = Math.max(0, Math.min(255, data[i] + noise));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Виньетка
      if (filters.vignette !== undefined && filters.vignette > 0) {
        const vignetteGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius * 1.5);
        vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignetteGradient.addColorStop(1, `rgba(0, 0, 0, ${filters.vignette / 100})`);
        ctx.fillStyle = vignetteGradient;
        ctx.fillRect(0, 0, width, height);
      }
      
      // Размытие (применяется через фильтр CSS, так как canvas blur медленный)
      if (filters.blur !== undefined && filters.blur > 0) {
        ctx.filter = `blur(${filters.blur}px)`;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0);
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(tempCanvas, 0, 0);
          ctx.filter = 'none';
        }
      }
    }

    // Сохраняем базовое изображение в baseCanvasRef
    const baseCanvas = baseCanvasRef.current;
    if (baseCanvas) {
      const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: false });
      if (baseCtx) {
        baseCtx.imageSmoothingEnabled = true;
        baseCtx.imageSmoothingQuality = 'high';
        baseCtx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
        baseCtx.drawImage(canvas, 0, 0, baseCanvas.width, baseCanvas.height);
      }
    }

    // Восстанавливаем пользовательский рисунок поверх базового
    if (userDrawingLayerRef.current) {
      ctx.drawImage(userDrawingLayerRef.current, 0, 0);
    }

    // Уведомляем об изменении
    const newDataUrl = canvas.toDataURL('image/png');
    if (newDataUrl !== lastDataUrlRef.current) {
      lastDataUrlRef.current = newDataUrl;
      onImageChange(newDataUrl);
    }
  }, [shape, color, pattern, ballSize, surfaceType, effects, filters, secondColor, drawBaseShape, drawPattern, onImageChange]);

  // Эффект для перерисовки при изменении параметров
  useEffect(() => {
    redrawBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, color, pattern, ballSize, surfaceType, effects, filters, secondColor]);

  // Обработчики рисования
  const startDrawing = (x: number, y: number) => {
    // Сохраняем состояние ПЕРЕД началом рисования (если еще не рисуем)
    if (!isDrawing) {
      saveToHistory();
    }
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const userCanvas = userDrawingLayerRef.current;
    if (!canvas || !userCanvas) return;

    const ctx = canvas.getContext('2d');
    const userCtx = userCanvas.getContext('2d');
    if (!ctx || !userCtx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    userCtx.beginPath();
    userCtx.moveTo(x, y);
  };

  const startDrawingMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCanvasCoordinates(e);
    startDrawing(x, y);
  };

  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCanvasCoordinatesTouch(e);
    startDrawing(x, y);
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const userCanvas = userDrawingLayerRef.current;
    if (!canvas || !userCanvas) return;

    const ctx = canvas.getContext('2d');
    const userCtx = userCanvas.getContext('2d');
    if (!ctx || !userCtx) return;

    // Настраиваем режим рисования (обычное или стирание)
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      userCtx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      userCtx.globalCompositeOperation = 'source-over';
    }

    // Рисуем на основном canvas
    ctx.lineTo(x, y);
    if (!isEraser) {
      ctx.strokeStyle = brushColor;
    }
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Рисуем на canvas для пользовательского рисунка
    userCtx.lineTo(x, y);
    if (!isEraser) {
      userCtx.strokeStyle = brushColor;
    }
    userCtx.lineWidth = brushSize;
    userCtx.lineCap = 'round';
    userCtx.lineJoin = 'round';
    userCtx.stroke();
    userCtx.beginPath();
    userCtx.moveTo(x, y);
  };

  const drawMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCanvasCoordinates(e);
    draw(x, y);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCanvasCoordinatesTouch(e);
    draw(x, y);
  };

  // Сохранение состояния в историю
  const saveToHistory = useCallback(() => {
    const userCanvas = userDrawingLayerRef.current;
    if (!userCanvas) return;

    const state = userCanvas.toDataURL('image/png');
    const currentIndex = historyIndexRef.current;
    
    // Удаляем все состояния после текущего (если есть)
    if (currentIndex < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, currentIndex + 1);
    }
    
    // Добавляем новое состояние
    historyRef.current.push(state);
    
    // Ограничиваем историю (храним максимум 20 состояний)
    if (historyRef.current.length > 20) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current = historyRef.current.length - 1;
    }
    
    // Обновляем состояние кнопок
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false); // После сохранения нового состояния redo недоступен
  }, []);

  // Восстановление состояния из истории
  const restoreFromHistory = useCallback((index: number) => {
    const userCanvas = userDrawingLayerRef.current;
    const canvas = canvasRef.current;
    if (!userCanvas || !canvas || index < 0 || index >= historyRef.current.length) return;

    const state = historyRef.current[index];
    const img = new Image();
    img.onload = () => {
      const userCtx = userCanvas.getContext('2d');
      const ctx = canvas.getContext('2d');
      if (!userCtx || !ctx) return;

      // Очищаем canvas пользовательского рисунка
      userCtx.clearRect(0, 0, userCanvas.width, userCanvas.height);
      
      // Восстанавливаем состояние
      userCtx.drawImage(img, 0, 0);
      
      // Перерисовываем основной canvas
      redrawBase();
      
      // Наносим пользовательский рисунок поверх
      ctx.drawImage(userCanvas, 0, 0);
      
      // Уведомляем об изменении
      const newDataUrl = canvas.toDataURL('image/png');
      lastDataUrlRef.current = newDataUrl;
      onImageChange(newDataUrl);
    };
    img.src = state;
    historyIndexRef.current = index;
    
    // Обновляем состояние кнопок
    setCanUndo(index > 0);
    setCanRedo(index < historyRef.current.length - 1);
  }, [redrawBase, onImageChange]);

  // Шаг назад
  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      restoreFromHistory(historyIndexRef.current - 1);
    }
  }, [restoreFromHistory]);

  // Шаг вперед
  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      restoreFromHistory(historyIndexRef.current + 1);
    }
  }, [restoreFromHistory]);

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Сохраняем состояние в историю
    saveToHistory();

    // Уведомляем об изменении только после окончания рисования
    const canvas = canvasRef.current;
    if (canvas) {
      const newDataUrl = canvas.toDataURL('image/png');
      if (newDataUrl !== lastDataUrlRef.current) {
        lastDataUrlRef.current = newDataUrl;
        onImageChange(newDataUrl);
      }
    }
  };

  // Обработчики drag-and-drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // Drag-and-drop больше не используется для фона
  };

  return (
    <div className="relative">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 rounded-lg overflow-hidden ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onMouseDown={startDrawingMouse}
          onMouseMove={drawMouse}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawingTouch}
          onTouchMove={drawTouch}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
          className="w-full h-auto bg-gradient-to-br from-blue-50 to-purple-50 block touch-none"
          style={{ 
            touchAction: 'none', 
            margin: '0 auto',
            cursor: 'crosshair',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            // На мобильных добавляем небольшое сужение для безопасной прокрутки
            width: 'calc(100% - 8px)',
            maxWidth: 'min(calc(100vw - 40px), 350px)' // Оставляем место по бокам для прокрутки, но не больше CANVAS_SIZE
          }}
          title="Рисуйте пальцем или мышью"
        />
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 pointer-events-none">
            <p className="text-blue-600 font-semibold text-lg">Отпустите файл здесь</p>
          </div>
        )}
      </div>
      
      {/* Панель инструментов - компактная, чтобы не перекрывались */}
      <div 
        data-canvas-tools="true"
        className="mt-2 p-1.5 sm:p-2 bg-gradient-to-r from-slate-800/80 via-indigo-800/80 to-purple-800/80 backdrop-blur-md rounded-xl border-2 border-white/20 shadow-lg"
        onClick={(e) => { 
          // Разрешаем клики на input элементы (например, color picker)
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.closest('input') || target.tagName === 'LABEL') {
            return; // Не блокируем клики на input и label
          }
          e.stopPropagation();
        }}
        onMouseDown={(e) => { 
          // Разрешаем клики на input элементы
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.closest('input') || target.tagName === 'LABEL') {
            return; // Не блокируем клики на input и label
          }
          e.stopPropagation();
        }}
        onTouchStart={(e) => { 
          // Разрешаем клики на input элементы
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.closest('input') || target.tagName === 'LABEL') {
            return; // Не блокируем клики на input и label
          }
          e.stopPropagation();
        }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Цвет кисти - компактно */}
          <label 
            className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-1.5 sm:px-2 py-1 rounded-lg border border-white/20 shadow-sm"
            onClick={(e) => { e.stopPropagation(); }}
            onMouseDown={(e) => { e.stopPropagation(); }}
            onTouchStart={(e) => { e.stopPropagation(); }}
          >
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              onClick={(e) => { e.stopPropagation(); }}
              onMouseDown={(e) => { e.stopPropagation(); }}
              onTouchStart={(e) => { e.stopPropagation(); }}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded border border-white/30 cursor-pointer touch-manipulation"
              title={t('brushColor')}
            />
          </label>
          
          {/* Размер кисти - компактно */}
          <label className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-1.5 sm:px-2 py-1 rounded-lg border border-white/20 shadow-sm">
            <span className="text-[9px] sm:text-[10px] font-semibold text-white/90 whitespace-nowrap hidden sm:inline">{t('brushSize')}:</span>
            <input
              type="range"
              min="1"
              max="30"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-12 sm:w-16 accent-blue-400"
              title={`${brushSize}px`}
            />
            <span className="text-[9px] sm:text-[10px] font-bold text-white/90 w-5 sm:w-6">{brushSize}</span>
          </label>
          
          {/* Кнопки инструментов - компактные, в одну строку */}
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`px-1.5 sm:px-2 py-1 rounded-lg transition-all text-base sm:text-lg shadow-md active:shadow-lg transform active:scale-95 touch-manipulation ${
              isEraser
                ? 'bg-gradient-to-r from-orange-500/80 to-red-500/80 active:from-orange-600 active:to-red-600'
                : 'bg-white/10 hover:bg-white/20 border border-white/20'
            }`}
            title={isEraser ? t('brush') : t('eraser')}
          >
            {isEraser ? '✏️' : '🧹'}
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation(); // Дополнительная защита
              undo();
              return false; // Дополнительная защита
            }}
            disabled={!canUndo}
            data-undo-button="true"
            className="px-1.5 sm:px-2 py-1 bg-gradient-to-r from-blue-500/80 to-cyan-500/80 text-white rounded-lg active:from-blue-600 active:to-cyan-600 transition-all text-base sm:text-lg shadow-md active:shadow-lg transform active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('undo')}
          >
            ⬅️
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation(); // Дополнительная защита
              redo();
              return false; // Дополнительная защита
            }}
            disabled={!canRedo}
            data-redo-button="true"
            className="px-1.5 sm:px-2 py-1 bg-gradient-to-r from-green-500/80 to-emerald-500/80 text-white rounded-lg active:from-green-600 active:to-emerald-600 transition-all text-base sm:text-lg shadow-md active:shadow-lg transform active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('redo')}
          >
            ➡️
          </button>

          <button
            onClick={() => {
              const canvas = canvasRef.current;
              const userCanvas = userDrawingLayerRef.current;
              if (canvas && userCanvas) {
                const userCtx = userCanvas.getContext('2d');
                if (userCtx) {
                  userCtx.clearRect(0, 0, userCanvas.width, userCanvas.height);
                }
                saveToHistory();
                redrawBase();
              }
            }}
            className="px-1.5 sm:px-2 py-1 bg-gradient-to-r from-red-500/80 to-pink-500/80 text-white rounded-lg active:from-red-600 active:to-pink-600 transition-all text-base sm:text-lg shadow-md active:shadow-lg transform active:scale-95 touch-manipulation"
            title={t('clear')}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
