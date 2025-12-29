# Исправление DNS для домена SUPER2026.ONLINE

## Проблема
Домен не работает, хотя DNS-серверы настроены правильно. В тестах показано:
- DNS-серверы работают корректно
- НО отсутствуют A-записи для домена `SUPER2026.ONLINE` и `WWW.SUPER2026.ONLINE`

## Решение

Нужно добавить A-записи в панели управления доменом (REG.RU, Timeweb или где регистрировался домен).

### Шаги:

1. Войдите в панель управления доменом (где регистрировали super2026.online)

2. Найдите раздел "DNS-записи" / "DNS-настройки" / "Управление DNS"

3. Добавьте следующие A-записи:

   ```
   Тип: A
   Имя: @ (или оставить пустым для основного домена)
   Значение: 5.129.223.23
   TTL: 3600 (или по умолчанию)

   Тип: A
   Имя: www
   Значение: 5.129.223.23
   TTL: 3600 (или по умолчанию)
   ```

4. Сохраните изменения

5. Подождите распространения DNS (обычно 5-60 минут, иногда до 24 часов)

6. Проверьте через несколько минут:
   ```bash
   nslookup super2026.online
   nslookup www.super2026.online
   ```

   Оба должны вернуть IP: `5.129.223.23`

## Обновление Nginx конфигурации

После того как DNS начнет работать, убедитесь что Nginx настроен правильно:

```bash
nano /etc/nginx/sites-available/cosmos-of-hopes
```

Проверьте что `server_name` включает оба варианта:

```nginx
server {
    listen 80;
    server_name super2026.online www.super2026.online 5.129.223.23;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Проверьте и перезагрузите:

```bash
nginx -t
systemctl reload nginx
```

