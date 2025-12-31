'use client';

/**
 * Компонент "О программе" - аккордеон с вкладками
 */

import { useState } from 'react';
import { useLanguage } from '@/components/constructor/LanguageProvider';
import type { ReactElement } from 'react';

type TabType = 'concept' | 'mission' | 'technical' | 'contacts';

export default function AboutProgram() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('concept');

  const tabs: Array<{ id: TabType; label: string; icon: ReactElement }> = [
    { 
      id: 'concept', 
      label: t('aboutConcept'), 
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    },
    { 
      id: 'mission', 
      label: t('aboutMission'), 
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'technical', 
      label: t('aboutTechnical'), 
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      id: 'contacts', 
      label: t('aboutContacts'), 
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
  ];

  const getTabContent = () => {
    switch (activeTab) {
      case 'concept':
        return t('aboutConceptText');
      case 'mission':
        return t('aboutMissionText');
      case 'technical':
        return t('aboutTechnicalText');
      case 'contacts':
        return t('aboutContactsText');
      default:
        return '';
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/80 via-purple-900/30 to-slate-800/80 backdrop-blur-md border-2 border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-6 text-center bg-gradient-to-r from-purple-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
        {t('aboutProgram')}
      </h2>

      {/* Вкладки */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6 justify-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all transform touch-manipulation flex items-center gap-1.5 sm:gap-2 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                : 'bg-slate-700/50 text-white/70 hover:bg-slate-700/70 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Содержимое активной вкладки */}
      <div className="bg-slate-900/50 rounded-lg p-4 sm:p-6 border border-white/10">
        <div className="text-white/90 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
          {getTabContent()}
        </div>
      </div>
    </div>
  );
}

