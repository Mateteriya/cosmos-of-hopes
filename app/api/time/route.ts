'use server';

/**
 * API маршрут для синхронизации времени
 * Возвращает текущее время сервера для точной синхронизации таймера
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Возвращаем текущее время сервера в формате ISO
    const serverTime = new Date().toISOString();

    return NextResponse.json({
      timestamp: serverTime,
      timezone: 'UTC',
      success: true
    });
  } catch (error) {
    console.error('Ошибка при получении времени сервера:', error);
    return NextResponse.json(
      { error: 'Не удалось получить время сервера', success: false },
      { status: 500 }
    );
  }
}
