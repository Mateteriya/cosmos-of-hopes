'use client';

/**
 * Главная страница - редирект на ёлку
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Редирект на страницу ёлки
    router.push('/tree');
  }, [router]);

  return (
    <div className="w-full h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-white text-2xl font-bold">Загрузка...</div>
    </div>
  );
}
