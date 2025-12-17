'use client';

/**
 * Компонент для копирования ссылки приглашения
 */

import { useState } from 'react';

interface InviteLinkProps {
  inviteCode: string;
  roomId: string;
}

export default function InviteLink({ inviteCode, roomId }: InviteLinkProps) {
  const [copied, setCopied] = useState(false);

  // Формируем полную ссылку
  // ВАЖНО: Для работы ссылок нужно установить NEXT_PUBLIC_APP_URL в .env.local
  const getAppUrl = (): string => {
    if (typeof window === 'undefined') return '';
    
    // Приоритет 1: Переменная окружения (для production)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl && !appUrl.includes('localhost')) {
      return appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
    }
    
    // Приоритет 2: Проверяем, не localhost ли это
    const currentOrigin = window.location.origin;
    if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
      // В development показываем предупреждение
      console.warn('⚠️ Используется localhost! Для реальных ссылок установите NEXT_PUBLIC_APP_URL в .env.local');
      // Возвращаем localhost только для тестирования локально
      return currentOrigin;
    }
    
    // Приоритет 3: Используем текущий origin (если уже на production)
    return currentOrigin;
  };

  const inviteUrl = `${getAppUrl()}/rooms?invite=${inviteCode}`;
  
  // Предупреждение, если используется localhost
  const isLocalhost = inviteUrl.includes('localhost') || inviteUrl.includes('127.0.0.1');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Не удалось скопировать ссылку', e);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-md border-2 border-white/30 rounded-lg p-2 sm:p-3 lg:p-4">
      <div className="text-white font-bold text-xs sm:text-sm mb-2 sm:mb-3 flex items-center gap-2">
        <span>🔗 Пригласить друзей</span>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {/* Код приглашения */}
        <div>
          <div className="text-white/70 text-[10px] sm:text-xs mb-1">Код приглашения:</div>
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <div className="w-full bg-slate-700/50 text-white font-mono text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-white/20 break-all text-center overflow-hidden">
              {inviteCode}
            </div>
            <button
              onClick={handleCopy}
              className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? '✓ Скопировано!' : '📋 Копировать код'}
            </button>
          </div>
        </div>

        {/* Полная ссылка */}
        <div>
          <div className="text-white/70 text-[10px] sm:text-xs mb-1">Или отправьте ссылку:</div>
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="w-full bg-slate-700/50 text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-white/20 focus:outline-none break-all overflow-hidden"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={handleCopy}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all whitespace-nowrap"
              title="Скопировать ссылку"
            >
              📋 Копировать ссылку
            </button>
          </div>
        </div>

        {isLocalhost && (
          <div className="bg-yellow-600/30 border border-yellow-500/50 rounded-lg p-2 mt-2">
            <div className="text-yellow-200 text-[10px] sm:text-xs font-semibold mb-1">⚠️ Внимание!</div>
            <div className="text-yellow-200/80 text-[9px] sm:text-[10px]">
              Используется localhost. Для реальных ссылок добавьте в <code className="bg-black/30 px-1 rounded">.env.local</code>:
              <div className="mt-1 font-mono text-[9px] break-all">
                NEXT_PUBLIC_APP_URL=https://ваш-домен.com
              </div>
            </div>
          </div>
        )}
        
        <div className="text-white/50 text-[10px] sm:text-xs text-center pt-1.5 sm:pt-2 border-t border-white/20">
          Поделитесь кодом или ссылкой с друзьями, чтобы они присоединились к комнате
        </div>
      </div>
    </div>
  );
}
