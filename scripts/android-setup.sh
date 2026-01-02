#!/bin/bash

# Скрипт автоматической настройки сервера на Android планшете через Termux
# Использование: запустить в Termux после установки базовых пакетов

echo "🚀 Настройка сервера Вселенная Желаний на Android планшете"
echo "============================================================"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка, что мы в Termux
if [ ! -d "$HOME/.termux" ]; then
    echo -e "${RED}❌ Ошибка: Скрипт должен запускаться в Termux${NC}"
    exit 1
fi

# Шаг 1: Обновление пакетов
echo -e "${YELLOW}📦 Шаг 1: Обновление пакетов...${NC}"
pkg update -y && pkg upgrade -y

# Шаг 2: Установка необходимых пакетов
echo -e "${YELLOW}📦 Шаг 2: Установка Node.js и необходимых инструментов...${NC}"
pkg install -y nodejs npm git curl wget cronie nano

# Проверка версии Node.js
NODE_VERSION=$(node --version 2>/dev/null)
if [ -z "$NODE_VERSION" ]; then
    echo -e "${RED}❌ Ошибка: Node.js не установлен${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js установлен: $NODE_VERSION${NC}"

# Шаг 3: Создание директории проекта
echo -e "${YELLOW}📁 Шаг 3: Подготовка директории проекта...${NC}"
PROJECT_DIR="$HOME/cosmos-of-hopes"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Шаг 4: Создание скрипта автозапуска
echo -e "${YELLOW}📝 Шаг 4: Создание скрипта автозапуска...${NC}"
cat > "$HOME/start-server.sh" << 'EOF'
#!/bin/bash

# Переход в директорию проекта
cd ~/cosmos-of-hopes

# Проверка, запущен ли уже сервер
if pgrep -f "next start" > /dev/null; then
    echo "$(date): Сервер уже запущен" >> ~/server.log
    exit 0
fi

# Проверка наличия .next директории
if [ ! -d ".next" ]; then
    echo "$(date): Ошибка: приложение не собрано. Запустите: npm run build" >> ~/server.log
    exit 1
fi

# Запуск сервера
echo "$(date): Запуск сервера..." >> ~/server.log
npm start >> ~/server.log 2>&1 &

# Сохранение PID
echo $! > ~/server.pid
echo "$(date): Сервер запущен, PID: $!" >> ~/server.log
EOF

chmod +x "$HOME/start-server.sh"
echo -e "${GREEN}✅ Скрипт автозапуска создан${NC}"

# Шаг 5: Создание скрипта мониторинга
echo -e "${YELLOW}📝 Шаг 5: Создание скрипта мониторинга...${NC}"
cat > "$HOME/monitor-server.sh" << 'EOF'
#!/bin/bash

cd ~/cosmos-of-hopes

# Проверка доступности сервера
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "$(date): Сервер не отвечает, перезапускаю..." >> ~/server-monitor.log
    
    # Убить старый процесс если есть
    if [ -f ~/server.pid ]; then
        PID=$(cat ~/server.pid)
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID" 2>/dev/null
        fi
        rm ~/server.pid
    fi
    
    # Убить все процессы next
    pkill -f "next start" 2>/dev/null
    
    # Небольшая задержка
    sleep 2
    
    # Запустить заново
    ~/start-server.sh
fi
EOF

chmod +x "$HOME/monitor-server.sh"
echo -e "${GREEN}✅ Скрипт мониторинга создан${NC}"

# Шаг 6: Создание скрипта резервного копирования
echo -e "${YELLOW}📝 Шаг 6: Создание скрипта резервного копирования...${NC}"
cat > "$HOME/backup-server.sh" << 'EOF'
#!/bin/bash

BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)

# Создать директорию для бэкапов
mkdir -p "$BACKUP_DIR"

# Бэкап проекта (только важные файлы)
if [ -d ~/cosmos-of-hopes ]; then
    cd ~/cosmos-of-hopes
    tar -czf "$BACKUP_DIR/cosmos-backup-$DATE.tar.gz" \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='.git' \
        . 2>/dev/null
    
    # Бэкап конфигурации
    if [ -f .env.local ]; then
        cp .env.local "$BACKUP_DIR/env-$DATE.txt"
    fi
    
    echo "$(date): Бэкап создан: cosmos-backup-$DATE.tar.gz" >> ~/backup.log
fi

