# Исправление Nginx конфигурации

## Проблема
Ошибка: `unknown directive "cd" in /etc/nginx/sites-enabled/cosmos-of-hopes:38`

В файле конфигурации случайно осталась команда `cd` из терминала.

## Решение на сервере

```bash
# 1. Откройте файл
nano /etc/nginx/sites-available/cosmos-of-hopes

# 2. Удалите ВСЕ строки с командами (cd, git pull, npm run build и т.д.)
# 3. Оставьте ТОЛЬКО конфигурацию nginx:

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

# 4. Сохраните: Ctrl+O, Enter, Ctrl+X

# 5. Проверьте конфигурацию
nginx -t

# 6. Если OK, перезагрузите nginx
systemctl reload nginx

# 7. Проверьте статус
systemctl status nginx
```

## Важно!

Файл конфигурации nginx должен содержать ТОЛЬКО директивы nginx, никаких команд bash!

