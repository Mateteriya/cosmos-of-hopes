'use client';

/**
 * Компонент чата для комнаты
 */

import { useState, useEffect, useRef } from 'react';
import { getRoomMessages, sendRoomMessage, subscribeToRoomMessages } from '@/lib/roomMessages';
import { useLanguage } from '@/components/constructor/LanguageProvider';
import type { RoomMessage } from '@/types/room';

interface RoomChatProps {
  roomId: string;
  currentUserId: string;
  hideHeader?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function RoomChat({ roomId, currentUserId, hideHeader = false, isCollapsed = false, onToggleCollapse }: RoomChatProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Загружаем историю сообщений и подписываемся на новые
  useEffect(() => {
    if (!roomId) return;
    
    let lastMessageId: string | null = null;
    
    // Функция для загрузки новых сообщений
    const checkNewMessages = async () => {
      try {
        const allMessages = await getRoomMessages(roomId, 100);
        if (allMessages.length > 0) {
          const latestMessage = allMessages[allMessages.length - 1];
          if (lastMessageId && latestMessage.id !== lastMessageId) {
            // Есть новые сообщения
            setMessages(allMessages);
          } else if (!lastMessageId) {
            // Первая загрузка
            setMessages(allMessages);
            lastMessageId = latestMessage.id;
          }
        }
      } catch (err) {
        console.error('Ошибка проверки новых сообщений:', err);
      }
    };
    
    // Загружаем сообщения сразу
    const initialLoad = async () => {
      const messages = await loadMessages();
      if (messages.length > 0) {
        lastMessageId = messages[messages.length - 1].id;
      }
    };
    initialLoad();
    
    // Подписываемся на новые сообщения через Supabase Realtime
    const unsubscribe = subscribeToRoomMessages(roomId, (newMessage) => {
      console.log('📨 Новое сообщение получено через Realtime:', newMessage);
      setMessages(prev => {
        // Проверяем, нет ли уже такого сообщения (защита от дубликатов)
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) {
          console.log('⚠️ Сообщение уже существует, пропускаем');
          return prev;
        }
        console.log('✅ Добавляем новое сообщение в список');
        lastMessageId = newMessage.id;
        return [...prev, newMessage];
      });
    });

    // Polling как fallback (проверяем каждые 2 секунды)
    const pollingInterval = setInterval(checkNewMessages, 2000);

    return () => {
      unsubscribe();
      clearInterval(pollingInterval);
    };
  }, [roomId]);

  // Прокрутка вниз при новых сообщениях (только внутри контейнера чата)
  useEffect(() => {
    if (messagesContainerRef.current) {
      // Прокручиваем только контейнер чата, а не всю страницу
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Закрытие emoji picker при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setEmojiPickerOpen(false);
      }
    };

    if (emojiPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [emojiPickerOpen]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const messages = await getRoomMessages(roomId, 100);
      setMessages(messages);
      return messages;
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      console.log('📤 Отправка сообщения:', newMessage.trim());
      const sentMessage = await sendRoomMessage(roomId, currentUserId, newMessage.trim());
      console.log('✅ Сообщение отправлено:', sentMessage);
      setNewMessage('');
      setEmojiPickerOpen(false);
      // Не добавляем сообщение вручную - оно придет через Realtime подписку
    } catch (err: any) {
      console.error('❌ Ошибка отправки сообщения:', err);
      alert(err.message || t('messageSendError'));
    }
  };

