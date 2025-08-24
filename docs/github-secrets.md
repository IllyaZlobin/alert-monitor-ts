# 🔐 GitHub Secrets Configuration

## Required Secrets

Налаштуйте наступні secrets у вашому GitHub repository:
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 🌐 Server Connection
```
Name: HETZNER_SERVER_IP
Value: 91.98.113.79  # Your actual server IP

Name: HETZNER_SSH_KEY
Value: -----BEGIN OPENSSH PRIVATE KEY-----
       ... your private SSH key content ...
       -----END OPENSSH PRIVATE KEY-----
```

### 🗄️ Database Configuration
```
Name: DB_USERNAME
Value: postgres

Name: DB_PASSWORD
Value: your_super_secure_password_here

Name: DB_NAME
Value: alert_bot
```

### 📊 Redis Configuration
```
Name: REDIS_USERNAME
Value: alertapp

Name: REDIS_PASSWORD
Value: your_super_secure_redis_password_here
```

### 🤖 Telegram Bot Configuration
```
Name: BOT_TOKEN
Value: your_telegram_bot_token_from_botfather

Name: PUBLIC_ALERT_GROUP_URL
Value: https://t.me/your_public_group_url
```

## 🔧 Setup Instructions

### 1. SSH Key Generation (if needed)
```bash
# Generate new SSH key pair
ssh-keygen -t ed25519 -C "deployment@alert-monitor" -f ~/.ssh/alert-monitor-deploy

# Copy public key to server
ssh-copy-id -i ~/.ssh/alert-monitor-deploy.pub root@your_server_ip

# Copy private key content for GitHub Secret
cat ~/.ssh/alert-monitor-deploy
```

### 2. Database Password Generation
```bash
# Generate secure password
openssl rand -base64 32
```

### 3. Get Telegram Bot Token
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Create new bot: `/newbot`
3. Copy the token provided

### 4. Test Secrets (after setup)
```bash
# Test SSH connection
ssh -i ~/.ssh/alert-monitor-deploy deployer@your_server_ip

# Test database connection (after deployment)
psql -h your_server_ip -p 5432 -U postgres -d alert_bot
```

## 🔒 Security Best Practices

1. **Use unique passwords**: Never reuse passwords
2. **Rotate secrets regularly**: Update passwords and keys periodically
3. **Limited scope SSH keys**: Create deployment-specific SSH keys
4. **Environment separation**: Different secrets for different environments
5. **Access logging**: Monitor GitHub Actions logs for secret usage

## 🚨 Secret Management

### If secrets are compromised:
1. **Immediately rotate** all affected secrets
2. **Update GitHub Secrets** with new values
3. **Redeploy infrastructure** with new credentials
4. **Check logs** for unauthorized access

### Secret validation:
```bash
# After setting secrets, test deployment with manual workflow
# Go to Actions → Manual Operations → Run workflow
# Select "health-check" to verify everything works
```

---

**Never commit secrets to git!** Always use GitHub Secrets for sensitive data.
