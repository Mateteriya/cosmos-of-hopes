# Настройка домена super2026.online

## Шаг 1: Настройка DNS записей

В панели управления доменом (где вы покупали домен) добавьте следующие DNS записи:

**Тип A записи:**
- Имя/Поддомен: `@` (или оставьте пустым для корневого домена)
- Значение/IP: `5.129.223.23`
- TTL: 3600 (или по умолчанию)

**Тип A записи для www:**
- Имя/Поддомен: `www`
- Значение/IP: `5.129.223.23`
- TTL: 3600 (или по умолчанию)

## Шаг 2: Проверка DNS (после настройки)

Подождите 5-15 минут и проверьте:

```bash
# На вашем компьютере (Windows PowerShell)
nslookup super2026.online
nslookup www.super2026.online
```

Должен вернуться IP: `5.129.223.23`

## Шаг 3: Обновление Nginx на сервере

SSH на сервер и выполните:

```bash
nano /etc/nginx/sites-available/cosmos-of-hopes
```

Замените содержимое на:

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

Сохраните (Ctrl+O, Enter, Ctrl+X) и выполните:

```bash
nginx -t
systemctl reload nginx
```

## Шаг 4: Проверка работы

Откройте в браузере:
- http://super2026.online
- http://www.super2026.online

Оба должны открывать ваше приложение!

## Примечания

- Если домен не работает сразу, подождите до 24 часов (обычно 5-30 минут)
- Для HTTPS (SSL) нужно будет установить Let's Encrypt сертификат позже
- Убедитесь, что порт 80 открыт на сервере (должен быть открыт по умолчанию)

