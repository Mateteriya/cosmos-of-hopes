# 🔧 Пошаговое исправление конфигурации Jitsi

## Шаг 1: Проверить директорию

```bash
# Проверить существует ли директория
ls -la /etc/jitsi/meet/

# Если директории нет, создать её
mkdir -p /etc/jitsi/meet
```

## Шаг 2: Создать файл конфигурации

```bash
cat > /etc/jitsi/meet/meet.super2026.online-config.js << 'EOF'
/* eslint-disable no-unused-vars, no-var */
var config = {
    hosts: {
        domain: 'meet.super2026.online',
        muc: 'conference.meet.super2026.online',
        focus: 'focus.meet.super2026.online',
    },
    bosh: '//meet.super2026.online/http-bind',
    websocket: 'wss://meet.super2026.online/xmpp-websocket',
    clientNode: 'http://jitsi.org/jitsimeet',
};
EOF
```

## Шаг 3: Установить права

```bash
chown root:www-data /etc/jitsi/meet/meet.super2026.online-config.js
chmod 644 /etc/jitsi/meet/meet.super2026.online-config.js
```

## Шаг 4: Проверить что файл создан

```bash
cat /etc/jitsi/meet/meet.super2026.online-config.js
```

---

**ВАЖНО:** Выполняйте команды **по отдельности**, не склеивайте их!

---

**Дата:** 2025-01-28

