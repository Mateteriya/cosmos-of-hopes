# 🔧 Исправление конфигурации Jitsi (опционально)

## Проблема
Ошибки JavaScript: `config is not defined` - отсутствует конфигурационный файл Jitsi.

## Решение

### Проверить наличие конфигурационного файла

```bash
# Проверить какие конфигурационные файлы есть
ls -la /etc/jitsi/meet/

# Должен быть файл: meet.super2026.online-config.js
```

### Если файла нет, создать базовый конфигурационный файл

```bash
# Создать базовый конфигурационный файл
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

# Установить правильные права
chown root:www-data /etc/jitsi/meet/meet.super2026.online-config.js
chmod 644 /etc/jitsi/meet/meet.super2026.online-config.js
```

### Перезагрузить nginx

```bash
systemctl reload nginx
```

---

**Примечание:** Эти ошибки не критичны - Jitsi может работать даже без полной конфигурации. Основная функциональность (видео/аудио) должна работать.

---

**Дата:** 2025-01-28

