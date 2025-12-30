import { NextRequest, NextResponse } from 'next/server';
import { deleteAllCustomToysExceptSeven, getToysOnTree } from '@/lib/toys';

/**
 * Endpoint для удаления всех кастомных шаров кроме 7
 * Использование: GET /api/cleanup-all-toys?roomId=ROOM_ID (опционально)
 * 
 * ВАЖНО: Удаляет ВСЕ кастомные шары из БД (включая прод), оставляя только 7!
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get('roomId') || undefined;

    // Проверяем наличие service role key
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log(`[Cleanup] Service Role Key присутствует: ${hasServiceKey}`);
    console.log(`[Cleanup] Удаление всех кастомных шаров (комната: ${roomId || 'общая'})`);

    // Проверяем количество ДО удаления
    const toysBefore = await getToysOnTree(roomId);
    console.log(`[Cleanup] Шаров ДО удаления: ${toysBefore.length}`);

    const deletedCount = await deleteAllCustomToysExceptSeven(roomId);

    // Проверяем количество ПОСЛЕ удаления
    const toysAfter = await getToysOnTree(roomId);
    console.log(`[Cleanup] Шаров ПОСЛЕ удаления: ${toysAfter.length}`);

    return NextResponse.json({
      success: true,
      message: `Удалено ${deletedCount} шаров. Оставлено 7 кастомных шаров.`,
      deletedCount,
      before: toysBefore.length,
      after: toysAfter.length,
      hasServiceKey,
      note: 'Обновите страницу елки (F5 или Ctrl+R) чтобы увидеть изменения',
    });
  } catch (error: any) {
    console.error('[Cleanup] Ошибка:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Ошибка при удалении шаров',
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      { status: 500 }
    );
  }
}

