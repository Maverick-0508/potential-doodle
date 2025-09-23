#!/bin/bash

# Development helper script for Beverage E-Commerce App
# This script provides common development tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null
}

# Function to wait for service
wait_for_service() {
    local host=$1
    local port=$2
    local service=$3
    local timeout=${4:-30}
    
    print_status "Waiting for $service to be ready..."
    for i in $(seq 1 $timeout); do
        if nc -z $host $port 2>/dev/null; then
            print_success "$service is ready!"
            return 0
        fi
        sleep 1
    done
    print_error "$service failed to start within ${timeout}s"
    return 1
}

# Function to install dependencies
install_deps() {
    print_status "Installing dependencies..."
    
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
        print_success "Frontend dependencies installed"
    fi
    
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        print_status "Installing backend dependencies..."
        cd backend
        npm install
        cd ..
        print_success "Backend dependencies installed"
    fi
}

# Function to setup environment files
setup_env() {
    print_status "Setting up environment files..."
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example backend/.env
            print_success "Created backend/.env from .env.example"
        else
            print_warning "No .env.example found, creating basic backend/.env"
            cat > backend/.env << 'EOF'
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/beverage_ecommerce
JWT_SECRET=development-jwt-secret-key-32-chars-long
FRONTEND_URL=http://localhost:3001
EOF
        fi
    else
        print_warning "backend/.env already exists"
    fi
    
    # Frontend .env.local
    if [ ! -f "frontend/.env.local" ]; then
        cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001
NEXT_PUBLIC_ENVIRONMENT=development
EOF
        print_success "Created frontend/.env.local"
    else
        print_warning "frontend/.env.local already exists"
    fi
}

# Function to start MongoDB
start_mongodb() {
    print_status "Starting MongoDB..."
    
    if command_exists docker-compose && [ -f ".devcontainer/docker-compose.yml" ]; then
        docker-compose -f .devcontainer/docker-compose.yml up -d mongodb
        wait_for_service localhost 27017 "MongoDB"
    elif command_exists docker; then
        docker run -d --name beverage-mongo -p 27017:27017 mongo:7-jammy
        wait_for_service localhost 27017 "MongoDB"
    else
        print_error "Docker not found. Please install Docker or start MongoDB manually"
        return 1
    fi
}

# Function to start backend
start_backend() {
    print_status "Starting backend server..."
    
    if [ ! -d "backend" ]; then
        print_error "Backend directory not found"
        return 1
    fi
    
    cd backend
    
    if [ ! -f ".env" ]; then
        print_error "Backend .env file not found. Run './dev.sh setup' first"
        cd ..
        return 1
    fi
    
    if port_in_use 5000; then
        print_warning "Port 5000 is already in use"
        cd ..
        return 1
    fi
    
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    wait_for_service localhost 5000 "Backend API"
    print_success "Backend started at http://localhost:5000"
}

# Function to start frontend
start_frontend() {
    print_status "Starting frontend server..."
    
    if [ ! -d "frontend" ]; then
        print_error "Frontend directory not found"
        return 1
    fi
    
    cd frontend
    
    if [ ! -f ".env.local" ]; then
        print_error "Frontend .env.local file not found. Run './dev.sh setup' first"
        cd ..
        return 1
    fi
    
    if port_in_use 3001; then
        print_warning "Port 3001 is already in use"
        cd ..
        return 1
    fi
    
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    wait_for_service localhost 3001 "Frontend"
    print_success "Frontend started at http://localhost:3001"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Backend tests
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        print_status "Running backend tests..."
        cd backend
        npm test
        cd ..
    fi
    
    # Frontend tests
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_status "Running frontend tests..."
        cd frontend
        npm test -- --watchAll=false
        cd ..
    fi
    
    print_success "All tests completed"
}

# Function to lint code
lint_code() {
    print_status "Linting code..."
    
    # Backend linting
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        print_status "Linting backend..."
        cd backend
        npm run lint 2>/dev/null || echo "No lint script found for backend"
        cd ..
    fi
    
    # Frontend linting
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_status "Linting frontend..."
        cd frontend
        npm run lint 2>/dev/null || echo "No lint script found for frontend"
        cd ..
    fi
    
    print_success "Linting completed"
}

