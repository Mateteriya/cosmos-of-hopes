'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ToyConstructor from '@/components/constructor/ToyConstructor';
import type { ToyParams } from '@/types/toy';
import { createToy } from '@/lib/toys';
import { supabase } from '@/lib/supabase';

// Временный userId для тестирования (позже будет из Telegram)
const TEMP_USER_ID = 'test_user_' + Date.now();

export default function ConstructorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Получаем roomId из URL параметров
  const roomId = searchParams.get('room');

  const handleSave = async (params: ToyParams) => {
    try {
      // Добавляем room_id к параметрам, если он есть в URL
      const paramsWithRoom: ToyParams = {
        ...params,
        room_id: roomId || undefined,
      };
      
      console.log('Сохранение игрушки:', { roomId, room_id: paramsWithRoom.room_id, userId: TEMP_USER_ID });
      
      // Сохраняем игрушку
      const toy = await createToy(TEMP_USER_ID, paramsWithRoom);
      
      console.log('Игрушка создана:', { toyId: toy.id, room_id: toy.room_id });
      
      // Обновляем игрушку: помечаем как на ёлке и устанавливаем позицию
      // Пока миграция не применена, используем только существующие поля
      const updateData: any = {
        status: 'on_tree', // Используем существующее поле
      };

      // Пытаемся обновить новые поля (если миграция применена)
      try {
        const position = {
          x: (Math.random() - 0.5) * 3,
          y: -1.5 + Math.random() * 3,
          z: (Math.random() - 0.5) * 3,
        };
        
        updateData.is_on_tree = true;
        updateData.position = position;
        updateData.author_tg_id = TEMP_USER_ID;
        // Сохраняем room_id при обновлении тоже (на случай, если он не сохранился при создании)
        if (roomId) updateData.room_id = roomId;
        if (params.ball_size !== undefined) updateData.ball_size = params.ball_size;
        if (params.surface_type) updateData.surface_type = params.surface_type;
        if (params.effects) updateData.effects = params.effects;
        if (params.filters) updateData.filters = params.filters;
        if (params.second_color) updateData.second_color = params.second_color;
        if (params.user_name) updateData.user_name = params.user_name;
        if (params.selected_country) updateData.selected_country = params.selected_country;
        if (params.birth_year) updateData.birth_year = params.birth_year;

        await supabase
          .from('toys')
          .update(updateData as any)
          .eq('id', toy.id);
      } catch (err: any) {
        // Если поля не существуют (миграция не применена), просто обновляем status
        if (err?.message?.includes('does not exist') || err?.code === '42703') {
          await supabase
            .from('toys')
            .update({ status: 'on_tree' } as any)
            .eq('id', toy.id);
        } else {
          throw err;
        }
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        // Возвращаемся на страницу ёлки (с room_id, если был)
        if (roomId) {
          router.push(`/tree?room=${roomId}`);
        } else {
        router.push('/tree');
        }
      }, 2000);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen">
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          ✅ Ваша игрушка заняла своё место на ёлке! 1 января она отправится в космос! 🌟
        </div>
      )}

      <ToyConstructor onSave={handleSave} userId={TEMP_USER_ID} />
    </div>
  );
}

