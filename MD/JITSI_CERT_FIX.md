# 🔧 Исправление проблемы с сертификатами Jitsi

## Проблема
Nginx не может найти сертификат: `/etc/jitsi/meet/meet.super2026.online.crt`

Но мы видели, что сертификаты созданы в `/var/lib/prosody/meet.super2026.online.crt`

## Решение

### Шаг 1: Проверить какие сертификаты есть

```bash
# Проверить сертификаты Prosody
ls -la /var/lib/prosody/*meet*

# Проверить директорию Jitsi
ls -la /etc/jitsi/meet/
```

### Шаг 2: Временно отключить SSL в конфигурации Jitsi

До установки Let's Encrypt сертификата можно временно использовать HTTP:

```bash
# Открыть файл конфигурации
nano "/etc/nginx/sites-enabled/`meet.super2026.online.conf" 

# Или переименовать файл сначала
mv "/etc/nginx/sites-enabled/`meet.super2026.online.conf" /etc/nginx/sites-enabled/meet.super2026.online.conf
nano /etc/nginx/sites-enabled/meet.super2026.online.conf
```

В файле закомментируйте (добавьте # перед) строки с SSL:
```nginx
# ssl_certificate /etc/jitsi/meet/meet.super2026.online.crt;
# ssl_certificate_key /etc/jitsi/meet/meet.super2026.online.key;
```

И измените `listen 443 ssl;` на `listen 80;`

### Шаг 3: Или создать симлинки на существующие сертификаты

Если сертификаты есть в /var/lib/prosody:

```bash
# Создать директорию если нет
mkdir -p /etc/jitsi/meet

# Создать симлинки
ln -s /var/lib/prosody/meet.super2026.online.crt /etc/jitsi/meet/meet.super2026.online.crt
ln -s /var/lib/prosody/meet.super2026.online.key /etc/jitsi/meet/meet.super2026.online.key
```

### Шаг 4: Переименовать файл конфигурации

```bash
# Удалить файл с неправильным именем
rm "/etc/nginx/sites-enabled/`meet.super2026.online.conf"

# Пересоздать конфигурацию (если есть в sites-available)
# Или просто отключить Jitsi конфигурацию пока не установим SSL
```

---

**Дата:** 2025-01-28

