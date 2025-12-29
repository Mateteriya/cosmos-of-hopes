'use server';

/**
 * API маршрут для синхронизации времени
 * Гибридный подход: пытается получить точное время из интернета,
 * если не получается - использует серверное время
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Пытаемся получить точное время из внешнего API
    try {
      const response = await fetch('https://worldtimeapi.org/api/timezone/UTC', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Таймаут 2 секунды, чтобы не ждать долго
        signal: AbortSignal.timeout(2000),
      });

      if (response.ok) {
        const data = await response.json();
        // WorldTimeAPI возвращает время в формате ISO 8601
        const accurateTime = data.datetime || data.utc_datetime;
        
        if (accurateTime) {
          return NextResponse.json({
            timestamp: accurateTime,
            timezone: 'UTC',
            source: 'worldtimeapi',
            success: true
          });
        }
      }
    } catch (externalError) {
      // Если внешний API недоступен, используем серверное время
      // Это нормально для офлайн режима
    }

    // Fallback: возвращаем текущее время сервера в формате ISO
    const serverTime = new Date().toISOString();

    return NextResponse.json({
      timestamp: serverTime,
      timezone: 'UTC',
      source: 'server',
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
