'use client';

/**
 * Главная страница приложения "Cosmos of Hopes"
 */

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
            ✨ Cosmos of Hopes ✨
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-2">
            Совместное празднование Нового года онлайн
          </p>
          <p className="text-lg text-white/60">
            Создавайте шары желаний, украшайте ёлку вместе с друзьями
          </p>
        </div>

        {/* Основные действия */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Создать шар */}
          <button
            onClick={() => router.push('/constructor')}
            className="group relative bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-12 rounded-2xl shadow-2xl transition-all transform hover:scale-105 hover:shadow-purple-500/50"
          >
            <div className="text-5xl mb-4">🎄</div>
            <div className="text-2xl mb-2">Создать шар</div>
            <div className="text-sm opacity-90">Украсьте ёлку своим желанием</div>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-2xl transition-all" />
          </button>

          {/* Комнаты */}
          <button
            onClick={() => router.push('/rooms')}
            className="group relative bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold px-8 py-12 rounded-2xl shadow-2xl transition-all transform hover:scale-105 hover:shadow-cyan-500/50"
          >
            <div className="text-5xl mb-4">🏠</div>
            <div className="text-2xl mb-2">Комнаты</div>
            <div className="text-sm opacity-90">Создайте комнату для друзей</div>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-2xl transition-all" />
          </button>

          {/* Общая ёлка */}
          <button
            onClick={() => router.push('/tree')}
            className="group relative bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-8 py-12 rounded-2xl shadow-2xl transition-all transform hover:scale-105 hover:shadow-emerald-500/50"
          >
            <div className="text-5xl mb-4">🌟</div>
            <div className="text-2xl mb-2">Общая ёлка</div>
            <div className="text-sm opacity-90">Посмотрите все желания</div>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-2xl transition-all" />
          </button>
        </div>

        {/* Дополнительная информация */}
        <div className="bg-slate-800/50 backdrop-blur-md border-2 border-white/20 rounded-2xl p-6 text-center">
          <p className="text-white/70 text-sm mb-2">
            💫 Присоединяйтесь к тысячам людей, которые уже украсили нашу виртуальную ёлку
          </p>
          <p className="text-white/50 text-xs">
            Каждый шар — это чьё-то желание, мечта или надежда на новый год
          </p>
        </div>
      </div>
    </div>
  );
}
