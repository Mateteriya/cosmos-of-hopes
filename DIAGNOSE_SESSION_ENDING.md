# Диагностика проблемы: сессия завершается при входе второго участника

## Основные причины (не связанные с именами)

### 1. Конфликт настроек P2P (НАИБОЛЕЕ ВЕРОЯТНО)
В конфигурации есть два блока `p2p` с разными настройками:
- Первый: `p2p: { enabled: true, ... }` (строка ~1090)
- Второй: `p2p: { enabled: false, ... }` (строка ~1915)

Это вызывает конфликт и непредсказуемое поведение.

**Решение:** Удалить первый блок p2p (см. инструкцию ниже)

### 2. Проблема с настройками jicofo (конференц-сервер)
Возможно установлен лимит участников или другие ограничения.

**Проверка на сервере:**
```bash
# Проверить настройки jicofo
cat /etc/jitsi/jicofo/sip-communicator.properties | grep -i participant

# Проверить логи jicofo
journalctl -u jicofo -n 100 | grep -i "participant\|join\|leave"
```

### 3. Проблема с WebRTC/ICE соединением
При переходе с одного участника на двух может происходить переключение с P2P на JVB, что вызывает разрыв.

**Решение:** Отключить P2P полностью (уже сделано во втором блоке)

## Пошаговая диагностика

### Шаг 1: Проверить логи на сервере

```bash
# Логи jicofo (конференц-сервер)
journalctl -u jicofo -n 50 --no-pager

# Логи jitsi-videobridge (видеомост)
journalctl -u jitsi-videobridge2 -n 50 --no-pager

# Логи prosody (XMPP сервер)
journalctl -u prosody -n 50 --no-pager
```

Ищите ошибки при входе второго участника.

### Шаг 2: Проверить настройки jicofo

```bash
# Открыть конфигурацию jicofo
nano /etc/jitsi/jicofo/sip-communicator.properties
```

Проверьте наличие строк:
- `org.jitsi.jicofo.max.participants` - должно быть >= 2 (или отсутствовать)
- `org.jitsi.jicofo.BRIDGE_MUC` - должно быть правильно настроено

### Шаг 3: Исправить конфликт P2P в конфигурации

**Выполните на сервере:**

```bash
# 1. Создать резервную копию
cp /etc/jitsi/meet/meet.super2026.online-config.js /etc/jitsi/meet/meet.super2026.online-config.js.backup3

# 2. Открыть файл
nano /etc/jitsi/meet/meet.super2026.online-config.js
```

**В редакторе:**
1. Найти первый блок `p2p: {` (примерно строка 1090)
2. Удалить ВЕСЬ блок от `p2p: {` до `},` включительно
3. Вставить вместо него:
```javascript
    // P2P настройки перенесены ниже в конфиге (строка ~1915)
    // Первый блок p2p удален, чтобы избежать конфликтов
```

4. Сохранить: `Ctrl+O`, `Enter`, `Ctrl+X`

5. Проверить синтаксис:
```bash
node -c /etc/jitsi/meet/meet.super2026.online-config.js
```

### Шаг 4: Перезапустить сервисы

```bash
systemctl restart jitsi-videobridge2
systemctl restart jicofo
systemctl restart prosody
```

### Шаг 5: Проверить настройки jicofo (если проблема осталась)

```bash
# Открыть конфигурацию
nano /etc/jitsi/jicofo/sip-communicator.properties
```

**Добавить или проверить:**
```properties
# Максимальное количество участников (если нет, добавить)
org.jitsi.jicofo.max.participants=50

# Отключить P2P на уровне jicofo (если нужно)
org.jitsi.jicofo.p2p.enabled=false
```

Сохранить и перезапустить:
```bash
systemctl restart jicofo
```

## Дополнительная диагностика

### Проверить статус всех сервисов

```bash
systemctl status jitsi-videobridge2
systemctl status jicofo
systemctl status prosody
```

Все должны быть `active (running)`.

### Проверить сетевые соединения

```bash
# Проверить порты
netstat -tulpn | grep -E "jitsi|jicofo|prosody"
```

### Проверить конфигурацию nginx (если используется)

```bash
nginx -t
systemctl status nginx
```

## Если ничего не помогает

Попробуйте временно использовать публичный Jitsi сервер для теста:

В файле `.env.local` или переменных окружения:
```
NEXT_PUBLIC_JITSI_SERVER_URL=https://meet.jit.si
```

Если с публичным сервером работает - проблема в конфигурации вашего сервера.
Если не работает - проблема в коде приложения.

