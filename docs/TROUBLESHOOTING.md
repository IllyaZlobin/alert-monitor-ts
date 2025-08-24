# 🔧 Troubleshooting Guide

## 🚨 Найпоширеніші проблеми та їх рішення

### **1. SSH проблеми**

#### **"Permission denied (publickey)"**
```bash
# Діагностика
ssh -v hetzner "echo test"

# Рішення
ssh-copy-id -i ~/.ssh/hetzner root@91.98.113.79
# Або створити SSH config
```

#### **"Host key verification failed"**
```bash
# Очистити known_hosts
ssh-keygen -R 91.98.113.79
# Або додати -o StrictHostKeyChecking=no для першого підключення
```

---

### **2. Docker проблеми**

#### **Docker не запускається**
```bash
# Перевірка статусу
ssh hetzner-deploy "sudo systemctl status docker"

# Перезапуск Docker
ssh hetzner-deploy "sudo systemctl restart docker"

# Перевірка логів
ssh hetzner-deploy "journalctl -u docker.service --no-pager"
```

#### **"docker: command not found"**
```bash
# Перевірка установки
ssh hetzner-deploy "which docker"

# Додати користувача до групи docker
ssh hetzner-deploy "sudo usermod -aG docker \$USER && newgrp docker"
```

#### **Docker Compose проблеми**
```bash
# Перевірка версії
ssh hetzner-deploy "docker-compose --version"

# Переустановка
ssh hetzner-deploy "
sudo curl -L 'https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-\$(uname -s)-\$(uname -m)' -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
"
```

---

### **3. Network та Firewall проблеми**

#### **Порт недоступний ззовні**
```bash
# Перевірка UFW статусу
ssh hetzner-deploy "sudo ufw status verbose"

# Відкрити порт
ssh hetzner-deploy "sudo ufw allow 3000/tcp"

# Перевірка прослуховування портів
ssh hetzner-deploy "netstat -tlnp | grep :3000"
```

#### **Docker containers не можуть підключитися один до одного**
```bash
# Перевірка мережі
ssh hetzner-deploy "docker network ls"
ssh hetzner-deploy "docker network inspect alert-monitor-network"

# Створити мережу якщо відсутня
ssh hetzner-deploy "docker network create alert-monitor-network"
```

---

### **4. Application проблеми**

#### **Health check fails**
```bash
# Перевірка здоров'я застосунку
curl -v http://91.98.113.79:3000/api/health

# Перевірка логів
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml logs --tail=100 app"

# Перевірка контейнера
ssh hetzner-deploy "docker ps | grep alert-monitor-app"
```

#### **Application не стартує**
```bash
# Детальні логи
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml logs app"

# Перевірка environment variables
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml config"

# Restart application
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml restart app"
```

#### **Database connection failed**
```bash
# Перевірка PostgreSQL контейнера
ssh hetzner-deploy "docker ps | grep postgres"
ssh hetzner-deploy "docker exec alert-monitor-postgres pg_isready -U postgres"

# Перевірка Redis контейнера
ssh hetzner-deploy "docker ps | grep redis"
ssh hetzner-deploy "docker exec alert-monitor-redis redis-cli -a \$REDIS_PASSWORD ping"

# Перевірка мережевого підключення
ssh hetzner-deploy "docker exec alert-monitor-app ping alert-monitor-postgres"
```

---

### **5. GitHub Actions проблеми**

#### **Deployment fails**
```bash
# Перевірити GitHub Actions logs
# Actions tab → Failed workflow → Click on failed step

# Перевірити secrets
# Settings → Secrets and variables → Actions
# Переконатися що всі secrets встановлені

# Manual deployment для тестування
# Actions → Manual Operations → health-check
```

#### **SSH connection fails в Actions**
```bash
# Перевірити HETZNER_SSH_KEY secret
# Має містити весь приватний ключ включно з заголовками

# Тестувати SSH key локально
ssh -i ~/.ssh/hetzner deployer@91.98.113.79 "echo 'SSH test successful'"
```

---

### **6. Performance проблеми**

#### **High memory usage**
```bash
# Перевірка використання пам'яті
ssh hetzner-deploy "free -h"
ssh hetzner-deploy "docker stats --no-stream"

# Restart containers при високому споживанні
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml restart"
```

#### **Disk space issues**
```bash
# Перевірка дискового простору
ssh hetzner-deploy "df -h"
ssh hetzner-deploy "docker system df"

# Очистити старі образи та контейнери
ssh hetzner-deploy "
docker image prune -f
docker container prune -f
docker volume prune -f
docker system prune -f
"
```

#### **Application slow response**
```bash
# Перевірка логів на помилки
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml logs --tail=200 app | grep -i error"

# Перевірка системних ресурсів
ssh hetzner-deploy "uptime && iostat && free -h"
```

---

### **7. Database проблеми**

#### **PostgreSQL connection refused**
```bash
# Перевірка PostgreSQL контейнера
ssh hetzner-deploy "docker exec alert-monitor-postgres pg_isready -U postgres -d alert_bot"

# Перевірка логів PostgreSQL
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.infrastructure.yml logs postgres"

# Restart PostgreSQL
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.infrastructure.yml restart postgres"
```

