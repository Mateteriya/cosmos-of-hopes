/**
 * Supabase клиент
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Эти значения нужно будет добавить в .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Проверяем, что переменные окружения установлены
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Ошибка конфигурации Supabase:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl || 'НЕ УСТАНОВЛЕН');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***' : 'НЕ УСТАНОВЛЕН');
  console.error('');
  console.error('📝 Решение:');
  console.error('   1. Создайте файл .env.local в папке cosmos-of-hopes/');
  console.error('   2. Добавьте следующие строки:');
  console.error('      NEXT_PUBLIC_SUPABASE_URL=https://ваш-проект.supabase.co');
  console.error('      NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш-anon-key');
  console.error('   3. Перезапустите dev сервер (npm run dev)');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

