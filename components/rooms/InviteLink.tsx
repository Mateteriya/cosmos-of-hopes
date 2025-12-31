'use client';

/**
 * Компонент для копирования ссылки приглашения
 */

import { useState } from 'react';
import { useLanguage } from '@/components/constructor/LanguageProvider';

interface InviteLinkProps {
  inviteCode: string;
  roomId: string;
  roomName?: string;
}

export default function InviteLink({ inviteCode, roomId, roomName }: InviteLinkProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const inviteUrl = `${getAppUrl()}/room?room=${roomId}`;
  
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

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = inviteCode;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Не удалось скопировать код', e);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (e) {
        console.error('Не удалось скопировать ссылку', e);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-md border-2 border-white/30 rounded-lg p-1.5 sm:p-2 w-1/2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-white font-bold text-[10px] sm:text-xs">
          {t('inviteFriends')}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white/70 hover:text-white transition-colors p-1"
          title={isExpanded ? 'Свернуть' : 'Развернуть'}
        >
          <svg 
            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded ? (
        <div className="space-y-2">
          {/* Ссылка на комнату */}
          <div>
            <div className="text-white/70 text-[9px] sm:text-[10px] mb-1">{t('orSendLink')}</div>
            <div className="flex flex-row gap-1">
              <input
                type="text"
                value={inviteUrl}
                readOnly
                className="flex-1 bg-slate-700/50 text-white text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg border border-white/20 focus:outline-none break-all overflow-hidden touch-manipulation"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyLink}
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg font-bold text-[10px] sm:text-xs transition-all whitespace-nowrap touch-manipulation ${
                  copiedLink
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copiedLink ? t('copied') : t('copyLink')}
              </button>
            </div>
          </div>

          {/* Поделиться через мессенджеры */}
          <div>
            <div className="text-white/70 text-[9px] sm:text-[10px] mb-1">{t('share')}</div>
            <div className="flex flex-row gap-1">
              <button
                onClick={() => {
                  // Для Telegram ссылка передается через параметр url, в text только текст без ссылки
                  const shareText = t('youAreInvited');
                  const url = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`;
                  window.open(url, '_blank');
                }}
                className="flex-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg font-bold text-[10px] sm:text-xs transition-all whitespace-nowrap touch-manipulation bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1"
              >
                <span>📱</span>
                {t('shareViaTelegram')}
              </button>
              <button
                onClick={() => {
                  // Для WhatsApp только text параметр, поэтому ссылка должна быть в тексте
                  const shareMessage = `${t('youAreInvited')}\n${inviteUrl}`;
                  const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
                  window.open(url, '_blank');
                }}
                className="flex-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg font-bold text-[10px] sm:text-xs transition-all whitespace-nowrap touch-manipulation bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1"
              >
                <span>💬</span>
                {t('shareViaWhatsApp')}
              </button>
              <button
                onClick={() => {
                  // Для Max ссылка передается через параметр url, в text только текст без ссылки
                  const shareText = t('youAreInvited');
                  const url = `https://max.team/share?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(shareText)}`;
                  window.open(url, '_blank');
                }}
                className="flex-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg font-bold text-[10px] sm:text-xs transition-all whitespace-nowrap touch-manipulation bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-1"
              >
                <span>💜</span>
                {t('shareViaMax')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-1.5 relative">
          <button
            onClick={handleCopyLink}
            className={`flex-1 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg font-bold text-[10px] sm:text-xs transition-all whitespace-nowrap touch-manipulation flex items-center justify-center gap-1 ${
              copiedLink
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title={t('copyLink') || 'Скопировать ссылку'}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {t('copyLink')}
          </button>
          <button
            onClick={() => setIsExpanded(true)}
            className={`flex-1 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg font-bold text-[10px] sm:text-xs transition-all whitespace-nowrap touch-manipulation flex items-center justify-center gap-1 ${
              'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title={t('share') || 'Поделиться'}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {t('share')}
          </button>
        </div>
      )}
    </div>
  );
}