# Function to build for production
build_prod() {
    print_status "Building for production..."
    
    # Backend build
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        print_status "Building backend..."
        cd backend
        npm run build 2>/dev/null || echo "No build script found for backend"
        cd ..
    fi
    
    # Frontend build
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        print_status "Building frontend..."
        cd frontend
        npm run build
        cd ..
    fi
    
    print_success "Production build completed"
}

# Function to clean project
clean_project() {
    print_status "Cleaning project..."
    
    # Remove node_modules
    find . -name "node_modules" -type d -prune -exec rm -rf {} +
    
    # Remove build artifacts
    rm -rf frontend/.next
    rm -rf frontend/out
    rm -rf backend/dist
    rm -rf backend/build
    
    # Remove logs
    find . -name "*.log" -delete
    
    print_success "Project cleaned"
}

# Function to show status
show_status() {
    print_status "Development Environment Status"
    echo ""
    
    # Check MongoDB
    if port_in_use 27017; then
        print_success "✅ MongoDB: Running on port 27017"
    else
        print_warning "❌ MongoDB: Not running"
    fi
    
    # Check Backend
    if port_in_use 5000; then
        print_success "✅ Backend API: Running on port 5000"
    else
        print_warning "❌ Backend API: Not running"
    fi
    
    # Check Frontend
    if port_in_use 3001; then
        print_success "✅ Frontend: Running on port 3001"
    else
        print_warning "❌ Frontend: Not running"
    fi
    
    echo ""
    print_status "Quick Links:"
    echo "  Frontend: http://localhost:3001"
    echo "  Backend API: http://localhost:5000"
    echo "  API Health: http://localhost:5000/api/health"
    echo ""
}

# Function to stop all services
stop_services() {
    print_status "Stopping services..."
    
    # Kill processes on specific ports
    if port_in_use 3001; then
        lsof -ti:3001 | xargs kill -9 2>/dev/null || true
        print_success "Frontend stopped"
    fi
    
    if port_in_use 5000; then
        lsof -ti:5000 | xargs kill -9 2>/dev/null || true
        print_success "Backend stopped"
    fi
    
    # Stop Docker containers
    if command_exists docker-compose && [ -f ".devcontainer/docker-compose.yml" ]; then
        docker-compose -f .devcontainer/docker-compose.yml down
        print_success "Docker services stopped"
    fi
}

# Function to show help
show_help() {
    echo "Beverage E-Commerce Development Helper"
    echo ""
    echo "Usage: ./dev.sh <command>"
    echo ""
    echo "Commands:"
    echo "  setup     - Install dependencies and setup environment files"
    echo "  start     - Start all services (MongoDB, Backend, Frontend)"
    echo "  stop      - Stop all running services"
    echo "  mongo     - Start only MongoDB"
    echo "  backend   - Start only backend server"
    echo "  frontend  - Start only frontend server"
    echo "  test      - Run all tests"
    echo "  lint      - Lint all code"
    echo "  build     - Build for production"
    echo "  clean     - Clean project (remove node_modules, builds, logs)"
    echo "  status    - Show status of all services"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh setup    # First time setup"
    echo "  ./dev.sh start    # Start development environment"
    echo "  ./dev.sh status   # Check what's running"
    echo ""
}

# Main script logic
case "$1" in
    "setup")
        install_deps
        setup_env
        print_success "Setup completed! Run './dev.sh start' to begin development"
        ;;
    "start")
        start_mongodb
        sleep 2
        start_backend
        sleep 2
        start_frontend
        echo ""
        show_status
        print_success "Development environment is ready!"
        print_status "Press Ctrl+C to stop all services"
        
        # Keep script running and handle cleanup
        trap 'stop_services; exit' INT TERM
        wait
        ;;
    "stop")
        stop_services
        ;;
    "mongo")
        start_mongodb
        ;;
    "backend")
        start_backend
        trap 'stop_services; exit' INT TERM
        wait
        ;;
    "frontend")
        start_frontend
        trap 'stop_services; exit' INT TERM
        wait
        ;;
    "test")
        run_tests
        ;;
    "lint")
        lint_code
        ;;
    "build")
        build_prod
        ;;
    "clean")
        clean_project
        ;;
    "status")
        show_status
        ;;
    "help"|""|*)
        show_help
        ;;
esac