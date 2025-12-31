# 💻 Редактирование файла на ПК (проще!)

## Шаг 1: Скачать файл с сервера на ПК

На сервере выполните:

```bash
cd /etc/jitsi/meet
cat meet.super2026.online-config.js > /tmp/jitsi-config.js
chmod 644 /tmp/jitsi-config.js
```

Затем на ПК (в PowerShell или терминале):

```bash
# Если у вас есть scp (через Git Bash или WSL)
scp root@5.129.223.23:/tmp/jitsi-config.js ./jitsi-config.js

# Или используйте WinSCP, FileZilla или другой SFTP клиент
# Скачайте файл: /tmp/jitsi-config.js
```

---

## Шаг 2: Отредактировать на ПК

1. Откройте файл `jitsi-config.js` в любом текстовом редакторе (Notepad++, VS Code, etc.)

2. Найдите строку (Ctrl+F):
```javascript
    disableReactions: true
};
```

3. Измените на:
```javascript
    disableReactions: true,

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
    audioLevelsInterval: 200
};
```

4. Сохраните файл

---

## Шаг 3: Загрузить обратно на сервер

На ПК:

```bash
# Если у вас есть scp
scp ./jitsi-config.js root@5.129.223.23:/tmp/jitsi-config.js
```

Или через WinSCP/FileZilla загрузите файл в `/tmp/jitsi-config.js`

---

## Шаг 4: На сервере - заменить файл

```bash
cd /etc/jitsi/meet
cp meet.super2026.online-config.js meet.super2026.online-config.js.backup5
cp /tmp/jitsi-config.js meet.super2026.online-config.js
chmod 644 meet.super2026.online-config.js
chown root:www-data meet.super2026.online-config.js
```

---

## Шаг 5: Проверить синтаксис

```bash
node -c meet.super2026.online-config.js
```

Если ошибок нет — перезапустите сервисы!

---

**Дата:** 2025-12-31

