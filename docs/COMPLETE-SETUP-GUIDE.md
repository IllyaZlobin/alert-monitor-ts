# 🚀 Повний довідник по Setup та Deployment

## 📋 Зміст
- [SSH налаштування](#-ssh-налаштування)
- [Hetzner Server Setup](#-hetzner-server-setup)
- [Docker Configuration](#-docker-configuration)
- [Deployment Commands](#-deployment-commands)
- [Troubleshooting](#-troubleshooting)
- [Моніторинг і налагодження](#-моніторинг-і-налагодження)
- [GitHub Actions](#-github-actions)
- [Корисні команди](#-корисні-команди)

---

## 🔐 SSH налаштування

### **Перевірка існуючих SSH ключів:**
```bash
# Перегляд всіх SSH ключів
ls -la ~/.ssh/

# Перегляд публічного ключа
cat ~/.ssh/hetzner.pub
```

### **SSH Config для зручності:**
Додайте до `~/.ssh/config`:
```bash
# Hetzner Server Configuration
Host hetzner
    HostName 91.98.113.79
    User root
    IdentityFile ~/.ssh/hetzner
    IdentitiesOnly yes
    
Host hetzner-deploy
    HostName 91.98.113.79
    User deployer
    IdentityFile ~/.ssh/hetzner
    IdentitiesOnly yes
```

### **Корисні SSH команди:**
```bash
# Підключення до сервера
ssh hetzner              # Як root
ssh hetzner-deploy       # Як deployer

# Копіювання файлів
scp file.txt hetzner:~/
scp -r folder/ hetzner-deploy:/opt/alert-monitor/

# Запуск команд віддалено
ssh hetzner "docker --version"
ssh hetzner-deploy "ls -la /opt/alert-monitor/"

# Тестування SSH з verbose режимом
ssh -v hetzner "echo 'Connection test'"
```

---

## 🏗️ Hetzner Server Setup

### **Початкове налаштування сервера:**
```bash
# 1. Копіюємо скрипт на сервер
scp -i ~/.ssh/hetzner scripts/setup-server.sh root@91.98.113.79:~/

# 2. Створюємо deployer користувача (від root)
ssh hetzner "
useradd -m -s /bin/bash deployer
usermod -aG sudo deployer
mkdir -p /home/deployer/.ssh
cp ~/.ssh/authorized_keys /home/deployer/.ssh/
chown -R deployer:deployer /home/deployer/.ssh
chmod 700 /home/deployer/.ssh
chmod 600 /home/deployer/.ssh/authorized_keys
echo 'deployer ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/deployer
"

# 3. Копіюємо і запускаємо setup скрипт від deployer
scp -i ~/.ssh/hetzner scripts/setup-server.sh deployer@91.98.113.79:~/
ssh hetzner-deploy "chmod +x ~/setup-server.sh && ~/setup-server.sh"

# 4. Перезавантажуємо сервер
ssh hetzner-deploy "sudo reboot"
```

### **Перевірка стану сервера після setup:**
```bash
ssh hetzner-deploy "
echo '=== System Info ==='
echo 'Kernel:' \$(uname -r)
echo 'Uptime:' \$(uptime)

echo '=== Service Status ==='
sudo systemctl is-active docker fail2ban ufw

echo '=== Docker Info ==='
docker --version
docker-compose --version

echo '=== Firewall Status ==='
sudo ufw status

echo '=== Application Directory ==='
ls -la /opt/alert-monitor/
"
```

---

## 🐳 Docker Configuration

### **Infrastructure Setup (PostgreSQL + Redis):**
```bash
# Копіювання конфігурацій на сервер
scp -r config/ docker-compose.infrastructure.yml hetzner-deploy:/opt/alert-monitor/

# Створення .env.production (з реальними паролями!)
ssh hetzner-deploy "cd /opt/alert-monitor && cat > .env.production << 'EOF'
APP_PORT=3000
APP_ENV=production
NODE_ENV=production
DATABASE_HOST=alert-monitor-postgres
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_secure_postgres_password_here
DATABASE_NAME=alert_bot
REDIS_USERNAME=alertapp
REDIS_PASSWORD=your_secure_redis_password_here
BOT_TOKEN=your_telegram_bot_token_here
PUBLIC_ALERT_GROUP_URL=your_group_url_here
APP_VERSION=v1.0.0
EOF"

# Деплой інфраструктури
ssh hetzner-deploy "cd /opt/alert-monitor && ./scripts/deploy-infrastructure.sh"
```

### **Application Deployment:**
```bash
# Копіювання application конфігурацій
scp docker-compose.prod.yml scripts/deploy-application.sh hetzner-deploy:/opt/alert-monitor/

# Деплой застосунку
ssh hetzner-deploy "cd /opt/alert-monitor && ./scripts/deploy-application.sh v1.0.0"
```

---

## 🚀 Deployment Commands

### **Основні команди деплою:**

**1. Перший деплой (з інфраструктурою):**
```bash
# Через GitHub Actions Manual Workflow:
# 1. Йти в Actions → Manual Operations
# 2. Обрати "deploy-infrastructure"
# 3. Встановити version: v1.0.0

# Або вручну:
cd /opt/alert-monitor
./scripts/deploy-infrastructure.sh
./scripts/deploy-application.sh v1.0.0
```

**2. Звичайний деплой (тільки застосунок):**
```bash
# Автоматично - просто push в main branch!
git push origin main

# Або вручну:
ssh hetzner-deploy "cd /opt/alert-monitor && ./scripts/deploy-application.sh v1.0.1"
```

**3. Перезапуск застосунку:**
```bash
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml restart app"
```

**4. Перегляд логів:**
```bash
# Application logs
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml logs -f app"

# Infrastructure logs
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.infrastructure.yml logs postgres redis"
```

---

## 🔧 Troubleshooting

### **Діагностика проблем:**

**Перевірка контейнерів:**
```bash
ssh hetzner-deploy "
# Статус всіх контейнерів
docker ps -a

# Статус alert-monitor контейнерів
docker ps --filter 'name=alert-monitor'

# Ресурси контейнерів
docker stats --no-stream
"
```

**Перевірка мережі:**
```bash
ssh hetzner-deploy "
# Docker networks
docker network ls

# Перевірка мережі alert-monitor
docker network inspect alert-monitor-network
"
```

**Перевірка здоров'я сервісів:**
```bash
# Application health
curl http://91.98.113.79:3000/api/health

# PostgreSQL connection
ssh hetzner-deploy "docker exec alert-monitor-postgres pg_isready -U postgres"

# Redis connection
ssh hetzner-deploy "docker exec alert-monitor-redis redis-cli -a \$REDIS_PASSWORD ping"
```

**Перевірка дискового простору:**
```bash
ssh hetzner-deploy "
# Загальне використання диску
df -h

# Docker використання
docker system df

# /opt/alert-monitor використання
du -sh /opt/alert-monitor/*
"
```

---

## 📊 Моніторинг і налагодження

### **Моніторинг контейнерів:**
```bash
# Запуск ctop для real-time моніторингу
ssh hetzner-deploy "ctop"

# Простий htop для системних ресурсів
ssh hetzner-deploy "htop"

# Docker stats
ssh hetzner-deploy "docker stats"
```

### **Логи та налагодження:**
```bash
# Real-time application logs
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml logs -f --tail=100 app"

# PostgreSQL logs
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.infrastructure.yml logs --tail=50 postgres"

# Redis logs
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.infrastructure.yml logs --tail=50 redis"

# System logs
ssh hetzner-deploy "journalctl -u docker.service -f"
```

### **Backup та відновлення:**
```bash
# PostgreSQL backup
ssh hetzner-deploy "
cd /opt/alert-monitor
docker exec alert-monitor-postgres pg_dump -U postgres alert_bot > backups/backup-\$(date +%Y%m%d_%H%M%S).sql
"

# Redis backup
ssh hetzner-deploy "
cd /opt/alert-monitor
docker exec alert-monitor-redis redis-cli -a \$REDIS_PASSWORD BGSAVE
docker cp alert-monitor-redis:/data/dump.rdb backups/redis-backup-\$(date +%Y%m%d_%H%M%S).rdb
"

# List backups
ssh hetzner-deploy "ls -la /opt/alert-monitor/backups/"
```

---

## ⚙️ GitHub Actions

### **Налаштування GitHub Secrets:**

**У GitHub Repository → Settings → Secrets and variables → Actions:**

```bash
# Server connection
HETZNER_SERVER_IP = 91.98.113.79
HETZNER_SSH_KEY = [вміст приватного ключа ~/.ssh/hetzner]

# Database credentials
DB_USERNAME = postgres
DB_PASSWORD = [secure password]
DB_NAME = alert_bot

# Redis credentials
REDIS_USERNAME = alertapp
REDIS_PASSWORD = [secure Redis password]

# Application secrets
BOT_TOKEN = [Telegram bot token]
PUBLIC_ALERT_GROUP_URL = [Telegram group URL]
```

### **Доступні Workflows:**

**1. Автоматичний деплой (`deploy.yml`):**
- Тригер: push в main branch
- Дії: Build → Test → Docker Build → Deploy → Migrate → Health Check

**2. Manual Operations (`manual-deploy.yml`):**
- deploy-infrastructure
- deploy-application
- restart-application
- run-migrations
- cleanup-docker
- show-logs
- health-check

### **Використання:**
```bash
# Автоматичний деплой
git add .
git commit -m "Update application"
git push origin main

# Manual workflow через GitHub UI:
# Actions → Manual Operations → Run workflow → Select action
```

---

## 🛠️ Корисні команди

### **Docker управління:**
```bash
# Restart всіх сервісів
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml restart"

# Оновити образ та restart
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d"

# Очистити старі образи
ssh hetzner-deploy "docker image prune -f"

# Очистити все (обережно!)
ssh hetzner-deploy "docker system prune -f"
```

### **Database управління:**
```bash
# Підключення до PostgreSQL
ssh hetzner-deploy "docker exec -it alert-monitor-postgres psql -U postgres -d alert_bot"

# Підключення до Redis
ssh hetzner-deploy "docker exec -it alert-monitor-redis redis-cli -a \$REDIS_PASSWORD"

# Database міграції
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml exec app npm run typeorm migration:run"
```

### **Мережеві підключення з ноутбука:**
```bash
# PostgreSQL з ноутбука
psql -h 91.98.113.79 -p 5432 -U postgres -d alert_bot

# Redis з ноутбука
redis-cli -h 91.98.113.79 -p 6379 -u redis://alertapp:your_redis_password@91.98.113.79:6379

# RedisInsight Web UI
open http://91.98.113.79:5540

# Application
curl http://91.98.113.79:3000/api/health
```

### **System управління:**
```bash
# Перезавантаження сервера
ssh hetzner-deploy "sudo reboot"

# Перевірка системних ресурсів
ssh hetzner-deploy "free -h && df -h && uptime"

# Firewall управління
ssh hetzner-deploy "sudo ufw status verbose"

# Service управління
ssh hetzner-deploy "sudo systemctl status docker fail2ban"
```

---

## 🔗 Корисні посилання

### **Доступ до сервісів:**
- **Application**: http://91.98.113.79:3000
- **Health Check**: http://91.98.113.79:3000/api/health
- **RedisInsight**: http://91.98.113.79:5540
- **PostgreSQL**: 91.98.113.79:5432
- **Redis**: 91.98.113.79:6379

### **Файли конфігурації:**
- `docker-compose.infrastructure.yml` - БД та Redis
- `docker-compose.prod.yml` - Застосунок
- `config/postgresql.conf` - PostgreSQL налаштування
- `config/redis.conf` - Redis налаштування
- `scripts/setup-server.sh` - Налаштування сервера
- `scripts/deploy-*.sh` - Скрипти деплою

---

## 🎯 Quick Reference

### **Швидкі команди:**
```bash
# Статус системи
ssh hetzner-deploy "docker ps && docker stats --no-stream && free -h"

# Перезапуск застосунку
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml restart app"

# Перегляд логів
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml logs -f --tail=50 app"

# Health check
curl -s http://91.98.113.79:3000/api/health | jq '.'
```

### **Emergency Commands:**
```bash
# Зупинити все
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.infrastructure.yml down"

# Запустити все з нуля
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.infrastructure.yml up -d && sleep 30 && docker-compose -f docker-compose.prod.yml up -d"

# Очистити всі контейнери (дуже обережно!)
ssh hetzner-deploy "docker stop \$(docker ps -q) && docker rm \$(docker ps -aq)"
```

---

**🎉 Готово! Тепер у вас є повний довідник для роботи з deployment системою!**
