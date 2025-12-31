import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Проверяем, оценил ли уже пользователь приложение
    const { data, error } = await supabase
      .from('app_ratings')
      .select('rating')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Ошибка при проверке оценки:', error);
      return NextResponse.json(
        { error: 'Failed to check rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasRated: !!data,
      rating: data?.rating || null,
    });
  } catch (error) {
    console.error('Ошибка в API rate-app GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
      } as any);

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

