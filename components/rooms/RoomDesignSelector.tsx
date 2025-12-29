'use client';

/**
 * Компонент выбора дизайна комнаты (dropdown селектор)
 */

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/components/constructor/LanguageProvider';
import type { DesignTheme } from '@/types/room';

interface RoomDesignSelectorProps {
  currentTheme?: DesignTheme;
  currentCustomUrl?: string | null;
  onThemeChange: (theme: DesignTheme, customUrl?: string) => void;
  isCreator: boolean;
}

// Темы дизайна будут переведены внутри компонента
const designThemes: Array<{
  value: DesignTheme;
  emoji: string;
  nameKey: string;
  descKey: string;
}> = [
  { value: 'classic', emoji: '🎄', nameKey: 'designClassic', descKey: 'designClassicDesc' },
  { value: 'cosmic', emoji: '🌌', nameKey: 'designCosmic', descKey: 'designCosmicDesc' },
  { value: 'minimal', emoji: '✨', nameKey: 'designMinimal', descKey: 'designMinimalDesc' },
  { value: 'urban', emoji: '🏙️', nameKey: 'designUrban', descKey: 'designUrbanDesc' },
  { value: 'custom', emoji: '🎨', nameKey: 'designCustom', descKey: 'designCustomDesc' },
];

export default function RoomDesignSelector({
  currentTheme = 'classic',
  currentCustomUrl,
  onThemeChange,
  isCreator,
}: RoomDesignSelectorProps) {
  const { t } = useLanguage();
  const [selectedTheme, setSelectedTheme] = useState<DesignTheme>(currentTheme);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(currentCustomUrl || null);
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Синхронизируем selectedTheme с currentTheme при изменении пропсов
  useEffect(() => {
    setSelectedTheme(currentTheme);
  }, [currentTheme]);

  // Синхронизируем customImageUrl с currentCustomUrl
  useEffect(() => {
    setCustomImageUrl(currentCustomUrl || null);
  }, [currentCustomUrl]);

  // Всегда открываем меню вверх
  useEffect(() => {
    if (isOpen) {
      setOpenUpward(true);
    }
  }, [isOpen]);

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!isCreator) {
    // Показываем только текущий дизайн для не-создателей
    const theme = designThemes.find(t => t.value === currentTheme);
    return (
      <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg p-2 sm:p-3 lg:p-4">
        <div className="text-white font-bold text-xs sm:text-sm mb-1 sm:mb-2">🎨 {t('roomDesign')}</div>
        <div className="text-white/80 text-xs sm:text-sm">
          {theme?.emoji} {theme ? t(theme.nameKey as any) : ''}
        </div>
      </div>
    );
  }

  const handleThemeSelect = (theme: DesignTheme) => {
    setSelectedTheme(theme);
    setIsOpen(false);
    if (theme !== 'custom') {
      onThemeChange(theme);
    }
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomImageUrl(url);
      onThemeChange('custom', url);
    }
  };

  const currentThemeData = designThemes.find(t => t.value === selectedTheme);

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg p-2 sm:p-3 lg:p-4 relative z-20" ref={dropdownRef}>
      <div className="text-white font-bold text-xs sm:text-sm mb-2">🎨 {t('selectRoomDesign')}</div>
      
      {/* Кнопка селектора */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-700/50 hover:bg-slate-700/70 border-2 border-white/20 rounded-lg p-2 sm:p-3 flex items-center justify-between transition-all"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
          <span className="text-lg sm:text-xl">{currentThemeData?.emoji}</span>
          <span className="text-white font-semibold text-xs sm:text-sm truncate">{currentThemeData?.name}</span>
        </div>
        <span className="text-white/70 text-xs sm:text-sm flex-shrink-0 ml-2">{isOpen ? (openUpward ? '▼' : '▲') : '▼'}</span>
      </button>

      {/* Dropdown меню */}
      {isOpen && (
        <div 
          ref={menuRef}
          className={`absolute z-[100] w-full bg-slate-800/95 backdrop-blur-md border-2 border-white/20 rounded-lg shadow-lg overflow-hidden ${
            openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <div className="max-h-60 overflow-y-auto">
            {designThemes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => handleThemeSelect(theme.value)}
                className={`w-full p-2 sm:p-3 flex items-start gap-2 transition-all text-left ${
                  selectedTheme === theme.value ? 'bg-blue-500/20' : ''
                } hover:bg-blue-600/60 hover:border-l-4 hover:border-blue-400`}
              >
                <span className="text-lg sm:text-xl flex-shrink-0">{theme.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-semibold text-xs sm:text-sm">{t(theme.nameKey as any)}</div>
                  <div className="text-white/60 text-[10px] sm:text-xs mt-0.5">{t(theme.descKey as any)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Загрузка кастомного изображения */}
      {selectedTheme === 'custom' && (
        <div className="mt-2 sm:mt-3">
          <label className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded text-[10px] sm:text-xs text-center cursor-pointer transition-all">
            {t('uploadBackgroundImage')}
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={handleCustomImageUpload}
            />
          </label>
          {customImageUrl && (
            <div className="mt-2 rounded-lg overflow-hidden border-2 border-white/20">
              <img src={customImageUrl} alt="Custom background" className="w-full h-20 sm:h-24 lg:h-32 object-cover" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
