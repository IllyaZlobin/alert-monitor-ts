# ✅ Deployment Checklist

## 🚀 Pre-Deployment Checklist

### **1. GitHub Secrets Configuration**
- [ ] `HETZNER_SERVER_IP` = 91.98.113.79
- [ ] `HETZNER_SSH_KEY` = [Private SSH key content]
- [ ] `DB_USERNAME` = postgres
- [ ] `DB_PASSWORD` = [Strong password generated]
- [ ] `DB_NAME` = alert_bot
- [ ] `REDIS_USERNAME` = alertapp
- [ ] `REDIS_PASSWORD` = [Strong password generated]
- [ ] `BOT_TOKEN` = [Telegram bot token from @BotFather]
- [ ] `PUBLIC_ALERT_GROUP_URL` = [Telegram group URL]

### **2. Local Environment**
- [ ] SSH key `~/.ssh/hetzner` exists and has correct permissions
- [ ] SSH config is set up for easy server access
- [ ] All code changes are committed and pushed to main branch
- [ ] Latest version tag is created (if using versioning)

### **3. Server Status Check**
```bash
# Run these commands to verify server readiness:
ssh hetzner-deploy "
echo '=== System Status ==='
uptime && free -h && df -h

echo '=== Services Status ==='
sudo systemctl is-active docker fail2ban ufw

echo '=== Application Directory ==='
ls -la /opt/alert-monitor/

echo '=== Network Connectivity ==='
curl -s http://ifconfig.me && echo
"
```
- [ ] Server is accessible via SSH
- [ ] All services are running (docker, fail2ban, ufw)
- [ ] Application directory exists with correct permissions
- [ ] Server has internet connectivity

---

## 🏗️ Infrastructure Deployment Checklist

### **First-Time Infrastructure Setup**
```bash
# 1. Copy configuration files
scp -r config/ docker-compose.infrastructure.yml hetzner-deploy:/opt/alert-monitor/

# 2. Create .env.production with real values
ssh hetzner-deploy "cd /opt/alert-monitor && cat > .env.production << 'EOF'
APP_PORT=3000
APP_ENV=production
NODE_ENV=production
DATABASE_HOST=alert-monitor-postgres
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=YOUR_REAL_DB_PASSWORD_HERE
DATABASE_NAME=alert_bot
REDIS_USERNAME=alertapp
REDIS_PASSWORD=YOUR_REAL_REDIS_PASSWORD_HERE
BOT_TOKEN=YOUR_REAL_BOT_TOKEN_HERE
PUBLIC_ALERT_GROUP_URL=YOUR_REAL_GROUP_URL_HERE
APP_VERSION=v1.0.0
EOF"

# 3. Copy and run deployment script
scp scripts/deploy-infrastructure.sh hetzner-deploy:/opt/alert-monitor/
ssh hetzner-deploy "cd /opt/alert-monitor && chmod +x scripts/deploy-infrastructure.sh && ./scripts/deploy-infrastructure.sh"
```

### **Infrastructure Verification**
- [ ] PostgreSQL container is running and healthy
- [ ] Redis container is running and healthy
- [ ] RedisInsight is accessible at http://91.98.113.79:5540
- [ ] External PostgreSQL connection works: `psql -h 91.98.113.79 -p 5432 -U postgres -d alert_bot`
- [ ] External Redis connection works: `redis-cli -h 91.98.113.79 -p 6379 -u redis://alertapp:password@91.98.113.79:6379`

**Infrastructure Health Check Commands:**
```bash
ssh hetzner-deploy "
cd /opt/alert-monitor
docker-compose -f docker-compose.infrastructure.yml ps
docker exec alert-monitor-postgres pg_isready -U postgres -d alert_bot
docker exec alert-monitor-redis redis-cli -a \$REDIS_PASSWORD ping
"
```

---

## 🚀 Application Deployment Checklist

### **GitHub Actions Automatic Deployment**
- [ ] All changes are pushed to main branch
- [ ] GitHub Actions workflow started automatically
- [ ] Build step completed successfully
- [ ] Docker image built and pushed to GHCR
- [ ] Application deployed to server
- [ ] Database migrations executed successfully
- [ ] Health check passed

### **Manual Deployment (if needed)**
```bash
# 1. Copy application files
scp docker-compose.prod.yml scripts/deploy-application.sh hetzner-deploy:/opt/alert-monitor/

# 2. Run deployment
ssh hetzner-deploy "cd /opt/alert-monitor && chmod +x scripts/deploy-application.sh && ./scripts/deploy-application.sh v1.0.0"
```

### **Application Verification**
- [ ] Application container is running
- [ ] Health check endpoint responds: `curl http://91.98.113.79:3000/api/health`
- [ ] Application logs show no errors
- [ ] Database connection is working
- [ ] Redis connection is working
- [ ] Telegram bot responds to commands

**Application Health Check Commands:**
```bash
# Quick health check
curl -s http://91.98.113.79:3000/api/health | jq '.'

# Detailed application status
ssh hetzner-deploy "
cd /opt/alert-monitor
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=20 app
docker stats --no-stream
"
```

---

## 🔍 Post-Deployment Verification

