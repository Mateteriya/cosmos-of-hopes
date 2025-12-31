# 🔧 Исправление проблем со звуком и отключениями в Jitsi

## Проблемы
1. ❌ Нет звука в видеозвонках
2. ❌ Отключение каждые 30-49 секунд
3. ⚠️ Endpoints истекают (expire) в логах

## Причина
- Отсутствуют TURN серверы (нужны для обхода NAT/firewall)
- Недостаточные настройки аудио
- Таймауты ICE слишком короткие

---

## ✅ Решение: Добавление TURN серверов и улучшение настроек

### Шаг 1: Добавить TURN серверы в config.js

Выполните на сервере:

```bash
cd /etc/jitsi/meet
cp meet.super2026.online-config.js meet.super2026.online-config.js.backup2
```

### Шаг 2: Добавить конфигурацию TURN и улучшить аудио

Найдите в файле `meet.super2026.online-config.js` блок с настройками `p2p` (если есть) или добавьте перед закрывающей скобкой `};`:

```bash
sed -i '/^};$/i\
    // TURN серверы для стабильного соединения через NAT/firewall\
    p2p: {\
        enabled: false,\
        stunServers: [\
            { urls: "stun:stun.l.google.com:19302" },\
            { urls: "stun:stun1.l.google.com:19302" }\
        ],\
        iceTransportPolicy: "all"\
    },\
    // TURN серверы (публичные бесплатные)\
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
    // Увеличенные таймауты для ICE\
    iceConnectionTimeout: 30000,\
    iceGatheringTimeout: 10000,\
' meet.super2026.online-config.js
```

**⚠️ ВАЖНО:** Эта команда может не сработать из-за сложности вставки. Лучше отредактировать вручную.

### Шаг 3: Ручное редактирование (РЕКОМЕНДУЕТСЯ)

```bash
nano meet.super2026.online-config.js
```

Найдите строку с `// File sharign service.` (примерно строка 1900) и **ПЕРЕД** закрывающей скобкой `};` добавьте:

```javascript
    // TURN серверы для стабильного соединения через NAT/firewall
    p2p: {
        enabled: false,
        stunServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
        ],
        iceTransportPolicy: "all"
    },
    // TURN серверы (публичные бесплатные)
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
    // Увеличенные таймауты для ICE
    iceConnectionTimeout: 30000,
    iceGatheringTimeout: 10000,
```

**Сохраните:** `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 4: Проверить синтаксис

```bash
node -c meet.super2026.online-config.js
```

Если ошибок нет, продолжайте. Если есть ошибки — проверьте запятые и скобки.

### Шаг 5: Перезапустить сервисы

```bash
systemctl restart jitsi-videobridge2
systemctl restart prosody
systemctl restart jicofo
systemctl reload nginx
```

### Шаг 6: Проверить статус

```bash
systemctl status jitsi-videobridge2
systemctl status prosody
systemctl status jicofo
```

---

## 🔍 Альтернатива: Использовать свой TURN сервер (опционально)

Если публичные TURN серверы не подходят, можно установить свой:

```bash
apt install -y coturn
```

Но это требует дополнительной настройки. Пока используем публичные.

---

## 📝 Проверка после изменений

1. Откройте видеозвонок
2. Проверьте звук
3. Проверьте стабильность соединения (не должно отключаться каждые 30-49 секунд)

---

**Дата:** 2025-12-31