#### **Database migration fails**
```bash
# Ручний запуск міграцій
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml exec app npm run typeorm migration:run"

# Перевірка database connection
ssh hetzner-deploy "docker exec -it alert-monitor-postgres psql -U postgres -d alert_bot -c '\l'"
```

#### **Redis connection issues**
```bash
# Перевірка Redis
ssh hetzner-deploy "docker exec alert-monitor-redis redis-cli -a \$REDIS_PASSWORD ping"

# Redis info
ssh hetzner-deploy "docker exec alert-monitor-redis redis-cli -a \$REDIS_PASSWORD info"

# Очистити Redis cache
ssh hetzner-deploy "docker exec alert-monitor-redis redis-cli -a \$REDIS_PASSWORD FLUSHDB"
```

---

### **8. System проблеми**

#### **Server reboot required**
```bash
# Перевірка чи потрібен reboot
ssh hetzner-deploy "cat /var/run/reboot-required"

# Scheduled reboot
ssh hetzner-deploy "sudo shutdown -r +5 'Server reboot in 5 minutes'"
```

#### **Service startup issues**
```bash
# Перевірка автозапуску сервісів
ssh hetzner-deploy "sudo systemctl is-enabled docker fail2ban"

# Увімкнути автозапуск
ssh hetzner-deploy "sudo systemctl enable docker fail2ban"
```

---

## 🔍 Діагностичні команди

### **Повна діагностика системи:**
```bash
ssh hetzner-deploy "
echo '=== SYSTEM INFO ==='
uname -a
uptime
free -h
df -h

echo -e '\n=== SERVICES STATUS ==='
sudo systemctl is-active docker fail2ban ufw || true

echo -e '\n=== DOCKER INFO ==='
docker --version
docker-compose --version
docker ps -a

echo -e '\n=== NETWORK ==='
sudo ufw status
netstat -tlnp | grep -E ':(3000|5432|6379|5540)'

echo -e '\n=== APPLICATION ==='
ls -la /opt/alert-monitor/
curl -s http://localhost:3000/api/health || echo 'Health check failed'
"
```

### **Container діагностика:**
```bash
ssh hetzner-deploy "
echo '=== CONTAINERS STATUS ==='
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo -e '\n=== CONTAINER RESOURCES ==='
docker stats --no-stream

echo -e '\n=== RECENT LOGS ==='
cd /opt/alert-monitor
docker-compose -f docker-compose.prod.yml logs --tail=10 app || true
docker-compose -f docker-compose.infrastructure.yml logs --tail=5 postgres redis || true
"
```

---

## 🆘 Emergency Recovery

### **Повне відновлення системи:**
```bash
# 1. Зупинити всі контейнери
ssh hetzner-deploy "
docker stop \$(docker ps -q) 2>/dev/null || true
cd /opt/alert-monitor
docker-compose -f docker-compose.prod.yml down || true
docker-compose -f docker-compose.infrastructure.yml down || true
"

# 2. Очистити Docker
ssh hetzner-deploy "
docker container prune -f
docker image prune -f
docker network prune -f
"

# 3. Перезапустити Docker
ssh hetzner-deploy "sudo systemctl restart docker"

# 4. Відновити мережу
ssh hetzner-deploy "docker network create alert-monitor-network || true"

# 5. Запустити інфраструктуру
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.infrastructure.yml up -d"

# 6. Дочекатися готовності інфраструктури
sleep 30

# 7. Запустити застосунок
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml up -d"
```

### **Backup та Restore:**
```bash
# Створити повний backup
ssh hetzner-deploy "
cd /opt/alert-monitor/backups
# Database backup
docker exec alert-monitor-postgres pg_dump -U postgres alert_bot > db-backup-\$(date +%Y%m%d_%H%M%S).sql
# Redis backup
docker exec alert-monitor-redis redis-cli -a \$REDIS_PASSWORD BGSAVE
docker cp alert-monitor-redis:/data/dump.rdb redis-backup-\$(date +%Y%m%d_%H%M%S).rdb
# Config backup
cp -r ../config config-backup-\$(date +%Y%m%d_%H%M%S)
"

# Restore database
ssh hetzner-deploy "
cd /opt/alert-monitor/backups
# List available backups
ls -la db-backup-*
# Restore (замініть filename)
docker exec -i alert-monitor-postgres psql -U postgres alert_bot < db-backup-YYYYMMDD_HHMMSS.sql
"
```

---

## 📞 Коли звертатися за допомогою

**🔴 Критичні проблеми (негайно):**
- Сервер не відповідає
- Всі контейнери зупинилися
- База даних недоступна
- Втрата даних

**🟡 Важливі проблеми (до 4 годин):**
- Application не відповідає
- Помилки в логах
- Performance проблеми
- Deployment fails

**🟢 Низький пріоритет (до 1 дня):**
- Monitoring alerts
- Log cleanup потрібен
- Configuration updates

---

**💡 Пам'ятайте:** Завжди робіть backup перед внесенням змін!
