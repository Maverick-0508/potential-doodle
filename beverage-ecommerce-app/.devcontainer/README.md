# Dev Container Configuration

This directory contains the development container configuration for the Beverage E-Commerce application.

## 🚀 Quick Start

### Option 1: Using VS Code Dev Containers Extension
1. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open the project in VS Code
3. Press `Ctrl+Shift+P` and select "Dev Containers: Reopen in Container"
4. Wait for the container to build and start

### Option 2: Using Docker Compose
```bash
# Build and start the dev container
docker-compose -f .devcontainer/docker-compose.yml up -d

# Execute bash inside the container
docker-compose -f .devcontainer/docker-compose.yml exec app bash
```

## 📁 File Structure

```
.devcontainer/
├── devcontainer.json     # Dev container configuration
├── docker-compose.yml    # Multi-service setup
├── Dockerfile           # Container image definition
├── setup.sh            # Post-creation setup script
├── mongodb-init/       # MongoDB initialization
│   └── init.js
└── README.md           # This file
```

## 🛠 What's Included

### Development Tools
- **Node.js 20** - Latest LTS version
- **npm & yarn** - Package managers
- **MongoDB 7** - Database with initialization scripts
- **Redis** - Caching and session storage
- **Git** - Version control with hooks
- **Docker** - Container management

### VS Code Extensions
- **Node.js Development**: Debugging, IntelliSense
- **React/Next.js**: JSX support, component tools
- **Database**: MongoDB explorer and query tools
- **Git**: GitLens, GitHub integration
- **Code Quality**: ESLint, Prettier, formatting
- **GitHub Copilot**: AI-powered coding assistance

### Pre-configured Services
- **Frontend**: Next.js on port 3001
- **Backend**: Express API on port 5000
- **Database**: MongoDB on port 27017
- **Cache**: Redis on port 6379

## 🔧 Configuration Details

### Port Forwarding
The dev container automatically forwards these ports:
- `3000/3001` - Frontend development server
- `5000` - Backend API server
- `27017` - MongoDB database
- `6379` - Redis cache
- `9229` - Node.js debugging

### Environment Variables
```bash
NODE_ENV=development
MONGO_URI=mongodb://mongodb:27017/beverage_ecommerce
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:5000
```

### Volume Mounts
- Project files are mounted at `/workspace`
- MongoDB data persists in `mongodb-data` volume
- Redis data persists in `redis-data` volume

## 🚀 Development Workflow

### 1. Container Setup
The setup script automatically:
- Installs frontend and backend dependencies
- Creates environment files
- Sets up VS Code workspace
- Configures Git hooks
- Creates development scripts

### 2. Starting Services

#### Using VS Code Tasks
Press `Ctrl+Shift+P` and run:
- **"Tasks: Run Task"** → **"Start Full Stack"**

#### Using Scripts
```bash
# Start all services
./start-dev.sh

# Or start individually
cd backend && npm run dev    # Backend
cd frontend && npm run dev   # Frontend
```

### 3. Database Access
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/beverage_ecommerce

# Using VS Code MongoDB extension
# Use connection string: mongodb://localhost:27017
```

## 🧪 Testing & Debugging

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test
```

### Debugging
- Backend: Use VS Code debugger (F5) with "Debug Backend" configuration
- Frontend: Attach debugger to port 9229
- Database: Use MongoDB VS Code extension

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `./start-dev.sh` | Start all development services |
| `npm run dev` | Start individual service (backend/frontend) |
| `npm test` | Run tests |
| `npm run lint` | Code linting |
| `npm run build` | Production build |

## 🔐 Security Features

### Development Security
- Environment variables isolated in container
- Database with authentication
- Redis with persistence
- Git hooks for code quality

### Production Considerations
- Environment files are gitignored
- Secrets should be managed externally
- Container runs with non-root user
- Network isolation between services

## 🐛 Troubleshooting

### Container Issues
```bash
# Rebuild container
docker-compose -f .devcontainer/docker-compose.yml build --no-cache

# View logs
docker-compose -f .devcontainer/docker-compose.yml logs

# Restart services
docker-compose -f .devcontainer/docker-compose.yml restart
```

### Database Issues
```bash
# Reset MongoDB data
docker-compose -f .devcontainer/docker-compose.yml down -v
docker-compose -f .devcontainer/docker-compose.yml up -d

# Check MongoDB status
docker-compose -f .devcontainer/docker-compose.yml exec mongodb mongosh --eval "db.adminCommand('ismaster')"
```

### Port Conflicts
If ports are already in use:
1. Update `forwardPorts` in `devcontainer.json`
2. Update `docker-compose.yml` port mappings
3. Update environment variables accordingly

## 🚀 Performance Tips

### Container Performance
- Use `.dockerignore` to exclude unnecessary files
- Mount node_modules as volumes for better performance
- Use multi-stage builds for production

### Development Performance
- Keep container running (don't stop/start frequently)
- Use file watching for hot reload
- Leverage VS Code's remote development features

## 📦 Extending the Container

### Adding New Services
1. Update `docker-compose.yml` with new service
2. Add port forwarding in `devcontainer.json`
3. Update `setup.sh` for initialization
4. Add VS Code tasks if needed

### Adding Development Tools
1. Update `Dockerfile` with new packages
2. Add VS Code extensions in `devcontainer.json`
3. Update setup script for configuration

This dev container provides a complete, isolated development environment that ensures consistency across different machines and team members.