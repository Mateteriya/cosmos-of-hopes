'use client';

/**
 * Компонент выбора программы мероприятия (dropdown селектор)
 */

import { useState, useEffect, useRef } from 'react';
import type { EventProgram } from '@/types/room';

interface EventProgramSelectorProps {
  currentProgram?: EventProgram;
  onProgramChange: (program: EventProgram) => void;
  isCreator: boolean;
}

const eventPrograms: Array<{
  value: EventProgram;
  name: string;
  emoji: string;
  description: string;
  complexity: 'easy' | 'medium' | 'hard';
}> = [
  {
    value: 'chat',
    name: 'Простой чат',
    emoji: '💬',
    description: 'Общение в текстовом чате',
    complexity: 'easy',
  },
  {
    value: 'video_watch',
    name: 'Совместный просмотр',
    emoji: '🎬',
    description: 'Смотрим видео вместе',
    complexity: 'easy',
  },
  {
    value: 'quiz',
    name: 'Викторина',
    emoji: '🎯',
    description: 'Вопросы о Новом годе',
    complexity: 'medium',
  },
  {
    value: 'music_guess',
    name: 'Угадай песню',
    emoji: '🎵',
    description: 'Угадываем новогодние песни',
    complexity: 'medium',
  },
  {
    value: 'truth_or_dare',
    name: 'Правда или действие',
    emoji: '🎲',
    description: 'Классическая игра',
    complexity: 'medium',
  },
];

export default function EventProgramSelector({
  currentProgram = 'chat',
  onProgramChange,
  isCreator,
}: EventProgramSelectorProps) {
  const [selectedProgram, setSelectedProgram] = useState<EventProgram>(currentProgram);
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Синхронизируем selectedProgram с currentProgram при изменении пропсов
  useEffect(() => {
    setSelectedProgram(currentProgram);
  }, [currentProgram]);

  // Определяем, открывать ли меню вверх или вниз
  useEffect(() => {
    if (isOpen && buttonRef.current && menuRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const menuHeight = 240; // Примерная высота меню (max-h-60 = 240px)
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      
      // Открываем вверх, если снизу места меньше, чем сверху
      setOpenUpward(spaceBelow < menuHeight && spaceAbove > spaceBelow);
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
    // Показываем только текущую программу для не-создателей
    const program = eventPrograms.find(p => p.value === currentProgram);
    return (
      <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg p-2 sm:p-3 lg:p-4">
        <div className="text-white font-bold text-xs sm:text-sm mb-1 sm:mb-2">🎮 Программа мероприятия</div>
        <div className="text-white/80 text-xs sm:text-sm">
          {program?.emoji} {program?.name}
        </div>
      </div>
    );
  }

  const handleProgramSelect = (program: EventProgram) => {
    setSelectedProgram(program);
    setIsOpen(false);
    onProgramChange(program);
  };

  const currentProgramData = eventPrograms.find(p => p.value === selectedProgram);
  const complexityColors = {
    easy: 'bg-green-500/20 border-green-500/50',
    medium: 'bg-yellow-500/20 border-yellow-500/50',
    hard: 'bg-red-500/20 border-red-500/50',
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-lg p-2 sm:p-3 lg:p-4 relative z-20" ref={dropdownRef}>
      <div className="text-white font-bold text-xs sm:text-sm mb-2">🎮 Выбор программы мероприятия</div>
      
      {/* Кнопка селектора */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-700/50 hover:bg-slate-700/70 border-2 border-white/20 rounded-lg p-2 sm:p-3 flex items-center justify-between transition-all"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
          <span className="text-lg sm:text-xl">{currentProgramData?.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="text-white font-semibold text-xs sm:text-sm truncate">{currentProgramData?.name}</div>
            <div className="text-white/60 text-[10px] sm:text-xs truncate">{currentProgramData?.description}</div>
          </div>
          <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold whitespace-nowrap flex-shrink-0 ml-2 ${
            complexityColors[currentProgramData?.complexity || 'easy']
          } text-white/80`}>
            {currentProgramData?.complexity === 'easy' ? 'Просто' : currentProgramData?.complexity === 'medium' ? 'Средне' : 'Сложно'}
          </span>
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
            {eventPrograms.map((program) => (
              <button
                key={program.value}
                onClick={() => handleProgramSelect(program.value)}
                className={`w-full p-2 sm:p-3 flex items-center justify-between gap-2 transition-all text-left ${
                  selectedProgram === program.value ? 'bg-blue-500/20' : ''
                } hover:bg-blue-600/60 hover:border-l-4 hover:border-blue-400`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-lg sm:text-xl flex-shrink-0">{program.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-semibold text-xs sm:text-sm">{program.name}</div>
                    <div className="text-white/60 text-[10px] sm:text-xs mt-0.5">{program.description}</div>
                  </div>
                </div>
                <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold whitespace-nowrap flex-shrink-0 ${
                  complexityColors[program.complexity]
                } text-white/80`}>
                  {program.complexity === 'easy' ? 'Просто' : program.complexity === 'medium' ? 'Средне' : 'Сложно'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
