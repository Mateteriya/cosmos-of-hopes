# Исправление проблемы с завершением сессии при входе второго участника

## Обнаруженные проблемы

1. **Отсутствует файл конфигурации jicofo** - `/etc/jitsi/jicofo/sip-communicator.properties`
2. **Зависшие процессы Java** после перезапуска jicofo
3. **Нужно проверить реальные логи приложений** (не systemd)

## Шаг 1: Проверить реальные логи jicofo

```bash
# Проверить логи jicofo (реальные логи приложения, не systemd)
tail -100 /var/log/jitsi/jicofo.log

# Или если файл в другом месте
find /var/log -name "*jicofo*" -type f 2>/dev/null
```

## Шаг 2: Проверить логи prosody (XMPP сервер)

```bash
# Логи prosody
tail -100 /var/log/prosody/prosody.log

# Или
journalctl -u prosody -n 100 --no-pager | grep -i "join\|leave\|participant\|error"
```

## Шаг 3: Убить зависшие процессы Java

```bash
# Найти все процессы Java от jicofo
ps aux | grep -i jicofo | grep java

# Убить зависшие процессы (если есть)
pkill -f jicofo

# Перезапустить jicofo
systemctl restart jicofo
```

## Шаг 4: Создать конфигурацию jicofo

```bash
# Проверить существует ли директория
ls -la /etc/jitsi/jicofo/

# Если директории нет, создать
mkdir -p /etc/jitsi/jicofo

# Создать файл конфигурации
cat > /etc/jitsi/jicofo/sip-communicator.properties << 'EOF'
# Максимальное количество участников (если не указано, по умолчанию неограничено)
org.jitsi.jicofo.max.participants=50

# Отключить P2P на уровне jicofo (использовать только JVB)
org.jitsi.jicofo.p2p.enabled=false

# Настройки видеомоста
org.jitsi.jicofo.BRIDGE_MUC=JvbBrewery@internal.auth.meet.super2026.online

# Домены
org.jitsi.jicofo.xmpp.domain=meet.super2026.online
org.jitsi.jicofo.xmpp.service.xmpp.domain=meet.super2026.online
org.jitsi.jicofo.xmpp.service.xmpp.server=localhost
org.jitsi.jicofo.xmpp.service.xmpp.port=5347
org.jitsi.jicofo.xmpp.service.xmpp.serviceName=focus
org.jitsi.jicofo.xmpp.service.xmpp.username=focus
org.jitsi.jicofo.xmpp.service.xmpp.password=ВАШ_ПАРОЛЬ_FOCUS

# Настройки безопасности
org.jitsi.jicofo.xmpp.service.xmpp.disable_certificate_verification=false
EOF
```

**ВАЖНО:** Нужно узнать пароль для focus пользователя. Проверьте:

```bash
# Проверить пароль focus в prosody
cat /etc/prosody/conf.d/meet.super2026.online.cfg.lua | grep -i focus
```

Или проверьте файл с паролями:
```bash
cat /etc/jitsi/jicofo/config | grep -i password
```

## Шаг 5: Исправить конфликт P2P в конфигурации

Удалить первый блок `p2p` из `/etc/jitsi/meet/meet.super2026.online-config.js` (как описано ранее).

## Шаг 6: Перезапустить все сервисы

```bash
# Убить зависшие процессы
pkill -f jicofo
pkill -f jitsi-videobridge

# Перезапустить сервисы
systemctl restart prosody
systemctl restart jitsi-videobridge2
systemctl restart jicofo

# Проверить статус
systemctl status prosody
systemctl status jitsi-videobridge2
systemctl status jicofo
```

## Шаг 7: Проверить логи в реальном времени

Откройте два терминала и выполните:

**Терминал 1:**
```bash
tail -f /var/log/jitsi/jicofo.log
```

**Терминал 2:**
```bash
tail -f /var/log/prosody/prosody.log
```

Затем попробуйте зайти с двух устройств и смотрите, что появляется в логах при входе второго участника.

## Альтернативное решение: Проверить настройки prosody

Возможно проблема в конфигурации prosody. Проверьте:

```bash
# Проверить конфигурацию prosody
cat /etc/prosody/conf.d/meet.super2026.online.cfg.lua

# Проверить настройки MUC (Multi-User Chat)
grep -i "muc\|conference" /etc/prosody/conf.d/meet.super2026.online.cfg.lua
```

## Если ничего не помогает

Попробуйте временно использовать публичный Jitsi сервер для теста:

В коде приложения измените:
```typescript
const jitsiServerUrl = 'https://meet.jit.si'; // Временно для теста
```

Если с публичным сервером работает - проблема точно в конфигурации вашего сервера.

