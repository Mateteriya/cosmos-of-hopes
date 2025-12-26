'use client';

/**
 * Модальное окно для случая, когда у пользователя уже есть шар на ёлке
 */

import { useLanguage } from './LanguageProvider';

interface ExistingBallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewBall: () => void;
  onEditBall: () => void;
  hasLikes: boolean; // Есть ли лайки у шара
  likesCount: number; // Количество лайков
}

export default function ExistingBallModal({
  isOpen,
  onClose,
  onViewBall,
  onEditBall,
  hasLikes,
  likesCount,
}: ExistingBallModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-purple-500/50 shadow-2xl max-w-md w-full p-4 sm:p-6">
        <div className="text-center mb-4 sm:mb-6">
          <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🎄</div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            {t('youAlreadyHaveBall')}
          </h2>
          {hasLikes && (
            <p className="text-purple-300 text-sm">
              {t('ballHasLikes').replace('{count}', likesCount.toString())}
            </p>
          )}
          {!hasLikes && (
            <p className="text-slate-300 text-sm">
              {t('ballCanBeEdited')}
            </p>
          )}
        </div>

        <div className="space-y-2 sm:space-y-3">
          {!hasLikes && (
            <button
              onClick={onEditBall}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
            >
              {t('editYourBall')}
            </button>
          )}
          {hasLikes && (
            <div className="w-full bg-purple-900/50 border border-purple-500/50 text-purple-200 text-center py-3 px-6 rounded-lg text-sm">
              {t('cannotEditWithLikes')}
            </div>
          )}

          <button
            onClick={onViewBall}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
          >
            {t('viewYourBall')}
          </button>

          <button
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all text-sm sm:text-base"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

