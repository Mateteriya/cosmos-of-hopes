'use client';

/**
 * Компонент оценки приложения
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/constructor/LanguageProvider';
import { getOrCreateUserId } from '@/lib/userId';

export default function AppRating() {
  const { t } = useLanguage();
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Проверяем, оценил ли уже пользователь приложение
  useEffect(() => {
    const checkRating = async () => {
      try {
        const userId = await getOrCreateUserId();
        const response = await fetch(`/api/rate-app?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.hasRated) {
            setHasRated(true);
            setRating(data.rating);
          }
        }
      } catch (error) {
        console.error('Ошибка при проверке оценки:', error);
      } finally {
        setIsChecking(false);
      }
    };
    checkRating();
  }, []);

  const handleRatingClick = async (stars: number) => {
    if (hasRated || isChecking) return;
    
    setRating(stars);
    
    try {
      const userId = await getOrCreateUserId();
      const response = await fetch('/api/rate-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          rating: stars,
        }),
      });

      if (response.ok) {
        setHasRated(true);
      }
    } catch (error) {
      console.error('Ошибка при сохранении оценки:', error);
      setRating(null);
    }
  };

  // Не показываем, если проверяем или уже оценили
  if (isChecking) {
    return null;
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
      <h3 className="text-white font-bold text-base sm:text-lg mb-3 sm:mb-4">
        {t('rateApp')}
      </h3>
      {hasRated ? (
        <p className="text-green-400 font-semibold text-sm sm:text-base">
          {t('thankYouForRating')}
        </p>
      ) : (
        <div className="flex justify-center items-center gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRatingClick(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(null)}
              className="text-2xl sm:text-3xl transition-all transform hover:scale-125 active:scale-95 touch-manipulation"
              style={{
                filter: (rating && star <= rating) || (hoveredRating && star <= hoveredRating)
                  ? 'drop-shadow(0 0 8px #ffd700)'
                  : 'grayscale(0.5) opacity(0.5)',
              }}
            >
              ⭐
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

