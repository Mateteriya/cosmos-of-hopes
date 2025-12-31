# 🔧 Добавление TURN серверов в Jitsi (простая команда)

## Проблема
- Нет звука
- Отключение каждые 30-49 секунд

## Решение: Добавить TURN серверы

### Шаг 1: Создать резервную копию

```bash
cd /etc/jitsi/meet
cp meet.super2026.online-config.js meet.super2026.online-config.js.backup3
```

### Шаг 2: Найти место для вставки

```bash
grep -n "File sharign service" meet.super2026.online-config.js
```

Запомните номер строки (например, 1900).

### Шаг 3: Добавить TURN серверы ПЕРЕД закрывающей скобкой

Найдите строку с `};` (последняя строка перед `if (enableJaaS)`).

**ВАРИАНТ 1: Через sed (автоматически)**

```bash
# Найти последнюю строку перед закрывающей скобкой config
sed -i '/^};$/i\
    // TURN серверы для стабильного соединения\
    iceServers: [\
        { urls: "stun:stun.l.google.com:19302" },\
        { urls: "stun:stun1.l.google.com:19302" },\
        { urls: "stun:stun2.l.google.com:19302" },\
        { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },\
        { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },\
        { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" }\
    ],\
    // Улучшенные настройки аудио\
    enableNoAudioDetection: true,\
    enableNoisyMicDetection: true,\
    audioLevelsInterval: 200,\
' meet.super2026.online-config.js
```

**ВАРИАНТ 2: Вручную через nano (РЕКОМЕНДУЕТСЯ)**

```bash
nano meet.super2026.online-config.js
```

Найдите строку:
```javascript
    // },
};
```

**ПЕРЕД** этой строкой (перед `};`) добавьте:

```javascript
    // TURN серверы для стабильного соединения через NAT/firewall
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
        { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
        { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" }
    ],
    // Улучшенные настройки аудио
    enableNoAudioDetection: true,
    enableNoisyMicDetection: true,
    audioLevelsInterval: 200,
```

**ВАЖНО:** Не забудьте запятую после последнего свойства перед `iceServers`!

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 4: Проверить синтаксис

```bash
node -c meet.super2026.online-config.js
```

Если ошибок нет — продолжайте. Если есть ошибки — проверьте запятые.

### Шаг 5: Перезапустить сервисы

```bash
systemctl restart jitsi-videobridge2
systemctl restart prosody
systemctl restart jicofo
systemctl reload nginx
```

### Шаг 6: Проверить логи

```bash
tail -f /var/log/jitsi/jvb.log
```

---

## 📝 Что делают TURN серверы?

- **STUN** — помогает найти публичный IP (для прямых соединений)
- **TURN** — ретранслирует трафик, когда прямое соединение невозможно (через NAT/firewall)

Без TURN серверов соединение может обрываться при проблемах с NAT.

---

**Дата:** 2025-12-31

