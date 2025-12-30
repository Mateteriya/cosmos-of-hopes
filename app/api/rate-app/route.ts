import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, rating } = await request.json();

    if (!userId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Сохраняем оценку в базу данных
    const { error } = await supabase
      .from('app_ratings')
      .insert({
        user_id: userId,
        rating: rating,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Ошибка при сохранении оценки:', error);
      return NextResponse.json(
        { error: 'Failed to save rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка в API rate-app:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

