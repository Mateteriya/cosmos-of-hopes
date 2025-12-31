# 🔧 СРОЧНО: Исправление синтаксической ошибки

## Проблема
На строке 132: `// disableReactions: true,iceServers: [` - нет переноса строки и пробела.

## Решение: Исправить через sed

Выполните на сервере:

```bash
cd /etc/jitsi/meet
```

### Шаг 1: Исправить строку 132

```bash
sed -i '132s|// disableReactions: true,iceServers: \[|    disableReactions: true,\n\n    // TURN серверы для стабильного соединения через NAT/firewall\n    iceServers: \[|' meet.super2026.online-config.js
```

Это может не сработать из-за многострочности. Лучше вручную.

---

## ✅ РЕКОМЕНДУЕМЫЙ СПОСОБ: Вручную через nano

```bash
nano meet.super2026.online-config.js
```

1. Нажмите `Ctrl+W` (поиск)
2. Введите: `disableReactions: true,iceServers`
3. Нажмите `Enter`

Вы найдете строку:
```javascript
// disableReactions: true,iceServers: [
```

4. **Удалите эту строку полностью** (Ctrl+K для удаления строки)

5. Найдите строку с `disableReactions: true` (без комментария, ближе к концу файла, около строки 1900+)

6. Измените:
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

