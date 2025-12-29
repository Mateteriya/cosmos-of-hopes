# 🚨 СРОЧНО: Исправление маршрутизации домена

## Проблема
По доменной ссылке `super2026.online` открывается Jitsi вместо вашего приложения.

## Диагностика на сервере

Выполните эти команды на сервере через SSH:

```bash
# 1. Проверить все конфигурации nginx
ls -la /etc/nginx/sites-enabled/
ls -la /etc/nginx/sites-available/

# 2. Посмотреть содержимое конфигурации для основного домена
cat /etc/nginx/sites-available/cosmos-of-hopes

# 3. Проверить, есть ли конфигурация Jitsi, которая перехватывает запросы
cat /etc/nginx/sites-available/* | grep -A 5 "server_name.*super2026.online"

# 4. Проверить активные конфигурации
cat /etc/nginx/sites-enabled/* | grep -A 10 "server_name"
```

## Исправление

### Шаг 1: Открыть конфигурацию основного домена

```bash
nano /etc/nginx/sites-available/cosmos-of-hopes
```

### Шаг 2: Убедиться, что файл содержит ТОЛЬКО это:

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

**ВАЖНО:** 
- НЕ должно быть никаких редиректов на Jitsi
- НЕ должно быть `proxy_pass` на Jitsi
- Должен быть ТОЛЬКО `proxy_pass http://localhost:3000`

### Шаг 3: Проверить конфигурацию Jitsi (если есть)

```bash
# Найти конфигурацию Jitsi
ls -la /etc/nginx/sites-available/ | grep -i jitsi
ls -la /etc/nginx/sites-enabled/ | grep -i jitsi

# Если есть конфигурация Jitsi, проверить её
cat /etc/nginx/sites-available/jitsi-meet 2>/dev/null || echo "Файл не найден"
```

Конфигурация Jitsi должна содержать ТОЛЬКО:
```nginx
server {
    listen 80;
    server_name meet.super2026.online;  # ТОЛЬКО meet.super2026.online, НЕ super2026.online!
    
    # ... конфигурация Jitsi ...
}
```

### Шаг 4: Убедиться, что конфигурация активна

```bash
# Проверить симлинк
ls -la /etc/nginx/sites-enabled/cosmos-of-hopes

# Если симлинка нет, создать:
ln -sf /etc/nginx/sites-available/cosmos-of-hopes /etc/nginx/sites-enabled/cosmos-of-hopes
```

### Шаг 5: Проверить конфигурацию nginx

```bash
nginx -t
```

Должно вывести: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

Если есть ошибки - исправьте их.

### Шаг 6: Перезагрузить nginx

```bash
systemctl reload nginx
```

### Шаг 7: Проверить статус

```bash
systemctl status nginx
```

Должно быть: `Active: active (running)`

### Шаг 8: Проверить, что приложение запущено

```bash
# Проверить, запущен ли Next.js на порту 3000
netstat -tlnp | grep 3000
# или
ss -tlnp | grep 3000

# Если не запущен, запустить:
cd /path/to/cosmos-of-hopes
npm run build
pm2 start npm --name "cosmos-of-hopes" -- start
# или
npm run start
```

## Проверка после исправления

1. Откройте в браузере: `http://super2026.online`
2. Должна открыться главная страница вашего приложения (Cosmos of Hopes)
3. НЕ должна открываться страница Jitsi

## Если проблема осталась

Выполните и пришлите вывод:

```bash
# Полная диагностика
echo "=== Активные конфигурации ==="
ls -la /etc/nginx/sites-enabled/

echo "=== Конфигурация cosmos-of-hopes ==="
cat /etc/nginx/sites-available/cosmos-of-hopes

echo "=== Все server_name в конфигурациях ==="
grep -r "server_name" /etc/nginx/sites-available/ /etc/nginx/sites-enabled/

echo "=== Статус nginx ==="
systemctl status nginx

echo "=== Процессы на порту 3000 ==="
netstat -tlnp | grep 3000
```

