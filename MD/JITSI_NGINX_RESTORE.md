# 🔧 Восстановление конфигурации Nginx для Jitsi

## 📊 Текущее состояние

✅ **Хорошие новости:**
- Все пакеты Jitsi установлены
- Все сервисы работают (prosody, jitsi-videobridge2, jicofo, nginx)
- Конфигурационные файлы Jitsi существуют (`/etc/jitsi/meet/`)
- Переменная окружения установлена правильно
- SSL сертификаты есть

❌ **Проблема:**
- Конфигурация nginx для Jitsi **отсутствует** в `sites-enabled/`
- Это значит, что Jitsi сервер не доступен через nginx (через домен `meet.super2026.online`)

---

## 🔧 Решение: Восстановить конфигурацию Nginx

### Шаг 1: Проверить есть ли конфигурация в sites-available

```bash
ls -la /etc/nginx/sites-available/ | grep meet
```

### Шаг 2A: Если файл есть в sites-available

```bash
# Создать симлинк
ln -s /etc/nginx/sites-available/meet.super2026.online /etc/nginx/sites-enabled/meet.super2026.online

# Или если имя другое
ln -s /etc/nginx/sites-available/jitsi-meet /etc/nginx/sites-enabled/jitsi-meet
```

### Шаг 2B: Если файла нет - создать базовую конфигурацию

```bash
# Создать конфигурацию
cat > /etc/nginx/sites-available/meet.super2026.online << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name meet.super2026.online;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name meet.super2026.online;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/meet.super2026.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/meet.super2026.online/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Jitsi Meet configuration
    location / {
        proxy_pass http://localhost:5280;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_buffering off;
        proxy_read_timeout 36000s;
        proxy_send_timeout 36000s;
    }

    # BOSH
    location /http-bind {
        proxy_pass http://localhost:5280/http-bind;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # WebSocket
    location /xmpp-websocket {
        proxy_pass http://localhost:5280/xmpp-websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Создать симлинк
ln -s /etc/nginx/sites-available/meet.super2026.online /etc/nginx/sites-enabled/meet.super2026.online
```

### Шаг 3: Проверить конфигурацию

```bash
nginx -t
```

### Шаг 4: Если ошибка - проверить на каком порту работает Jitsi

```bash
# Проверить порт prosody
netstat -tlnp | grep prosody
# Или
ss -tlnp | grep prosody

# Проверить порт jitsi-videobridge
netstat -tlnp | grep jvb
```

Обычно Jitsi использует порт 5280 для HTTP или работает через встроенный веб-сервер.

### Шаг 5: Если нужно - использовать стандартную конфигурацию Jitsi

Если созданная выше конфигурация не работает, можно использовать стандартную конфигурацию из пакета:

```bash
# Переустановить конфигурацию web
dpkg-reconfigure jitsi-meet-web-config
```

### Шаг 6: Перезагрузить nginx

```bash
systemctl reload nginx
```

### Шаг 7: Проверить работу

```bash
# Проверить доступность
curl -I https://meet.super2026.online 2>&1 | head -10

# Открыть в браузере
# https://meet.super2026.online
```

---

## 🔍 Альтернатива: Использовать стандартную конфигурацию Jitsi

Если выше не работает, можно восстановить стандартную конфигурацию:

```bash
# Переустановить пакет конфигурации
apt install --reinstall jitsi-meet-web-config

# Это должно создать конфигурацию автоматически
ls -la /etc/nginx/sites-available/ | grep jitsi
ls -la /etc/nginx/sites-enabled/ | grep jitsi

# Если создалась, создать симлинк
ln -s /etc/nginx/sites-available/jitsi-meet /etc/nginx/sites-enabled/jitsi-meet

# Проверить и перезагрузить
nginx -t
systemctl reload nginx
```

---

**Дата:** 2025-01-28

