# 🔧 Исправление: Код вставлен в неправильное место

## Проблема
Код `iceServers` вставлен после комментария `// Disables the reactions feature.` (строка ~131), а не в конце объекта `config`.

## Решение: Удалить неправильный код и вставить в правильное место

### Шаг 1: Удалить неправильно вставленный код

```bash
cd /etc/jitsi/meet
nano meet.super2026.online-config.js
```

1. Нажмите `Ctrl+W` (поиск)
2. Введите: `Disables the reactions feature`
3. Нажмите `Enter`

4. Найдите строку:
```javascript
    // Disables the reactions feature.
        { urls: "stun:stun.l.google.com:19302" },
```

5. **Удалите ВСЕ строки от `// Disables the reactions feature.` до `audioLevelsInterval: 200` включительно:**
   - Поставьте курсор на строку `// Disables the reactions feature.`
   - Нажмите `Ctrl+K` несколько раз, чтобы удалить все строки до `audioLevelsInterval: 200`
   - Удалите также строку `};` если она там есть

6. Должно остаться:
```javascript
    // Disables moderator indicators.
    // disableModeratorIndicator: false,

    // Disables the reactions moderation feature.
    // disableReactionsModeration: false,
```

### Шаг 2: Найти правильное место (в конце файла)

1. Нажмите `Ctrl+W` (поиск)
2. Введите: `disableReactions: true`
3. Нажмите `Enter` несколько раз, пока не найдете строку БЕЗ `//` (не закомментированную)

4. Должна быть строка примерно такая:
```javascript
    disableReactions: true
};
```

### Шаг 3: Вставить код правильно

Измените:
```javascript
    disableReactions: true
};
```

На:
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

7. Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## Проверка

```bash
node -c meet.super2026.online-config.js
```

Если ошибок нет — перезапустите сервисы.

---

**Дата:** 2025-12-31

