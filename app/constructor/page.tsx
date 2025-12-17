'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ToyConstructor from '@/components/constructor/ToyConstructor';
import type { ToyParams } from '@/types/toy';
import { createToy } from '@/lib/toys';
import { supabase } from '@/lib/supabase';

// Временный userId для тестирования (позже будет из Telegram)
const TEMP_USER_ID = 'test_user_' + Date.now();

export default function ConstructorPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  
  // Получаем roomId из URL параметров после монтирования
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setRoomId(params.get('room'));
    }
  }, []);

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
      const position = {
        x: (Math.random() - 0.5) * 3,
        y: -1.5 + Math.random() * 3,
        z: (Math.random() - 0.5) * 3,
      };

      const updateData = {
        status: 'on_tree' as const, // Используем существующее поле
        is_on_tree: true,
        position: position,
        author_tg_id: TEMP_USER_ID,
        ...(roomId && { room_id: roomId }),
        ...(params.ball_size !== undefined && { ball_size: params.ball_size }),
        ...(params.surface_type && { surface_type: params.surface_type }),
        ...(params.effects && { effects: params.effects }),
        ...(params.filters && { filters: params.filters }),
        ...(params.second_color && { second_color: params.second_color }),
        ...(params.user_name && { user_name: params.user_name }),
        ...(params.selected_country && { selected_country: params.selected_country }),
        ...(params.birth_year !== undefined && { birth_year: params.birth_year }),
      };

      // Пытаемся обновить новые поля (если миграция применена)
      try {
        await supabase
          .from('toys')
          .update(updateData as never)
          .eq('id', toy.id);
      } catch (err: unknown) {
        // Если поля не существуют (миграция не применена), просто обновляем status
        const error = err as { message?: string; code?: string };
        if (error?.message?.includes('does not exist') || error?.code === '42703') {
          await supabase
            .from('toys')
            .update({ status: 'on_tree' } as never)
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


