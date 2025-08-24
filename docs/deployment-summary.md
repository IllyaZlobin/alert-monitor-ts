# 📋 Deployment Solution Summary

## 🏗️ Current Architecture

### **Infrastructure Layer** (deploy once):
```bash
docker-compose.infrastructure.yml
├── PostgreSQL 15 (port 5432, external access)
├── Redis 7 + ACL auth (port 6379, external access) 
└── RedisInsight UI (port 5540, web access)
```

### **Application Layer** (deploy on each update):
```bash  
docker-compose.prod.yml
└── NestJS App (port 3000 + health endpoint /api/health)
```

### **Deployment Flow**:
1. **One-time**: `scripts/setup-server.sh` (server setup)
2. **One-time**: `scripts/deploy-infrastructure.sh` (DB + Redis)
3. **Per-update**: GitHub Actions → `scripts/deploy-application.sh`

## 🔐 Security Features

- ✅ Redis: username `alertapp` + password auth via ACL
- ✅ PostgreSQL: password authentication
- ✅ UFW Firewall: only necessary ports (22, 80, 443, 3000, 5432, 6379, 5540)
- ✅ Fail2ban: SSH brute-force protection
- ✅ Non-root deployment user: `deployer`
- ✅ GitHub Secrets: all sensitive data

## 🌐 Network Access

**From laptop connections:**
- PostgreSQL: `psql -h server_ip -p 5432 -U postgres -d alert_bot`
- Redis: `redis-cli -h server_ip -p 6379 -u redis://alertapp:password@server_ip:6379`
- RedisInsight: `http://server_ip:5540`
- Application: `http://server_ip:3000`
- Health: `http://server_ip:3000/api/health`

## 🚀 CI/CD Pipeline

```mermaid
graph TD
    A[Push to main] --> B[Build & Test]
    B --> C[Build Docker Image]
    C --> D[Push to GHCR]
    D --> E[Deploy to Server]
    E --> F[Run Migrations]
    F --> G[Health Check]
    G --> H[Success Notification]
```

## 📁 Key Files

**Deployment:**
- `Dockerfile` - Multi-stage production build
- `docker-compose.infrastructure.yml` - Persistent services
- `docker-compose.prod.yml` - Application service (simplified)
- `env.template` - Environment variables template

**Scripts:**
- `scripts/setup-server.sh` - Initial server setup
- `scripts/deploy-infrastructure.sh` - Deploy DB + Redis
- `scripts/deploy-application.sh` - Deploy application

**CI/CD:**
- `.github/workflows/deploy.yml` - Automatic deployment
- `.github/workflows/manual-deploy.yml` - Manual operations

**Configuration:**
- `config/postgresql.conf` - PostgreSQL production settings
- `config/redis.conf` - Redis production settings  
- `config/redis-users.acl` - Redis authentication rules

## ⚡ Key Decisions

1. **No resource limits** on containers (as requested)
2. **Separate compose files** for infrastructure vs application
3. **External access** to PostgreSQL and Redis for development
4. **Environment variables** created dynamically from GitHub Secrets
5. **Shared Docker network** for inter-container communication
6. **Persistent volumes** mounted to `/opt/alert-monitor/data`

## 🎯 GitHub Secrets Required

```bash
HETZNER_SERVER_IP     # Server IP address
HETZNER_SSH_KEY       # SSH private key
DB_USERNAME           # postgres  
DB_PASSWORD           # PostgreSQL password
DB_NAME               # alert_bot
REDIS_USERNAME        # alertapp
REDIS_PASSWORD        # Redis password
BOT_TOKEN             # Telegram bot token
PUBLIC_ALERT_GROUP_URL # Telegram group URL
```

## 📊 Server Specs

- **Provider**: Hetzner VPS
- **OS**: Ubuntu 20.04/22.04  
- **Resources**: 4GB RAM, 80GB SSD
- **IP**: 91.98.113.79
- **Ports**: 22 (SSH), 3000 (App), 5432 (PostgreSQL), 6379 (Redis), 5540 (RedisInsight)