### **Functional Testing**
- [ ] Application starts successfully
- [ ] Health endpoint returns 200 OK
- [ ] Database queries work correctly
- [ ] Redis caching is functional
- [ ] Telegram bot receives and processes messages
- [ ] All API endpoints respond correctly
- [ ] Background jobs are processing

### **Performance Testing**
```bash
# Check system resources
ssh hetzner-deploy "
echo '=== Resource Usage ==='
free -h
df -h
docker stats --no-stream

echo '=== Network Connectivity ==='
netstat -tlnp | grep -E ':(3000|5432|6379|5540)'
"
```
- [ ] Memory usage is within acceptable limits (< 80%)
- [ ] CPU usage is normal (< 50% average)
- [ ] Disk space is sufficient (< 80% used)
- [ ] All required ports are listening

### **Security Verification**
- [ ] UFW firewall is active and correctly configured
- [ ] Fail2ban is monitoring SSH attempts
- [ ] Application is running as non-root user
- [ ] Database and Redis require authentication
- [ ] No sensitive data in logs

---

## 🔧 Troubleshooting Checklist

### **If Deployment Fails**
1. **Check GitHub Actions logs:**
   - [ ] Build step errors
   - [ ] SSH connection issues
   - [ ] Docker build failures
   - [ ] Deployment script errors

2. **Check server status:**
   ```bash
   ssh hetzner-deploy "
   docker ps -a
   docker logs alert-monitor-app --tail=50
   df -h
   free -h
   "
   ```
   - [ ] Docker is running
   - [ ] Containers are not crashed
   - [ ] Sufficient disk space
   - [ ] Sufficient memory

3. **Check application logs:**
   ```bash
   ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml logs --tail=100"
   ```
   - [ ] No database connection errors
   - [ ] No Redis connection errors
   - [ ] No missing environment variables
   - [ ] No permission errors

### **Recovery Actions**
- [ ] Restart application: `ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml restart app"`
- [ ] Restart infrastructure: `ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.infrastructure.yml restart"`
- [ ] Check and update .env.production file
- [ ] Re-run deployment script
- [ ] Rollback to previous version if needed

---

## 📊 Monitoring Setup

### **Log Monitoring**
```bash
# Real-time application logs
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.prod.yml logs -f --tail=50 app"

# Infrastructure logs
ssh hetzner-deploy "cd /opt/alert-monitor && docker-compose -f docker-compose.infrastructure.yml logs -f --tail=20 postgres redis"
```
- [ ] Application logs are being generated
- [ ] No error messages in recent logs
- [ ] Log rotation is working

### **Resource Monitoring**
```bash
# Container monitoring with ctop
ssh hetzner-deploy "ctop"

# System monitoring
ssh hetzner-deploy "htop"
```
- [ ] Container resource usage is normal
- [ ] System resources are not exhausted
- [ ] No memory leaks detected

### **External Monitoring**
- [ ] Health check endpoint monitored
- [ ] Response time is acceptable (< 2s)
- [ ] Uptime monitoring configured
- [ ] Alert notifications working

---

## 📋 Maintenance Checklist

### **Weekly Tasks**
- [ ] Check system updates: `ssh hetzner-deploy "sudo apt list --upgradable"`
- [ ] Review application logs for errors
- [ ] Check disk space usage
- [ ] Verify backup integrity
- [ ] Monitor resource usage trends

### **Monthly Tasks**
- [ ] Update Docker images: `docker-compose pull`
- [ ] Clean up old Docker images: `docker image prune -f`
- [ ] Review and rotate logs
- [ ] Update security configurations
- [ ] Performance optimization review

### **Backup Verification**
```bash
# Database backup
ssh hetzner-deploy "
cd /opt/alert-monitor/backups
docker exec alert-monitor-postgres pg_dump -U postgres alert_bot > db-backup-\$(date +%Y%m%d_%H%M%S).sql
ls -la db-backup-*
"

# Redis backup
ssh hetzner-deploy "
cd /opt/alert-monitor/backups
docker exec alert-monitor-redis redis-cli -a \$REDIS_PASSWORD BGSAVE
docker cp alert-monitor-redis:/data/dump.rdb redis-backup-\$(date +%Y%m%d_%H%M%S).rdb
ls -la redis-backup-*
"
```
- [ ] Database backups are created regularly
- [ ] Redis snapshots are saved
- [ ] Backup files are not corrupted
- [ ] Recovery procedures tested

---

## ✨ Success Criteria

### **Deployment is considered successful when:**
- [ ] All containers are running and healthy
- [ ] Health check endpoint returns status 200
- [ ] Application responds to user requests
- [ ] Telegram bot processes messages correctly
- [ ] Database and Redis are accessible
- [ ] No critical errors in logs
- [ ] External monitoring confirms uptime
- [ ] Performance metrics are within acceptable ranges

### **Ready for Production Traffic:**
- [ ] Load testing completed successfully
- [ ] Backup and recovery procedures tested
- [ ] Monitoring and alerting configured
- [ ] Documentation updated
- [ ] Team notified of successful deployment

---

**🎉 Congratulations! Deployment completed successfully! 🚀**

**Quick access URLs:**
- Application: http://91.98.113.79:3000
- Health Check: http://91.98.113.79:3000/api/health
- RedisInsight: http://91.98.113.79:5540
