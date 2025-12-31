# Проверка конфигурации nginx для Jitsi

## Найти конфигурацию nginx

```bash
# Найти все конфигурационные файлы nginx
ls -la /etc/nginx/sites-enabled/
ls -la /etc/nginx/conf.d/

# Или найти файлы содержащие meet.super2026.online
grep -r "meet.super2026.online" /etc/nginx/

# Проверить основной конфиг nginx
cat /etc/nginx/nginx.conf | grep -i include
```

## Проверить что nginx правильно проксирует запросы

```bash
# Проверить статус nginx
systemctl status nginx

# Проверить конфигурацию nginx на ошибки
nginx -t

# Проверить логи nginx
tail -50 /var/log/nginx/error.log
```

## Проверить доступность основных эндпоинтов Jitsi

```bash
# Проверить http-bind
curl -I https://meet.super2026.online/http-bind

# Проверить websocket
curl -I https://meet.super2026.online/xmpp-websocket

# Проверить главную страницу
curl -I https://meet.super2026.online/
```