  // Современные эмодзи в космическом стиле
  const popularEmojis = [
    // Космос и звезды
    '🌌', '🌠', '⭐', '🌟', '✨', '💫', '🚀', '🛸', '👽', '🛰️',
    '🌍', '🌎', '🌏', '🪐', '🌙', '☀️', '🌕', '🌖', '🌗', '🌘',
    '🌑', '🌒', '🌓', '🌔', '⚡', '🔥', '💥', '🌈', '☄️', '🌊',
    
    // Современные эмоции
    '😊', '🥰', '😍', '🤩', '😎', '🤗', '😇', '🥳', '🤯', '😌',
    '😉', '😋', '😜', '🤪', '😝', '🤑', '🤭', '🤫', '🤔', '🤐',
    '😏', '😴', '🤤', '😮', '😯', '😲', '😳', '🥺', '😱', '🤯',
    '😵', '😵‍💫', '🤠', '🥸', '🤓', '🧐', '😕', '😟', '🙁', '😤',
    
    // Сердца и любовь
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '❤️‍🔥',
    '❤️‍🩹', '💋', '💌', '💐', '🌹', '🥀', '🌺', '🌸', '🌻', '🌷',
    
    // Празднование и веселье
    '🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁', '🍾', '🥂',
    '🍻', '🥳', '🎆', '🎇', '🧨', '✨', '🎪', '🎭', '🎨', '🎬',
    
    // Жесты и действия
    '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘',
    '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚',
    '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🤝', '🙏', '✍️', '💪',
    
    // Современные символы
    '💯', '🔥', '⚡', '💫', '⭐', '🌟', '✨', '🎯', '🎲', '🎰',
    '🎮', '🕹️', '🎧', '🎤', '🎵', '🎶', '🎸', '🎹', '🥁', '🎺',
    '🎷', '🎻', '📱', '💻', '⌚', '📷', '📸', '🎥', '📹', '🎬',
    
    // Природа и космос
    '🌲', '🌳', '🌴', '🌵', '🌿', '☘️', '🍀', '🌱', '🌾', '🌺',
    '🌻', '🌷', '🌹', '🥀', '🌼', '🌸', '💐', '🌾', '🌿', '🍃',
  ];

  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setEmojiPickerOpen(false);
  };

  return (
    <div className={`flex flex-col ${hideHeader ? 'h-full bg-transparent' : 'h-full bg-slate-800/50 border-2 border-white/20 rounded-lg'} min-h-0`}>
      {/* Заголовок чата */}
      {!hideHeader && (
        <div className="p-2 sm:p-3 border-b border-white/20 flex-shrink-0 flex items-center justify-between">
          <h3 className="text-white font-bold text-xs sm:text-sm">💬 {t('roomChat')}</h3>
          {/* Кнопка свернуть/развернуть */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="bg-gradient-to-b from-purple-700/90 via-purple-800/90 to-purple-900/90 hover:from-purple-600/90 hover:via-purple-700/90 hover:to-purple-800/90 text-white px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 touch-manipulation border border-white/20 backdrop-blur-sm shadow-md"
              style={{
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 1px 2px rgba(0, 0, 0, 0.2)',
                textShadow: '0 1px 1px rgba(0, 0, 0, 0.3)',
              }}
              title={isCollapsed ? t('expand') || 'Развернуть' : t('collapse') || 'Свернуть'}
            >
              {isCollapsed ? (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {t('expand') || 'Развернуть'}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  {t('collapse') || 'Свернуть'}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Сообщения */}
      <div 
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 sm:space-y-2 min-h-0 relative chat-messages-area transition-all duration-300 ${
          isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'opacity-100'
        }`}
        style={isCollapsed ? {} : { minHeight: 0 }}
      >
        {isLoading ? (
          <div className="text-white/50 text-xs sm:text-sm text-center">{t('loadingMessages')}</div>
        ) : messages.length === 0 ? (
          <div className="text-white/50 text-xs sm:text-sm text-center">
            {t('noMessagesYet')}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.user_id === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] sm:max-w-[70%] rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 ${
                  msg.user_id === currentUserId
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-white'
                }`}
              >
                <div className="text-[10px] sm:text-xs opacity-70 mb-0.5 sm:mb-1">
                  {msg.user_id === currentUserId ? t('you') : `${t('participant')} ${msg.user_id.slice(-4)}`}
                </div>
                <div className="text-xs sm:text-sm break-words">{msg.message_text}</div>
                <div className="text-[10px] sm:text-xs opacity-50 mt-0.5 sm:mt-1">
                  {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Форма отправки */}
      <form onSubmit={sendMessage} className={`p-2 sm:p-3 border-t border-white/20 flex-shrink-0 transition-all duration-300 ${
        isCollapsed ? 'max-h-0 opacity-0 overflow-hidden p-0 border-0' : 'opacity-100'
      }`}>
        <div className="flex gap-1.5 sm:gap-2 relative">
          {/* Кнопка эмодзи */}
          <button
            type="button"
            onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
            className="bg-purple-800/80 hover:bg-purple-700/80 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-base sm:text-lg flex-shrink-0 border border-white/20"
            title={t('emoji') || 'Эмодзи'}
          >
            👽
          </button>
          
          {/* Emoji Picker */}
          {emojiPickerOpen && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-full left-0 mb-2 bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-lg p-3 shadow-xl z-50"
              style={{
                width: '280px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              <div className="grid grid-cols-8 gap-1">
                {popularEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="text-lg sm:text-xl hover:bg-white/20 rounded p-1 transition-colors touch-manipulation"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('writeMessage')}
            className="flex-1 bg-purple-900/80 text-white placeholder:text-white/50 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
            maxLength={500}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
          >
            {t('send')}
          </button>
        </div>
      </form>
    </div>
  );
}
