# 🔧 Исправление проблем с Jitsi: обрывы связи и отсутствие аудио

## Проблемы:
1. Связь обрывается каждые 15 секунд
2. Участники не слышат друг друга (разрешения даны)
3. Плейсхолдер Jitsi все еще появляется
4. Панель с эмодзи перекрывает настройки

## Решение на сервере Jitsi:

### 1. Проверка и настройка TURN/STUN серверов

```bash
# Отредактировать конфигурацию Jitsi
nano /etc/jitsi/videobridge/config
```

Добавить или изменить:
```properties
# TURN серверы для стабильного соединения
JVB_OPTS="--apis=rest,xmpp --host=localhost --domain=meet.super2026.online --port=5347 --secret=YOUR_SECRET --min-port=10000 --max-port=20000"
```

### 2. Настройка конфигурации Jitsi Meet

```bash
nano /etc/jitsi/meet/meet.super2026.online-config.js
```

Добавить:
```javascript
var config = {
    // ... существующие настройки ...
    
    // Отключение P2P для стабильности
    p2p: {
        enabled: false,
        stunServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    },
    
    // Настройки ICE для стабильного соединения
    iceTransportPolicy: 'all',
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        },
        {
            urls: 'stun:stun1.l.google.com:19302'
        }
    ],
    
    // Отключение плейсхолдера
    prejoinPageEnabled: false,
    enableWelcomePage: false,
    
    // Настройки аудио
    enableNoAudioDetection: true,
    enableNoisyMicDetection: true,
    audioLevelsInterval: 200,
    
    // Настройки видео
    channelLastN: 10,
    startWithVideoMuted: false,
    startWithAudioMuted: false,
    
    // Отключение глубоких ссылок
    disableDeepLinking: true,
    disableInviteFunctions: true,
    disableThirdPartyRequests: true,
};
```

### 3. Настройка интерфейса (отключение реакций)

```bash
nano /etc/jitsi/meet/meet.super2026.online-interface_config.js
```

Добавить:
```javascript
var interfaceConfig = {
    // ... существующие настройки ...
    
    // Отключение реакций (эмодзи)
    DISABLE_REACTIONS: true,
    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
    DISABLE_PRESENCE_STATUS: true,
    
    // Убираем кнопку "поднять руку" из тулбара
    TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'closedcaptions', 'desktop',
        'fullscreen', 'fodeviceselection', 'hangup', 'profile',
        'chat', 'recording', 'livestreaming', 'settings',
        'videoquality', 'filmstrip', 'invite', 'feedback',
        'stats', 'shortcuts', 'tileview', 'videobackgroundblur',
        'download', 'help', 'mute-everyone', 'security'
        // УБРАЛИ: 'raisehand' - вызывает панель с эмодзи
    ],
};
```

### 4. Перезапуск сервисов

```bash
# Перезапустить Jitsi Videobridge
systemctl restart jitsi-videobridge2

# Перезапустить Prosody (XMPP сервер)
systemctl restart prosody

# Перезапустить Jicofo
systemctl restart jicofo

# Перезагрузить Nginx
systemctl reload nginx
```

### 5. Проверка логов (если проблемы продолжаются)

```bash
# Логи Videobridge
tail -f /var/log/jitsi/jvb.log

# Логи Jicofo
tail -f /var/log/jitsi/jicofo.log

# Логи Prosody
tail -f /var/log/prosody/prosody.log
```

## Альтернативное решение: Использование публичного TURN сервера

Если проблемы продолжаются, можно использовать публичный TURN сервер:

```javascript
iceServers: [
    {
        urls: 'stun:stun.l.google.com:19302'
    },
    {
        urls: 'turn:numb.viagenie.ca',
        credential: 'muazkh',
        username: 'webrtc@live.com'
    }
]
```

## Проверка после настройки:

1. Откройте комнату на мобильном и ПК
2. Проверьте, что плейсхолдер не появляется
3. Проверьте, что аудио работает
4. Проверьте, что соединение стабильное (не обрывается)
5. Проверьте, что панель с эмодзи не появляется при открытии настроек

---

**Важно:** После изменений конфигурации обязательно перезапустите все сервисы Jitsi!

