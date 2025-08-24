#!/bin/bash

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

# Default values
APP_VERSION="${1:-latest}"
SKIP_BUILD="${2:-false}"

# Check if we're in the right directory
if [[ ! -f "docker-compose.prod.yml" ]]; then
    error "docker-compose.prod.yml not found. Run this script from the project root."
fi

# Check if .env.production exists (created by GitHub Actions or manually)
if [[ ! -f ".env.production" ]]; then
    warning ".env.production not found."
    echo "This file should be created by GitHub Actions deployment or manually from env.template"
    echo "For manual deployment, create .env.production with actual values from env.template"
    exit 1
fi

log "🚀 Starting application deployment (version: $APP_VERSION)..."

# Load environment variables
set -a
source .env.production
set +a

# Override APP_VERSION if provided
export APP_VERSION="$APP_VERSION"

# Validate required environment variables
required_vars=("BOT_TOKEN" "DATABASE_PASSWORD")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" || "${!var}" == *"your_"* ]]; then
        error "Required environment variable $var is not set or contains placeholder value"
    fi
done

# Check if infrastructure is running
log "🔍 Checking infrastructure status..."
if ! docker ps | grep -q "alert-monitor-postgres"; then
    error "PostgreSQL container is not running. Please run deploy-infrastructure.sh first."
fi

if ! docker ps | grep -q "alert-monitor-redis"; then
    error "Redis container is not running. Please run deploy-infrastructure.sh first."
fi

info "✅ Infrastructure is running"

# Build application image (if not skipped)
if [[ "$SKIP_BUILD" != "true" ]]; then
    log "🏗️ Building application image..."
    docker build -t alert-monitor-ts:$APP_VERSION .
    info "✅ Image built successfully"
else
    log "📦 Using pre-built image from registry..."
    # Image should already be pulled by GitHub Actions
    info "⏭️ Skipping build as requested"
fi

# Create logs directory
sudo mkdir -p /opt/alert-monitor/logs
sudo chown -R $(whoami):$(whoami) /opt/alert-monitor/logs

# Stop existing application (if running)
log "⏹️ Stopping existing application..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Remove old containers (keep images for faster deployment)
docker container prune -f || true

# Start application
log "🚀 Starting application..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for application to be ready
log "⏳ Waiting for application to be ready..."
timeout=120
counter=0

while [[ $counter -lt $timeout ]]; do
    if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
        break
    fi
    sleep 2
    ((counter += 2))
    echo -n "."
done
echo ""

if [[ $counter -ge $timeout ]]; then
    error "❌ Application failed to start within $timeout seconds"
fi

# Check application status
log "🔍 Checking application status..."
docker-compose -f docker-compose.prod.yml ps

# Test application health
log "🧪 Testing application health..."
health_response=$(curl -s http://localhost:3000/api/health || echo "failed")
if [[ "$health_response" != "failed" ]]; then
    info "✅ Application is healthy"
else
    warning "⚠️ Application health check failed, but container is running"
    docker-compose -f docker-compose.prod.yml logs --tail=20 app
fi

# Show logs
log "📋 Recent application logs:"
docker-compose -f docker-compose.prod.yml logs --tail=10 app

# Cleanup old images (keep last 3 versions)
log "🧹 Cleaning up old images..."
docker image prune -f || true
old_images=$(docker images alert-monitor-ts --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | tail -n +2 | sort -k2 -r | tail -n +4 | awk '{print $1}')
if [[ -n "$old_images" ]]; then
    echo "$old_images" | xargs docker rmi || true
    info "Old images cleaned up"
fi

# Display connection information
echo ""
log "🎉 Application deployment completed successfully!"
echo ""
info "Application details:"
echo "  URL: http://$(hostname -I | awk '{print $1}'):3000 or http://your-server-ip:3000"
echo "  Health: http://$(hostname -I | awk '{print $1}'):3000/api/health"
echo "  Version: $APP_VERSION"
echo ""
info "Infrastructure access:"
echo "  PostgreSQL: $(hostname -I | awk '{print $1}'):5432"
echo "  Redis: $(hostname -I | awk '{print $1}'):6379"
echo "  RedisInsight: http://$(hostname -I | awk '{print $1}'):5540"
echo ""
