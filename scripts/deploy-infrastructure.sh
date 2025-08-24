#!/bin/bash

# Deploy Infrastructure Script (PostgreSQL + Redis)
# Run this ONCE to setup database and Redis
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if we're in the right directory
if [[ ! -f "docker-compose.infrastructure.yml" ]]; then
    error "docker-compose.infrastructure.yml not found. Run this script from the project root."
fi

# Check if .env.production exists (created by GitHub Actions or manually)
if [[ ! -f ".env.production" ]]; then
    warning ".env.production not found."
    echo "This file should be created by GitHub Actions deployment or manually from env.template"
    echo "For manual deployment, create .env.production with actual values from env.template"
    exit 1
fi

log "🏗️ Starting infrastructure deployment..."

# Load environment variables
set -a
source .env.production
set +a

# Validate required environment variables
required_vars=("DATABASE_PASSWORD" "DATABASE_USERNAME" "DATABASE_NAME")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        error "Required environment variable $var is not set"
    fi
done

# Create required directories
log "📁 Creating required directories..."
sudo mkdir -p /opt/alert-monitor/data/{postgres,redis,redisinsight}
sudo mkdir -p /opt/alert-monitor/{backups,config,logs}
sudo chown -R $(whoami):$(whoami) /opt/alert-monitor

# Copy configuration files
log "📝 Copying configuration files..."
cp config/postgresql.conf /opt/alert-monitor/config/
cp config/redis.conf /opt/alert-monitor/config/

# Create Docker network (if not exists)
log "🌐 Creating Docker network..."
if ! docker network ls | grep -q alert-monitor-network; then
    docker network create alert-monitor-network --driver bridge --subnet=172.20.0.0/16
    info "Docker network 'alert-monitor-network' created"
else
    info "Docker network 'alert-monitor-network' already exists"
fi

# Stop existing infrastructure (if running)
log "⏹️ Stopping existing infrastructure..."
docker-compose -f docker-compose.infrastructure.yml down || true

# Pull latest images
log "📦 Pulling latest Docker images..."
docker-compose -f docker-compose.infrastructure.yml pull

# Start infrastructure
log "🚀 Starting infrastructure services..."
docker-compose -f docker-compose.infrastructure.yml up -d

# Wait for services to be healthy
log "⏳ Waiting for services to be healthy..."
timeout=60
counter=0

while [[ $counter -lt $timeout ]]; do
    if docker-compose -f docker-compose.infrastructure.yml ps | grep -q "healthy"; then
        break
    fi
    sleep 2
    ((counter += 2))
    echo -n "."
done
echo ""

# Check service status
log "🔍 Checking service status..."
docker-compose -f docker-compose.infrastructure.yml ps

# Test connections
log "🧪 Testing database connection..."
if docker exec alert-monitor-postgres pg_isready -U "$DATABASE_USERNAME" -d "$DATABASE_NAME"; then
    info "✅ PostgreSQL is ready"
else
    error "❌ PostgreSQL connection failed"
fi

log "🧪 Testing Redis connection..."
if docker exec alert-monitor-redis redis-cli -a "$REDIS_PASSWORD" ping | grep -q "PONG"; then
    info "✅ Redis is ready"
else
    error "❌ Redis connection failed"
fi

# Display connection information
echo ""
log "🎉 Infrastructure deployment completed successfully!"
echo ""
info "Connection details:"
echo "  PostgreSQL:"
echo "    Host: $(hostname -I | awk '{print $1}') or your-server-ip"
echo "    Port: 5432"
echo "    Database: $DATABASE_NAME"
echo "    Username: $DATABASE_USERNAME"
echo ""
echo "  Redis:"
echo "    Host: $(hostname -I | awk '{print $1}') or your-server-ip"
echo "    Port: 6379"
echo ""
echo "  RedisInsight Web UI:"
echo "    URL: http://$(hostname -I | awk '{print $1}'):5540 or http://your-server-ip:5540"
echo ""
warning "Next steps:"
echo "  1. Test connections from your laptop"
echo "  2. Run database migrations if needed"
echo "  3. Deploy your application using deploy-application.sh"
echo ""
