'use client';

/**
 * Модальное окно для сбора контактов гостей (email/Telegram)
 */

import { useState } from 'react';
import { useLanguage } from '@/components/constructor/LanguageProvider';

interface Contact {
  type: 'email' | 'telegram';
  value: string;
}

interface GuestContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contacts: Contact[]) => void;
  roomId: string;
}

export default function GuestContactsModal({
  isOpen,
  onClose,
  onSave,
  roomId,
}: GuestContactsModalProps) {
  const { t } = useLanguage();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentType, setCurrentType] = useState<'email' | 'telegram'>('email');
  const [currentValue, setCurrentValue] = useState('');

  if (!isOpen) return null;

  const handleAddContact = () => {
    if (!currentValue.trim()) return;

    // Валидация email
    if (currentType === 'email' && !currentValue.includes('@')) {
      alert(t('pleaseEnterValidEmail') || 'Пожалуйста, введите корректный email адрес');
      return;
    }

    // Валидация Telegram (должен начинаться с @)
    if (currentType === 'telegram' && !currentValue.startsWith('@')) {
      setCurrentValue('@' + currentValue);
    }

    setContacts([...contacts, { type: currentType, value: currentValue.trim() }]);
    setCurrentValue('');
  };

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // TODO: Сохранить контакты в базу данных
    // Можно создать таблицу room_guest_contacts или добавить поле в rooms
    console.log('Saving contacts for room', roomId, contacts);
    onSave(contacts);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border-2 border-purple-500/50 shadow-2xl max-w-lg w-full p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            {t('collectGuestContacts') || 'Собрать контакты гостей'}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm">
            {t('guestContactsMessage') || 'Добавьте email или Telegram аккаунты ваших гостей для отправки им приглашений и напоминаний'}
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          {/* Форма добавления контакта */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={currentType}
              onChange={(e) => setCurrentType(e.target.value as 'email' | 'telegram')}
              className="bg-slate-700/50 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm sm:text-base"
            >
              <option value="email">{t('emailLabel') || 'Email'}</option>
              <option value="telegram">{t('telegramLabel') || 'Telegram'}</option>
            </select>
            <input
              type="text"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              placeholder={currentType === 'email' ? 'email@example.com' : '@username'}
              className="flex-1 bg-slate-700/50 border border-white/20 rounded-lg px-3 sm:px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 text-sm sm:text-base"
              onKeyPress={(e) => e.key === 'Enter' && handleAddContact()}
            />
            <button
              onClick={handleAddContact}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base"
            >
              {t('addContact') || 'Добавить'}
            </button>
          </div>

          {/* Список контактов */}
          {contacts.length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
              <p className="text-white/80 text-xs sm:text-sm mb-2">{t('contactsList') || 'Список контактов'}:</p>
              <div className="space-y-2">
                {contacts.map((contact, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-700/50 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2"
                  >
                    <span className="text-white text-xs sm:text-sm truncate flex-1 mr-2">
                      {contact.type === 'email' ? '📧' : '✈️'} {contact.value}
                    </span>
                    <button
                      onClick={() => handleRemoveContact(index)}
                      className="text-red-400 hover:text-red-300 text-xs sm:text-sm flex-shrink-0 touch-manipulation px-2"
                    >
                      {t('removeContact') || 'Удалить'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all text-sm sm:text-base"
          >
            {t('cancel') || 'Отмена'}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-all transform hover:scale-105 text-sm sm:text-base"
          >
            {t('saveContacts') || 'Сохранить контакты'}
          </button>
        </div>
      </div>
    </div>
  );
}

