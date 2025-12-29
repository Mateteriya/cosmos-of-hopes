# Исправление ошибки Nginx

## Проблема
```
unknown directive "cd" in /etc/nginx/sites-enabled/cosmos-of-hopes:19
```

Это значит, что в файле конфигурации nginx случайно осталась команда `cd` из терминала.

## Решение

1. Откройте файл конфигурации:
```bash
nano /etc/nginx/sites-available/cosmos-of-hopes
```

2. Убедитесь, что файл содержит ТОЛЬКО следующее (без лишних строк с командами):

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

3. Сохраните файл:
   - Нажмите `Ctrl+O` (сохранить)
   - Нажмите `Enter` (подтвердить имя файла)
   - Нажмите `Ctrl+X` (выход)

4. Проверьте конфигурацию:
```bash
nginx -t
```

Должно вывести: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

5. Перезагрузите nginx:
```bash
systemctl reload nginx
```

## Проверка

```bash
systemctl status nginx
```

Должно быть: `Active: active (running)`

