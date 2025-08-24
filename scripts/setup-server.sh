#!/bin/bash

# =================================================================
# Hetzner Server Setup Script for Alert Monitor TS
# =================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Function to check service status
check_service() {
    local service_name=$1
    if sudo systemctl is-active --quiet $service_name; then
        info "✅ $service_name is running"
        return 0
    else
        warning "⚠️ $service_name is not running"
        return 1
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

log "🚀 Starting Hetzner server setup for Alert Monitor TS..."

# =================================================================
# 1. System Updates
# =================================================================
log "📦 Updating system packages..."
sudo apt update -y
sudo apt upgrade -y
sudo apt autoremove -y

# Install essential packages
log "🔧 Installing essential packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    tree \
    vim \
    nano

# =================================================================
# 2. Create deployment user
# =================================================================
DEPLOY_USER="deployer"

if ! id "$DEPLOY_USER" &>/dev/null; then
    log "👤 Creating deployment user: $DEPLOY_USER"
    sudo useradd -m -s /bin/bash $DEPLOY_USER
    sudo usermod -aG sudo $DEPLOY_USER
    
    # Setup SSH for deployer
    sudo mkdir -p /home/$DEPLOY_USER/.ssh
    sudo chmod 700 /home/$DEPLOY_USER/.ssh
    
    # Copy current user's authorized_keys to deployer
    if [[ -f ~/.ssh/authorized_keys ]]; then
        sudo cp ~/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/
        sudo chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
        sudo chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys
        info "SSH keys copied to $DEPLOY_USER"
    else
        warning "No SSH keys found for current user. You'll need to add them manually."
    fi
else
    info "User $DEPLOY_USER already exists"
fi

# =================================================================
# 3. Docker Installation
# =================================================================
if ! command_exists docker; then
    log "🐳 Installing Docker..."
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add users to docker group
    sudo usermod -aG docker $USER
    sudo usermod -aG docker $DEPLOY_USER
    
    # Enable Docker service
    sudo systemctl enable docker
    sudo systemctl start docker
    
    log "✅ Docker installed successfully"
else
    info "Docker is already installed"
fi

# =================================================================
# 4. Docker Compose Installation (standalone)
# =================================================================
if ! command_exists docker-compose; then
    log "🐙 Installing Docker Compose..."
    
    DOCKER_COMPOSE_VERSION="v2.23.3"
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    log "✅ Docker Compose installed successfully"
else
    info "Docker Compose is already installed"
fi

# =================================================================
# 5. Firewall Configuration
# =================================================================
log "🔥 Configuring UFW firewall..."

# Reset UFW to default
sudo ufw --force reset || error "Failed to reset UFW"

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH access
sudo ufw allow ssh
sudo ufw allow 22/tcp

# HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Application port (if needed for direct access)
sudo ufw allow 3000/tcp

# PostgreSQL (for external access from your laptop)
sudo ufw allow 5432/tcp

# Redis (for external access from your laptop)
sudo ufw allow 6379/tcp

# RedisInsight (for web UI access)
sudo ufw allow 5540/tcp

# Enable firewall
sudo ufw --force enable

log "✅ Firewall configured"

# =================================================================
# 6. Fail2ban Configuration
# =================================================================
log "🛡️ Configuring Fail2ban..."

sudo systemctl enable fail2ban || warning "Failed to enable fail2ban"
sudo systemctl start fail2ban || warning "Failed to start fail2ban"

# Create custom jail configuration
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF

sudo systemctl restart fail2ban

log "✅ Fail2ban configured"

# =================================================================
# 7. Create application directory structure
# =================================================================
APP_DIR="/opt/alert-monitor"
DATA_DIR="/opt/alert-monitor/data"

log "📁 Creating application directories..."
sudo mkdir -p $APP_DIR/{app,data/postgres,data/redis,backups,logs}
sudo chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR
sudo chmod -R 755 $APP_DIR

log "✅ Application directories created at $APP_DIR"

# =================================================================
# 8. Setup log rotation
# =================================================================
log "📝 Setting up log rotation..."

sudo tee /etc/logrotate.d/alert-monitor > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 $DEPLOY_USER $DEPLOY_USER
    postrotate
        docker container list --format "table {{.Names}}" | grep alert-monitor && docker restart alert-monitor-app || true
    endscript
}
EOF

log "✅ Log rotation configured"

# =================================================================
# 9. Install monitoring tools
# =================================================================
log "📊 Installing monitoring tools..."

# htop already installed above
# Install ctop for container monitoring
if ! command_exists ctop; then
    sudo curl -L https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64 -o /usr/local/bin/ctop
    sudo chmod +x /usr/local/bin/ctop
fi

log "✅ Monitoring tools installed"

# =================================================================
# 10. System optimizations
# =================================================================
log "⚡ Applying system optimizations..."

# Increase file descriptor limits
sudo tee -a /etc/security/limits.conf > /dev/null <<EOF
* soft nofile 65536
* hard nofile 65536
$DEPLOY_USER soft nofile 65536
$DEPLOY_USER hard nofile 65536
EOF

# Configure swap (optional, good for small VPS)
if [[ ! -f /swapfile ]]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    info "2GB swap file created"
fi

log "✅ System optimizations applied"

# =================================================================
# Final Verification
# =================================================================
log "🔍 Running final verification checks..."

# Check essential commands
info "Checking installed tools:"
command_exists docker && echo "  ✅ Docker installed" || echo "  ❌ Docker missing"
command_exists docker-compose && echo "  ✅ Docker Compose installed" || echo "  ❌ Docker Compose missing"
command_exists ufw && echo "  ✅ UFW installed" || echo "  ❌ UFW missing"
command_exists ctop && echo "  ✅ ctop installed" || echo "  ❌ ctop missing"

# Check services
echo ""
info "Checking services:"
check_service docker
check_service fail2ban
sudo systemctl is-enabled --quiet ufw && echo "  ✅ UFW enabled" || echo "  ⚠️ UFW not enabled"

# Check directories
echo ""
info "Checking directories:"
if [[ -d "$APP_DIR" ]]; then
    echo "  ✅ Application directory exists: $APP_DIR"
    ls -la $APP_DIR
else
    echo "  ❌ Application directory missing: $APP_DIR"
fi

# Check firewall status
echo ""
info "Firewall status:"
sudo ufw status | head -10

# =================================================================
# Summary
# =================================================================
echo ""
log "🎉 Server setup completed successfully!"
echo ""
info "Summary of what was configured:"
echo "  ✅ System updated and essential packages installed"
echo "  ✅ Deployment user '$DEPLOY_USER' created"
echo "  ✅ Docker and Docker Compose installed"
echo "  ✅ UFW firewall configured with necessary ports"
echo "  ✅ Fail2ban configured for SSH protection"
echo "  ✅ Application directory created at $APP_DIR"
echo "  ✅ Log rotation configured"
echo "  ✅ Monitoring tools installed (htop, ctop)"
echo "  ✅ System optimizations applied"
echo ""
warning "Next steps:"
echo "  1. Reboot the server to apply all changes: sudo reboot"
echo "  2. Login as the '$DEPLOY_USER' user: ssh $DEPLOY_USER@server_ip"
echo "  3. Deploy your application using Docker Compose"
echo ""
warning "Open ports for external access:"
echo "  - PostgreSQL: 5432"
echo "  - Redis: 6379" 
echo "  - RedisInsight: 5540"
echo "  - Application: 3000 (if needed)"
echo ""
info "Server IP: $(curl -s ifconfig.me)"
echo ""
