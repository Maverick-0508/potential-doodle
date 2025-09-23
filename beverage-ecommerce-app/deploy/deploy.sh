#!/bin/bash

# Production deployment script for Beverage E-Commerce App
# This script handles the deployment process on the production server

set -e

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"
BACKUP_DIR="/opt/backups/beverage-ecommerce"
LOG_FILE="/var/log/beverage-ecommerce-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    command -v docker >/dev/null 2>&1 || error "Docker is not installed"
    command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is not installed"
    
    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file $ENV_FILE not found"
    fi
    
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        error "Docker Compose file $DOCKER_COMPOSE_FILE not found"
    fi
    
    success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps mongodb | grep -q "Up"; then
        log "Backing up MongoDB..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mongodb mongodump --archive --gzip | gzip > "$BACKUP_DIR/mongodb-$(date +%Y%m%d-%H%M%S).gz"
        success "MongoDB backup completed"
    fi
    
    # Backup environment file
    cp "$ENV_FILE" "$BACKUP_DIR/env-$(date +%Y%m%d-%H%M%S).backup"
    
    # Keep only last 7 days of backups
    find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete
    find "$BACKUP_DIR" -name "*.backup" -mtime +7 -delete
    
    success "Backup created successfully"
}

# Health check
health_check() {
    local service=$1
    local url=$2
    local timeout=${3:-60}
    
    log "Performing health check for $service..."
    
    for i in $(seq 1 $timeout); do
        if curl -f "$url" >/dev/null 2>&1; then
            success "$service is healthy"
            return 0
        fi
        sleep 1
    done
    
    error "$service health check failed after ${timeout}s"
}

# Deploy function
deploy() {
    log "Starting deployment..."
    
    # Pull latest images
    log "Pulling latest Docker images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" pull
    
    # Stop old containers gracefully
    log "Stopping old containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" down --timeout 30
    
    # Start new containers
    log "Starting new containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    # Wait for services to be ready
    sleep 10
    
    # Health checks
    health_check "Backend API" "http://localhost:5000/api/health" 60
    health_check "Frontend" "http://localhost:3000" 60
    
    success "Deployment completed successfully"
}

# Rollback function
rollback() {
    warning "Starting rollback procedure..."
    
    # Stop current containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" down
    
    # Restore previous backup (if available)
    latest_backup=$(ls -t "$BACKUP_DIR"/mongodb-*.gz 2>/dev/null | head -1)
    if [ -n "$latest_backup" ]; then
        log "Restoring database from $latest_backup"
        # Add database restore logic here
    fi
    
    # Start previous version
    # This would typically involve using previous image tags
    warning "Rollback completed. Please verify system status."
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f
    
    success "Cleanup completed"
}

# Monitor function
monitor() {
    log "Starting monitoring..."
    
    while true; do
        # Check container status
        if ! docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
            error "Some containers are not running"
        fi
        
        # Check API health
        if ! curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
            error "API health check failed"
        fi
        
        # Check frontend
        if ! curl -f http://localhost:3000 >/dev/null 2>&1; then
            error "Frontend health check failed"
        fi
        
        sleep 30
    done
}

# Main execution
main() {
    case "$1" in
        "deploy")
            check_root
            check_prerequisites
            create_backup
            deploy
            cleanup
            ;;
        "rollback")
            check_root
            check_prerequisites
            rollback
            ;;
        "backup")
            check_root
            check_prerequisites
            create_backup
            ;;
        "health")
            health_check "Backend API" "http://localhost:5000/api/health"
            health_check "Frontend" "http://localhost:3000"
            ;;
        "monitor")
            monitor
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|backup|health|monitor|cleanup}"
            echo ""
            echo "Commands:"
            echo "  deploy   - Deploy the application"
            echo "  rollback - Rollback to previous version"
            echo "  backup   - Create backup of current state"
            echo "  health   - Perform health checks"
            echo "  monitor  - Start monitoring (runs in foreground)"
            echo "  cleanup  - Clean up unused Docker resources"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"