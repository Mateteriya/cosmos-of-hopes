# 🤖 Простой способ: Создать Python скрипт

## Выполните на сервере:

```bash
cd /etc/jitsi/meet

# Создать скрипт через echo (без heredoc)
cat > /tmp/fix_jitsi.py << 'EOF'
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
EOF

# Запустить скрипт
python3 /tmp/fix_jitsi.py
```

---

**Или используйте вариант с редактированием на ПК (проще!)**

---

**Дата:** 2025-12-31

