# 🐳 Development Container Setup

This project includes a complete development container configuration that provides a consistent, isolated development environment for the Beverage E-Commerce application.

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [VS Code](https://code.visualstudio.com/)
- [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Option 1: VS Code Dev Containers (Recommended)
1. **Open in VS Code**: Open this project folder in VS Code
2. **Reopen in Container**: When prompted, click "Reopen in Container" or press `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"
3. **Wait for Setup**: The container will build and run the setup script automatically
4. **Start Development**: Use `./dev.sh start` or VS Code tasks to begin

### Option 2: Docker Compose
```bash
# Clone and navigate to project
git clone <repository-url>
cd beverage-e-commerce-app

# Start dev container services
docker-compose -f .devcontainer/docker-compose.yml up -d

# Execute into the app container
docker-compose -f .devcontainer/docker-compose.yml exec app bash

# Run setup (inside container)
./.devcontainer/setup.sh

# Start development servers
./dev.sh start
```

## 📦 What's Included

### 🛠 Development Tools
- **Node.js 20 LTS** - Latest stable version
- **npm & Global Packages** - nodemon, pm2, TypeScript, Jest, ESLint, Prettier
- **MongoDB 7** - Document database with initialization scripts
- **Redis 7** - In-memory cache and session store
- **MongoDB Tools** - mongosh, database tools
- **Git & GitHub CLI** - Version control with enhanced tooling

### 🎯 VS Code Configuration
- **30+ Extensions** - Optimized for full-stack JavaScript/TypeScript development
- **Integrated Debugging** - Backend and frontend debugging configurations
- **Tasks & Scripts** - Pre-configured build, test, and run tasks
- **IntelliSense** - Smart code completion for Node.js, React, MongoDB
- **Git Integration** - GitLens, GitHub integration, pull request management

### 🌐 Services & Ports
| Service | Port | Description |
|---------|------|-------------|
| Frontend (Next.js) | 3001 | React application |
| Backend (Express) | 5000 | REST API server |
| MongoDB | 27017 | Document database |
| Redis | 6379 | Cache & sessions |
| Node Debug | 9229 | Debug port |

## 🔧 Development Workflow

### 1. Initial Setup
The dev container automatically runs setup scripts that:
- ✅ Install all npm dependencies (frontend & backend)
- ✅ Create environment configuration files
- ✅ Set up VS Code workspace settings
- ✅ Configure Git hooks for code quality
- ✅ Initialize MongoDB with indexes and sample data

### 2. Starting Development

#### Using the Helper Script
```bash
# Complete setup (first time only)
./dev.sh setup

# Start all services
./dev.sh start

# Check service status
./dev.sh status

# Stop all services
./dev.sh stop
```

#### Using VS Code Tasks
Press `Ctrl+Shift+P` and search for "Tasks: Run Task":
- **Start Full Stack** - Launches both frontend and backend
- **Start Backend Server** - Express API only
- **Start Frontend Server** - Next.js app only
- **Install All Dependencies** - Reinstall packages

#### Manual Service Management
```bash
# Start MongoDB
docker-compose -f .devcontainer/docker-compose.yml up -d mongodb

# Start backend (in backend/)
cd backend && npm run dev

# Start frontend (in frontend/)
cd frontend && npm run dev
```

### 3. Database Access

#### MongoDB
```bash
# Connect via command line
mongosh mongodb://localhost:27017/beverage_ecommerce

# Using VS Code MongoDB extension
# Connection string: mongodb://localhost:27017
```

#### Redis
```bash
# Connect via command line
redis-cli -p 6379

# Or using Redis extension in VS Code
```

## 🧪 Testing & Quality

### Running Tests
```bash
# All tests
./dev.sh test

# Backend tests only
cd backend && npm test

# Frontend tests only
cd frontend && npm test

# Test with coverage
cd backend && npm run test:coverage
```

### Code Quality
```bash
# Lint all code
./dev.sh lint

# Format code (automatic on save)
npx prettier --write .

# Type checking (if TypeScript)
cd frontend && npm run type-check
```

### Debugging
1. **Backend**: Press `F5` in VS Code or use "Debug Backend" configuration
2. **Frontend**: Attach to process on port 9229
3. **Database**: Use MongoDB VS Code extension for query debugging

## 📁 Project Structure

```
beverage-e-commerce-app/
├── .devcontainer/           # Dev container configuration
│   ├── devcontainer.json    # Container and VS Code settings
│   ├── docker-compose.yml   # Multi-service orchestration
│   ├── Dockerfile          # Container image definition
│   ├── setup.sh            # Automated setup script
│   └── mongodb-init/       # Database initialization
├── .vscode/                # VS Code workspace settings
├── frontend/               # Next.js React application
├── backend/                # Express.js API server
├── dev.sh                  # Development helper script
├── .env.example           # Environment variables template
└── DEV_CONTAINER.md       # This documentation
```

## 🔐 Environment Configuration

### Backend Environment (`.env`)
```bash
# Database
MONGO_URI=mongodb://mongodb:27017/beverage_ecommerce

# Authentication
JWT_SECRET=your-32-character-secret-key

# M-Pesa Integration
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey

# CORS
FRONTEND_URL=http://localhost:3001
```

### Frontend Environment (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001
NEXT_PUBLIC_ENVIRONMENT=development
```

## 🚀 Production Considerations

### Building for Production
```bash
# Build both frontend and backend
./dev.sh build

# Frontend only
cd frontend && npm run build

# Backend only
cd backend && npm run build
```

### Environment Security
- ✅ Environment files are git-ignored
- ✅ Container runs as non-root user
- ✅ Services isolated in Docker network
- ✅ Secrets should be managed externally in production

### Performance Optimization
- ✅ Multi-stage Docker builds for smaller images
- ✅ Node modules cached in volumes
- ✅ Hot reload enabled for development
- ✅ MongoDB indexes pre-configured

## 🐛 Troubleshooting

### Container Issues
```bash
# Rebuild container from scratch
docker-compose -f .devcontainer/docker-compose.yml build --no-cache

# View service logs
docker-compose -f .devcontainer/docker-compose.yml logs mongodb
docker-compose -f .devcontainer/docker-compose.yml logs app

# Reset all data
docker-compose -f .devcontainer/docker-compose.yml down -v
```

### Port Conflicts
If you see "port already in use" errors:
```bash
# Check what's using the port
lsof -i :5000
lsof -i :3001
lsof -i :27017

# Kill processes on specific ports
./dev.sh stop
```

### Database Issues
```bash
# Reset MongoDB data
docker-compose -f .devcontainer/docker-compose.yml down -v
docker-compose -f .devcontainer/docker-compose.yml up -d mongodb

# Check MongoDB status
mongosh --eval "db.adminCommand('ismaster')"
```

### Dependency Issues
```bash
# Clean and reinstall everything
./dev.sh clean
./dev.sh setup
```

## 🔄 Updating the Dev Container

### Adding New Services
1. Update `docker-compose.yml` with new service definition
2. Add port forwarding in `devcontainer.json`
3. Update setup script for initialization
4. Add corresponding VS Code tasks

### Adding VS Code Extensions
1. Update `extensions` array in `devcontainer.json`
2. Rebuild container: "Dev Containers: Rebuild Container"

### Modifying Container Image
1. Update `Dockerfile` with new packages or tools
2. Rebuild: `docker-compose build --no-cache`

## 📚 Additional Resources

- [VS Code Dev Containers Documentation](https://code.visualstudio.com/docs/remote/containers)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [MongoDB Docker Guide](https://hub.docker.com/_/mongo)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

When contributing to this project:
1. Ensure dev container builds successfully
2. Run tests: `./dev.sh test`
3. Lint code: `./dev.sh lint`
4. Update documentation if needed
5. Test in both dev container and local environments

---

This dev container setup ensures that everyone working on the project has exactly the same development environment, reducing "works on my machine" issues and speeding up onboarding for new team members.