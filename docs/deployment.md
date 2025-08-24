# 🚀 Deployment Guide

Цей документ описує процес деплою Alert Monitor TS на Hetzner сервер.

## 📋 Prerequisites

### Налаштування сервера
- Ubuntu 20.04/22.04
- Доступ за SSH ключем
- Користувач з sudo правами

### GitHub Secrets
Налаштуйте наступні secrets у GitHub repository (Settings → Secrets and variables → Actions):

```bash
# Server connection
HETZNER_SERVER_IP=your_server_ip_here
HETZNER_SSH_KEY=your_private_ssh_key_here

# Database credentials
DB_USERNAME=postgres
DB_PASSWORD=your_secure_postgres_password
DB_NAME=alert_bot

# Redis credentials
REDIS_USERNAME=alertapp
REDIS_PASSWORD=your_secure_redis_password

# Application secrets
BOT_TOKEN=your_telegram_bot_token
PUBLIC_ALERT_GROUP_URL=your_public_alert_group_url

# GitHub Container Registry (automatically available)
GITHUB_TOKEN=automatically_provided_by_github
```

## 🏗️ Initial Server Setup

### 1. Підключіться до сервера
```bash
ssh root@your_server_ip
```

### 2. Створіть користувача для деплою
```bash
# Clone repository to local machine first
git clone https://github.com/your-username/alert-monitor-ts.git
cd alert-monitor-ts

# Copy setup script to server
scp scripts/setup-server.sh root@your_server_ip:~/

# Run setup on server
ssh root@your_server_ip
chmod +x ~/setup-server.sh
./setup-server.sh

# Reboot server
sudo reboot
```

### 3. Перевірте налаштування
```bash
# Login as deployer user
ssh deployer@your_server_ip

# Check Docker
docker --version
docker-compose --version

# Check application directory
ls -la /opt/alert-monitor/
```

## 🚀 Deployment Methods

### Автоматичний деплой (рекомендований)
Деплой відбувається автоматично при push в `main` branch.

#### Перший деплой (з інфраструктурою):
1. Йдіть у GitHub Actions
2. Запустіть workflow "🚀 Deploy to Hetzner" manually
3. Встановіть `deploy_infrastructure: true`
4. Встановіть версію (наприклад, `v1.0.0`)

#### Звичайний деплой:
Просто push в `main` branch - деплой відбудеться автоматично.

### Ручний деплой

#### 1. Деплой інфраструктури (один раз)
```bash
# На сервері
cd /opt/alert-monitor
./scripts/deploy-infrastructure.sh
```

#### 2. Деплой застосунку
```bash
# На сервері
cd /opt/alert-monitor
./scripts/deploy-application.sh v1.0.0
```

## 🔧 Manual Operations

Використовуйте workflow "🔧 Manual Operations" для:

- `deploy-infrastructure` - Деплой PostgreSQL + Redis
- `deploy-application` - Деплой застосунку
- `restart-application` - Перезапуск застосунку
- `run-migrations` - Запуск міграцій БД
- `cleanup-docker` - Очищення Docker ресурсів
- `show-logs` - Перегляд логів
- `health-check` - Перевірка стану системи

## 🔍 Monitoring & Troubleshooting

### Перевірка стану
```bash
# Application health
curl http://your_server_ip:3000/api/health

# Container status
docker ps

# Application logs
docker-compose -f docker-compose.prod.yml logs -f app

# Infrastructure logs
docker-compose -f docker-compose.infrastructure.yml logs postgres redis
```

### Доступ до сервісів
- **Application**: http://your_server_ip:3000
- **Health Check**: http://your_server_ip:3000/api/health
- **PostgreSQL**: your_server_ip:5432
- **Redis**: your_server_ip:6379
- **RedisInsight**: http://your_server_ip:5540

### Підключення до БД з ноутбука
```bash
# PostgreSQL
psql -h your_server_ip -p 5432 -U postgres -d alert_bot

# Redis (with authentication)
redis-cli -h your_server_ip -p 6379 -u redis://alertapp:your_redis_password@your_server_ip:6379
```

### Корисні команди
```bash
# Restart application
docker-compose -f docker-compose.prod.yml restart app

# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# Check container resources
docker stats

# Database backup
docker exec alert-monitor-postgres pg_dump -U postgres alert_bot > backup.sql

# Redis backup
docker exec alert-monitor-redis redis-cli BGSAVE
```

## 🛡️ Security Notes

1. **Firewall**: Тільки необхідні порти відкриті (22, 80, 443, 3000, 5432, 6379, 5540)
2. **Fail2ban**: Активний для захисту SSH
3. **Non-root**: Застосунок працює під non-root користувачем
4. **Secrets**: Всі паролі та токени в GitHub Secrets

## 🔧 Maintenance

### Backup Strategy
1. **Database**: Автоматичні backups через cron
2. **Application**: Код в Git + Docker images в registry
3. **Data**: Volumes змонтовані в `/opt/alert-monitor/data`

### Updates
1. Push код в `main` branch
2. GitHub Actions автоматично зробить деплой
3. Health check перевірить статус
4. Rollback через previous Docker image якщо потрібно

### Scaling
Для збільшення ресурсів:
1. Оновіть Hetzner сервер (більше CPU/RAM)
2. Налаштування PostgreSQL в `config/postgresql.conf`
3. Налаштування Redis в `config/redis.conf`
4. Без обмежень ресурсів в Docker Compose

## 📞 Support

При проблемах:
1. Перевірте GitHub Actions logs
2. Подивіться application logs на сервері
3. Запустіть manual health-check
4. Перевірте стан контейнерів

---

**Успішного деплою! 🚀**
