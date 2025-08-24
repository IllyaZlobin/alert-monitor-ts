# 📚 Alert Monitor TS - Документація

## 🚀 Повна документація по deployment та налаштуванню

### **📖 Основна документація**

#### **1. [COMPLETE-SETUP-GUIDE.md](./COMPLETE-SETUP-GUIDE.md)** 🔥 **ГОЛОВНИЙ ДОВІДНИК**
Повний довідник з усіма командами, налаштуваннями та процедурами:
- SSH налаштування
- Hetzner server setup  
- Docker configuration
- Deployment commands
- Моніторинг і налагодження
- GitHub Actions
- Корисні команди

#### **2. [deployment.md](./deployment.md)** 📋 **ІНСТРУКЦІЇ ДЕПЛОЮ**
Детальні інструкції по деплою:
- Prerequisites та GitHub Secrets
- Початкове налаштування сервера
- Автоматичний та ручний деплой
- Моніторинг та troubleshooting

#### **3. [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)** ✅ **ЧЕКЛІСТ**
Покроковий чекліст для кожного деплою:
- Pre-deployment перевірки
- Infrastructure deployment
- Application deployment
- Post-deployment verification
- Troubleshooting steps

---

### **🔧 Технічна документація**

#### **4. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** 🆘 **РОЗВ'ЯЗАННЯ ПРОБЛЕМ**
Найпоширеніші проблеми та їх рішення:
- SSH проблеми
- Docker проблеми  
- Network та Firewall
- Application issues
- GitHub Actions проблеми
- Performance issues
- Database проблеми
- Emergency recovery

#### **5. [COMMAND-HISTORY.md](./COMMAND-HISTORY.md)** 📝 **ІСТОРІЯ КОМАНД**
Повна історія всіх виконаних команд:
- SSH налаштування
- Server setup процес
- Виправлення помилок
- Статистика робіт
- Troubleshooting кроки

#### **6. [github-secrets.md](./github-secrets.md)** 🔐 **GITHUB SECRETS**
Налаштування секретів для GitHub Actions:
- SSH ключі
- Database credentials
- Redis configuration
- Telegram bot tokens
- Security best practices

---

### **🤖 Інтеграція з AI помічниками**

#### **7. [claude-deployment-prompt.md](./claude-deployment-prompt.md)** 🤖 **CLAUDE PROMPT**
Детальний промт для Claude Code з повним контекстом проекту для експертного аналізу

#### **8. [HOW-TO-USE-CLAUDE-PROMPTS.md](./HOW-TO-USE-CLAUDE-PROMPTS.md)** 📖 **ІНСТРУКЦІЇ ДЛЯ CLAUDE**
Як використовувати Claude Code для допомоги з deployment

#### **9. [deployment-summary.md](./deployment-summary.md)** ⚡ **ШВИДКИЙ ОГЛЯД**
Короткий summary поточного deployment рішення

---

### **📂 Структура файлів проекту**

```
alert-monitor-ts/
├── 📁 docs/                          # Документація
│   ├── 🔥 COMPLETE-SETUP-GUIDE.md    # ГОЛОВНИЙ ДОВІДНИК
│   ├── ✅ DEPLOYMENT-CHECKLIST.md     # Чекліст деплою
│   ├── 🆘 TROUBLESHOOTING.md          # Troubleshooting
│   ├── 📝 COMMAND-HISTORY.md          # Історія команд
│   ├── 📋 deployment.md               # Інструкції деплою
│   ├── 🔐 github-secrets.md           # GitHub Secrets
│   ├── 🤖 claude-deployment-prompt.md # Claude промт
│   ├── 📖 HOW-TO-USE-CLAUDE-PROMPTS.md
│   └── ⚡ deployment-summary.md       # Швидкий огляд
├── 📁 scripts/                       # Deployment скрипти
│   ├── setup-server.sh              # Налаштування сервера
│   ├── deploy-infrastructure.sh      # Деплой PostgreSQL + Redis
│   └── deploy-application.sh         # Деплой застосунку
├── 📁 .github/workflows/             # GitHub Actions
│   ├── deploy.yml                   # Автоматичний деплой
│   └── manual-deploy.yml            # Manual операції
├── 📁 config/                        # Конфігурації
│   ├── postgresql.conf              # PostgreSQL налаштування
│   ├── redis.conf                   # Redis налаштування
│   └── redis-users.acl              # Redis authentication
├── docker-compose.infrastructure.yml  # PostgreSQL + Redis
├── docker-compose.prod.yml           # Application
├── Dockerfile                        # NestJS application
└── env.template                      # Environment variables template
```

---

## 🎯 Швидкий старт

### **Для нового деплою:**
1. 📖 Почніть з [COMPLETE-SETUP-GUIDE.md](./COMPLETE-SETUP-GUIDE.md)
2. ✅ Використовуйте [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)
3. 🆘 При проблемах дивіться [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### **Для maintenance:**
1. 📝 Перегляньте [COMMAND-HISTORY.md](./COMMAND-HISTORY.md) для довідки
2. 🔧 Використовуйте команди з [COMPLETE-SETUP-GUIDE.md](./COMPLETE-SETUP-GUIDE.md)

### **Для аналізу рішення:**
1. 🤖 Використайте [claude-deployment-prompt.md](./claude-deployment-prompt.md) з Claude Code
2. 📖 Читайте [HOW-TO-USE-CLAUDE-PROMPTS.md](./HOW-TO-USE-CLAUDE-PROMPTS.md)

---

## 🌐 Доступ до сервісів

**Production URLs:**
- 🚀 **Application**: http://91.98.113.79:3000
- 💚 **Health Check**: http://91.98.113.79:3000/api/health  
- 📊 **RedisInsight**: http://91.98.113.79:5540

**Database Connections:**
- 🐘 **PostgreSQL**: `91.98.113.79:5432` (alertapp/password)
- 🔴 **Redis**: `91.98.113.79:6379` (alertapp/password)

**SSH Access:**
- 🔑 **Root**: `ssh hetzner`
- 👨‍💻 **Deployer**: `ssh hetzner-deploy`

---

## 📊 Статус проекту

| Component | Status | Version | Notes |
|-----------|--------|---------|-------|
| 🖥️ **Server** | ✅ Active | Ubuntu 22.04 | Hetzner VPS 4GB RAM |
| 🐳 **Docker** | ✅ Running | 28.3.3 | With Docker Compose |
| 🐘 **PostgreSQL** | ✅ Running | 15-alpine | External access enabled |
| 🔴 **Redis** | ✅ Running | 7-alpine | With ACL authentication |
| 🚀 **Application** | ✅ Deployed | Latest | NestJS TypeScript |
| 🔒 **Security** | ✅ Configured | - | UFW + Fail2ban |
| 🤖 **CI/CD** | ✅ Active | GitHub Actions | Auto-deploy on push |

---

## 🆘 Контакти та підтримка

### **Emergency Commands:**
```bash
# Quick health check
curl -s http://91.98.113.79:3000/api/health | jq '.'

# Restart application
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml restart app"

# View logs
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml logs -f --tail=50 app"
```

### **Для допомоги:**
1. 📖 Перевірте [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. 🤖 Використайте Claude Code з [claude-deployment-prompt.md](./claude-deployment-prompt.md)
3. 📝 Перегляньте історію в [COMMAND-HISTORY.md](./COMMAND-HISTORY.md)

---

**🎉 Успішного деплою! 🚀**
