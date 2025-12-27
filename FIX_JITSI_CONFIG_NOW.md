# 🔧 СРОЧНО: Исправление конфигурации Jitsi

## Проблема
Страница Jitsi пустая из-за ошибки `config is not defined` - отсутствует конфигурационный файл.

## Решение

Выполните на сервере:

```bash
# 1. Проверить есть ли файл конфигурации
ls -la /etc/jitsi/meet/meet.super2026.online-config.js

# 2. Если файла нет, создать его
cat > /etc/jitsi/meet/meet.super2026.online-config.js << 'EOF'
/* eslint-disable no-unused-vars, no-var */
var config = {
    // Connection
    hosts: {
        domain: 'meet.super2026.online',
        muc: 'conference.meet.super2026.online',
        focus: 'focus.meet.super2026.online',
    },
    // Bosh URL
    bosh: '//meet.super2026.online/http-bind',
    // Websocket URL
    websocket: 'wss://meet.super2026.online/xmpp-websocket',
    // The name of client node advertised in XEP-0115 'c' stanza
    clientNode: 'http://jitsi.org/jitsimeet',
};
EOF

# 3. Установить правильные права
chown root:www-data /etc/jitsi/meet/meet.super2026.online-config.js
chmod 644 /etc/jitsi/meet/meet.super2026.online-config.js

# 4. Проверить что файл создан
cat /etc/jitsi/meet/meet.super2026.online-config.js
```

После этого Jitsi должен работать!

---

**Дата:** 2025-01-28

