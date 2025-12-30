'use client';

/**
 * Страница, показываемая когда шар пользователя уже на ёлке и имеет лайки
 */

import { useRouter } from 'next/navigation';
import { useLanguage } from './LanguageProvider';
import type { Toy } from '@/types/toy';
import Ball3DPreview from './Ball3DPreview';

interface BallAlreadyOnTreePageProps {
  ball: Toy;
  likesCount: number;
  roomId?: string | null;
}

export default function BallAlreadyOnTreePage({
  ball,
  likesCount,
  roomId,
}: BallAlreadyOnTreePageProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const handleGoToTree = () => {
    if (roomId) {
      router.push(`/tree?room=${roomId}`);
    } else {
      router.push('/tree');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full pt-8 sm:pt-12">
        {/* Заголовок */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            {t('yourBallOnTree')}
          </h1>
          <p className="text-white/80 text-base sm:text-lg mb-2">
            {t('ballHasLikes')}
          </p>
        </div>

        {/* 3D визуализация шара */}
        <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="aspect-square max-w-md mx-auto h-[300px] sm:h-[400px]">
            <Ball3DPreview
              color={ball.color}
              pattern={ball.pattern || null}
              imageDataUrl={ball.image_url || null}
              ballSize={ball.ball_size || 1.0}
              surfaceType={ball.surface_type || 'glossy'}
              effects={{
                sparkle: ball.effects?.sparkle || false,
                gradient: ball.effects?.gradient || false,
                glow: ball.effects?.glow || false,
                stars: ball.effects?.stars || false,
              }}
            />
          </div>
        </div>

        {/* Информация о лайках */}
        <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur-md border-2 border-purple-400/50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 text-center">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">❤️</div>
          <div className="text-white font-bold text-xl sm:text-2xl mb-2">
            {likesCount} {t('supports')}
          </div>
          <p className="text-white/70 text-sm sm:text-base">
            {t('ballHasLikes')}
          </p>
        </div>

        {/* Кнопка перехода к ёлке */}
        <div className="text-center">
          <button
            onClick={handleGoToTree}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-lg shadow-xl transition-all transform hover:scale-105 text-base sm:text-lg"
          >
            {t('viewYourBall')}
          </button>
        </div>
      </div>
    </div>
  );
}

