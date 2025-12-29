'use client';

/**
 * Условный компонент AuthButton
 * Показывается только на главной странице, скрыт на странице комнаты
 */

import { usePathname } from 'next/navigation';
import AuthButton from './AuthButton';

export default function ConditionalAuthButton() {
  const pathname = usePathname();
  
  // Скрываем кнопки авторизации на странице комнаты
  if (pathname?.startsWith('/room')) {
    return null;
  }
  
  return <AuthButton />;
}

