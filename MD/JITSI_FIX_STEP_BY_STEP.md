# 🔧 Пошаговая инструкция: Исправление звука и отключений

## Проблемы
- ❌ Нет звука
- ❌ Отключение каждые 30-49 секунд

---

## 📋 Шаг 1: Просмотреть конец файла конфигурации

```bash
cd /etc/jitsi/meet
tail -n 20 meet.super2026.online-config.js
```

Вы должны увидеть что-то вроде:
```javascript
    // },
};

// Set the default values for JaaS customers
if (enableJaaS) {
    ...
}
```

---

## 📋 Шаг 2: Создать резервную копию

```bash
cp meet.super2026.online-config.js meet.super2026.online-config.js.backup3
```

---

## 📋 Шаг 3: Открыть файл для редактирования

```bash
nano meet.super2026.online-config.js
```

---

## 📋 Шаг 4: Найти место для вставки

Нажмите `Ctrl+W` (поиск) и введите: `File sharign service`

Прокрутите вниз до строки с `};` (это закрывающая скобка объекта `config`).

**ВАЖНО:** Найдите строку **ПЕРЕД** `};` (которая находится перед `if (enableJaaS)`).

---

## 📋 Шаг 5: Добавить код

**ПЕРЕД** строкой `};` (но **ПОСЛЕ** последнего свойства объекта `config`) добавьте:

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

**⚠️ ВАЖНО:** 
- Убедитесь, что перед `iceServers` есть запятая после предыдущего свойства!
- После `audioLevelsInterval: 200,` тоже должна быть запятая!

Пример правильного расположения:
```javascript
    // File sharign service.
    // fileSharing: {
    //     ...
    // },
    
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
};
```

---

## 📋 Шаг 6: Сохранить файл

- `Ctrl+O` (сохранить)
- `Enter` (подтвердить имя файла)
- `Ctrl+X` (выйти)

---

## 📋 Шаг 7: Проверить синтаксис

```bash
node -c meet.super2026.online-config.js
```

Если ошибок нет — вы увидите пустой вывод. Если есть ошибки — исправьте их.

---

## 📋 Шаг 8: Перезапустить сервисы

```bash
systemctl restart jitsi-videobridge2
systemctl restart prosody
systemctl restart jicofo
systemctl reload nginx
```

---

## 📋 Шаг 9: Проверить статус

```bash
systemctl status jitsi-videobridge2 | head -n 10
```

Должно быть `active (running)`.

---

## 📋 Шаг 10: Протестировать

1. Откройте видеозвонок
2. Проверьте звук
3. Проверьте стабильность (не должно отключаться каждые 30-49 секунд)

---

**Дата:** 2025-12-31

