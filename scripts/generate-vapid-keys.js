// Скрипт для генерации VAPID ключей
// Запуск: node scripts/generate-vapid-keys.js
// Или: npm run generate-vapid-keys

const webpush = require('web-push');

console.log('Генерирую VAPID ключи...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('================================');
console.log('VAPID КЛЮЧИ СОЗДАНЫ!');
console.log('================================\n');
console.log('Public Key (NEXT_PUBLIC_VAPID_PUBLIC_KEY):');
console.log(vapidKeys.publicKey);
console.log('\n');
console.log('Private Key (VAPID_PRIVATE_KEY - НЕ ПУБЛИКУЙТЕ!):');
console.log(vapidKeys.privateKey);
console.log('\n');
console.log('================================');
console.log('Добавьте эти ключи в .env.local:');
console.log('================================\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\n');
console.log('⚠️  ВАЖНО: Private Key должен храниться в секрете!');
console.log('   Используйте его только на сервере (Supabase Edge Functions)');

