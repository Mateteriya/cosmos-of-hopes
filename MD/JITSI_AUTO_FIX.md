# 🤖 Автоматическое исправление через команду

## Шаг 1: Восстановить из бэкапа

```bash
cd /etc/jitsi/meet
cp meet.super2026.online-config.js.backup3 meet.super2026.online-config.js
```

Если бэкапа нет, используйте самый ранний:
```bash
cp meet.super2026.online-config.js.backup meet.super2026.online-config.js
```

---

## Шаг 2: Автоматическая вставка через sed

```bash
cd /etc/jitsi/meet

# Найти строку с disableReactions: true (без комментария) и вставить после неё
sed -i '/^[[:space:]]*disableReactions: true$/a\
    ,\
\
    // TURN серверы для стабильного соединения через NAT/firewall\
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
    audioLevelsInterval: 200' meet.super2026.online-config.js
```

**НО!** Эта команда добавит запятую после `disableReactions: true`, а нужно изменить строку.

---

## ✅ ЛУЧШИЙ ВАРИАНТ: Использовать Python скрипт

Создайте временный скрипт:

```bash
cd /etc/jitsi/meet
cat > /tmp/fix_jitsi.py << 'PYTHON_SCRIPT'
#!/usr/bin/env python3
import re

# Читаем файл
with open('meet.super2026.online-config.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Находим строку disableReactions: true (без комментария, перед закрывающей скобкой)
pattern = r'(\s+disableReactions: true)\s*\n(\s*\};)'

replacement = r'''\1,

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
\2'''

new_content = re.sub(pattern, replacement, content)

# Записываем обратно
with open('meet.super2026.online-config.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Готово!")
PYTHON_SCRIPT

python3 /tmp/fix_jitsi.py
```

---

## Проверка

```bash
node -c meet.super2026.online-config.js
```

Если ошибок нет — перезапустите сервисы!

---

**Дата:** 2025-12-31

