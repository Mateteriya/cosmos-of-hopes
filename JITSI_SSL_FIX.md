# 🔒 Исправление установки SSL сертификата для Jitsi

## Проблема
Скрипт установки SSL не может получить домен, потому что он сохранен с обратными кавычками.

## Решение

### Шаг 1: Найти где сохранен домен

```bash
# Проверить конфигурационные файлы Jitsi
grep -r "meet.super2026.online" /etc/jitsi/ 2>/dev/null

# Проверить переменные debconf
debconf-show jitsi-meet 2>/dev/null | grep -i domain

# Проверить конфигурацию nginx
grep -r "meet.super2026.online" /etc/nginx/sites-enabled/
```

### Шаг 2: Проверить скрипт установки SSL

```bash
# Посмотреть скрипт (строка 60 где ошибка)
sed -n '55,65p' /usr/share/jitsi-meet/scripts/install-letsencrypt-cert.sh
```

### Шаг 3: Установить SSL вручную через acme.sh

Если скрипт не работает, можно установить SSL сертификат вручную:

```bash
# Установить acme.sh (если еще не установлен)
cd /opt/acmesh/.acme.sh

# Получить сертификат для домена
./acme.sh --issue -d meet.super2026.online --standalone

# Установить сертификат
./acme.sh --install-cert -d meet.super2026.online \
  --cert-file /etc/jitsi/meet/meet.super2026.online.crt \
  --key-file /etc/jitsi/meet/meet.super2026.online.key \
  --fullchain-file /etc/jitsi/meet/meet.super2026.online.crt \
  --reloadcmd "systemctl reload nginx"
```

### Шаг 4: Или использовать certbot (проще)

```bash
# Установить certbot
apt install -y certbot python3-certbot-nginx

# Получить сертификат (certbot автоматически настроит nginx)
certbot --nginx -d meet.super2026.online

# При запросе email введите ваш email
```

---

**Дата:** 2025-01-28

