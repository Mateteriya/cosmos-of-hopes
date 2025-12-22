'use client';

import { useState, useEffect, useRef } from 'react';

interface NewYearAnimationControllerProps {
  onNewYearStart?: () => void;
  onPreNewYearWarning?: () => void;
  onTreeBlink?: () => void;
}

/**
 * Контроллер новогодней анимации
 * Отслеживает время и запускает события:
 * - 23:58 31 декабря - уведомление
 * - 23:59 - мигание ёлки
 * - 00:00 1 января - запуск анимации
 */
export function useNewYearAnimationController({
  onNewYearStart,
  onPreNewYearWarning,
  onTreeBlink,
}: NewYearAnimationControllerProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isNewYear, setIsNewYear] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [treeBlinking, setTreeBlinking] = useState(false);
  const warningShownRef = useRef(false);
  const blinkCountRef = useRef(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-11
      const date = now.getDate();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      // Проверяем, наступил ли Новый год (1 января 2026, 00:00)
      if (year >= 2026 && month === 0 && date === 1 && hours === 0 && minutes === 0 && seconds < 20) {
        if (!isNewYear) {
          setIsNewYear(true);
          onNewYearStart?.();
        }
      } else {
        setIsNewYear(false);
      }

      // Проверяем 23:58 31 декабря - показываем уведомление
      if (year === 2025 && month === 11 && date === 31 && hours === 23 && minutes === 58) {
        if (!warningShownRef.current) {
          warningShownRef.current = true;
          setShowWarning(true);
          onPreNewYearWarning?.();
          
          // Скрываем уведомление через 10 секунд
          setTimeout(() => {
            setShowWarning(false);
          }, 10000);
        }
      } else if (minutes !== 58) {
        warningShownRef.current = false;
      }

      // Мигание ёлки в 23:59 (пару раз)
      if (year === 2025 && month === 11 && date === 31 && hours === 23 && minutes === 59 && seconds < 10) {
        if (blinkCountRef.current < 2) {
          setTreeBlinking(true);
          blinkCountRef.current++;
          onTreeBlink?.();
          
          setTimeout(() => {
            setTreeBlinking(false);
          }, 500);
        }
      } else if (minutes !== 59) {
        blinkCountRef.current = 0;
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [isNewYear, onNewYearStart, onPreNewYearWarning, onTreeBlink]);

  return {
    currentTime,
    isNewYear,
    showWarning,
    treeBlinking,
  };
}

