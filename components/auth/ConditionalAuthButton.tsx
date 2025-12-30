'use client';

/**
 * Условный компонент AuthButton
 * Показывается только на главной странице
 */

import { usePathname } from 'next/navigation';
import AuthButton from './AuthButton';

export default function ConditionalAuthButton() {
  const pathname = usePathname();
  
  // Показываем кнопки авторизации только на главной странице
  if (pathname !== '/') {
    return null;
  }
  
  return <AuthButton />;
}

