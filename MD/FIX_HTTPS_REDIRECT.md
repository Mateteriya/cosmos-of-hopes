# 🔧 Исправление редиректа на HTTPS

## Проблема
Nginx редиректит HTTP на HTTPS (301), но ваше приложение работает только на HTTP (порт 80).

## Решение

### Шаг 1: Проверить конфигурацию cosmos-of-hopes

```bash
# Посмотреть полную конфигурацию
cat /etc/nginx/sites-available/cosmos-of-hopes
```

Если видите строки типа:
```nginx
if ($host = super2026.online) {
    return 301 https://$host$request_uri;
}
```

Их нужно удалить!

### Шаг 2: Исправить конфигурацию

```bash
# Отредактировать конфигурацию
nano /etc/nginx/sites-available/cosmos-of-hopes
```

Убедитесь, что файл содержит ТОЛЬКО это (БЕЗ редиректов на HTTPS):

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

**ВАЖНО:** НЕ должно быть никаких блоков `if` с редиректами на HTTPS!

Сохраните (Ctrl+O, Enter, Ctrl+X).

### Шаг 3: Проверить и перезагрузить

```bash
# Проверить конфигурацию
nginx -t

# Перезагрузить
systemctl reload nginx

# Проверить работу
curl -v -H "Host: super2026.online" http://localhost 2>&1 | head -40
```

Теперь должно вернуть HTML вашего приложения, а не редирект!

### Шаг 4: Если проблема осталась - проверить все редиректы

```bash
# Найти все редиректы на HTTPS в конфигурациях
grep -r "return 301 https" /etc/nginx/sites-enabled/
grep -r "return 301 https" /etc/nginx/sites-available/

# Проверить, нет ли общих редиректов в главном конфиге
grep -r "return 301" /etc/nginx/nginx.conf
```

### Шаг 5: Альтернативное решение - отключить редирект через default_server

Если редирект где-то еще, можно явно указать, что cosmos-of-hopes обрабатывает запросы по умолчанию:

```bash
nano /etc/nginx/sites-available/cosmos-of-hopes
```

Изменить:
```nginx
listen 80;
```

На:
```nginx
listen 80 default_server;
```

Сохранить и перезагрузить.

