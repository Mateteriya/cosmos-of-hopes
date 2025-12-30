/**
 * Supabase серверный клиент с service role key
 * ВАЖНО: Используется только на сервере для операций, требующих обхода RLS
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Функция для получения серверного клиента (только на сервере)
export function getSupabaseServer() {
  // Проверяем, что мы на сервере
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseServer() может использоваться только на сервере!');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY не настроен в переменных окружения!');
  }

  // Серверный клиент с полным доступом (обходит RLS)
  return createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

