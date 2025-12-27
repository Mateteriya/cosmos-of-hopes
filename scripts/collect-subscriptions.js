// Скрипт для сбора подписок из Supabase (если таблица создана)
// Альтернатива: можно использовать для ручного сбора подписок

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Загружаем .env.local (простая версия без dotenv)
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim();
      }
    });
  }
} catch (error) {
  console.warn('Не удалось загрузить .env.local:', error.message);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ОШИБКА: Supabase ключи не настроены!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SUBSCRIPTIONS_FILE = path.join(__dirname, '..', 'subscriptions.json');

async function collectSubscriptions() {
  console.log('📥 Сбор подписок из базы данных...\n');

  try {
    // Получаем все подписки из базы данных
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('subscription');

    if (error) {
      if (error.code === '42P01') {
        console.log('⚠️ Таблица push_subscriptions не существует.');
        console.log('\nСоздайте таблицу командой:');
        console.log(`
CREATE TABLE push_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
        `);
        return;
      }
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ Подписок не найдено в базе данных.');
      return;
    }

    // Извлекаем только subscription объекты
    const subscriptions = data.map(row => row.subscription);

    // Сохраняем в файл
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));

    console.log(`✅ Собрано ${subscriptions.length} подписок`);
    console.log(`📁 Сохранено в ${SUBSCRIPTIONS_FILE}`);
    console.log('\nТеперь можно отправить уведомления командой:');
    console.log('node scripts/send-new-year-reminder.js');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

collectSubscriptions();

