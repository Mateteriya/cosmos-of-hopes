# Инструкция по исправлению файла на сервере

## Способ 1: Удалить проблемные строки через sed

Выполните на сервере (после подключения через SSH):

```bash
# Создать резервную копию
cp /etc/jitsi/meet/meet.super2026.online-config.js /etc/jitsi/meet/meet.super2026.online-config.js.backup

# Удалить дублирующиеся строки 1967-1980
sed -i '1967,1980d' /etc/jitsi/meet/meet.super2026.online-config.js

# Проверить синтаксис
node -c /etc/jitsi/meet/meet.super2026.online-config.js
```

## Способ 2: Редактировать файл вручную через nano

```bash
# Открыть файл в редакторе
nano /etc/jitsi/meet/meet.super2026.online-config.js

# Найти строку 1977 (Ctrl+_ для поиска номера строки)
# Удалить строки с 1967 по 1980 (включительно)
# Сохранить: Ctrl+O, Enter
# Выйти: Ctrl+X
```

## Способ 3: Скопировать файл с компьютера на сервер

Если у вас есть доступ к серверу по SSH, выполните на вашем компьютере (Windows PowerShell):

```powershell
# Перейти в папку проекта
cd C:\Projects\NewDreamer

# Скопировать файл на сервер
scp cosmos-of-hopes\jitsi-config.js root@6273893-hn621323:/etc/jitsi/meet/meet.super2026.online-config.js
```

## После исправления

Проверьте синтаксис:
```bash
node -c /etc/jitsi/meet/meet.super2026.online-config.js
```

Если ошибок нет, перезапустите Jitsi (если нужно):
```bash
systemctl restart jitsi-videobridge2
systemctl restart prosody
```