# Удалить старые бэкапы (оставить последние 7)
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete 2>/dev/null
find "$BACKUP_DIR" -name "env-*.txt" -mtime +7 -delete 2>/dev/null
EOF

chmod +x "$HOME/backup-server.sh"
echo -e "${GREEN}✅ Скрипт резервного копирования создан${NC}"

# Шаг 7: Настройка автозапуска через .bashrc
echo -e "${YELLOW}📝 Шаг 7: Настройка автозапуска...${NC}"
if ! grep -q "start-server.sh" ~/.bashrc 2>/dev/null; then
    cat >> ~/.bashrc << 'EOF'

# Автозапуск сервера Вселенная Желаний
if [ -f ~/start-server.sh ] && [ ! -f ~/server.pid ] || ! pgrep -F ~/server.pid > /dev/null 2>&1; then
    ~/start-server.sh
fi
EOF
    echo -e "${GREEN}✅ Автозапуск настроен в .bashrc${NC}"
else
    echo -e "${YELLOW}⚠️  Автозапуск уже настроен в .bashrc${NC}"
fi

# Шаг 8: Настройка cron для мониторинга
echo -e "${YELLOW}📝 Шаг 8: Настройка автоматического мониторинга...${NC}"
# Проверка, не добавлена ли уже задача
if ! crontab -l 2>/dev/null | grep -q "monitor-server.sh"; then
    (crontab -l 2>/dev/null; echo "*/5 * * * * ~/monitor-server.sh") | crontab -
    echo -e "${GREEN}✅ Мониторинг настроен (проверка каждые 5 минут)${NC}"
else
    echo -e "${YELLOW}⚠️  Мониторинг уже настроен${NC}"
fi

# Настройка ежедневного бэкапа в 3:00
if ! crontab -l 2>/dev/null | grep -q "backup-server.sh"; then
    (crontab -l 2>/dev/null; echo "0 3 * * * ~/backup-server.sh") | crontab -
    echo -e "${GREEN}✅ Ежедневный бэкап настроен (3:00)${NC}"
fi

# Шаг 9: Создание инструкции по настройке .env.local
echo -e "${YELLOW}📝 Шаг 9: Создание шаблона конфигурации...${NC}"
if [ ! -f "$PROJECT_DIR/.env.local" ]; then
    cat > "$PROJECT_DIR/.env.local.example" << 'EOF'
# Конфигурация сервера Вселенная Желаний
# Скопируйте этот файл в .env.local и заполните значения

# Supabase настройки
NEXT_PUBLIC_SUPABASE_URL=ваш_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_anon_key

# URL приложения (IP планшета или домен)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Jitsi сервер (можно оставить по умолчанию)
NEXT_PUBLIC_JITSI_SERVER_URL=https://meet.jit.si

# Порт сервера
PORT=3000
EOF
    echo -e "${GREEN}✅ Шаблон конфигурации создан: .env.local.example${NC}"
    echo -e "${YELLOW}⚠️  ВАЖНО: Скопируйте .env.local.example в .env.local и заполните значения!${NC}"
fi

# Итоговая информация
echo ""
echo -e "${GREEN}============================================================"
echo "✅ Настройка завершена!"
echo "============================================================${NC}"
echo ""
echo "📋 Следующие шаги:"
echo ""
echo "1. Скопируйте проект в ~/cosmos-of-hopes/"
echo "   (через git clone или USB OTG)"
echo ""
echo "2. Настройте конфигурацию:"
echo "   cd ~/cosmos-of-hopes"
echo "   cp .env.local.example .env.local"
echo "   nano .env.local"
echo ""
echo "3. Установите зависимости:"
echo "   npm install"
echo ""
echo "4. Соберите приложение:"
echo "   npm run build"
echo ""
echo "5. Запустите сервер:"
echo "   npm start"
echo "   или"
echo "   ~/start-server.sh"
echo ""
echo "📊 Полезные команды:"
echo "   - Просмотр логов: tail -f ~/server.log"
echo "   - Проверка статуса: ps aux | grep node"
echo "   - Остановка: pkill -f 'next start'"
echo "   - Ручной бэкап: ~/backup-server.sh"
echo ""
echo "⚠️  НЕ ЗАБУДЬТЕ:"
echo "   - Отключить оптимизацию батареи для Termux"
echo "   - Настроить постоянную зарядку"
echo "   - Настроить доступ извне (туннель/VPS)"
echo ""

