#!/bin/bash

# Setup script for dev container
echo "🚀 Setting up Beverage E-Commerce Development Environment..."

# Navigate to workspace
cd /workspace || exit 1

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    echo "❌ Error: Not in the beverage e-commerce app directory"
    exit 1
fi

# Function to install dependencies
install_dependencies() {
    local dir=$1
    local name=$2
    
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
        echo "📦 Installing $name dependencies..."
        cd "$dir" || return 1
        npm install
        cd - > /dev/null || return 1
        echo "✅ $name dependencies installed"
    else
        echo "⚠️  $name directory not found or no package.json"
    fi
}

# Install frontend dependencies
install_dependencies "frontend" "Frontend"

# Install backend dependencies  
install_dependencies "backend" "Backend"

# Setup git hooks (if .git exists)
if [ -d ".git" ]; then
    echo "🔧 Setting up Git hooks..."
    
    # Create pre-commit hook for code formatting
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Run prettier on staged files
staged_files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|jsx|ts|tsx|json|css|scss|md)$')
if [ -n "$staged_files" ]; then
    echo "Running Prettier on staged files..."
    npx prettier --write $staged_files
    git add $staged_files
fi
EOF
    chmod +x .git/hooks/pre-commit
    echo "✅ Git hooks configured"
fi

# Create environment files if they don't exist
echo "🔧 Setting up environment files..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    cat > backend/.env << 'EOF'
# Development Environment Configuration
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://mongodb:27017/beverage_ecommerce

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-that-should-be-at-least-32-characters-long

# M-Pesa Configuration (Sandbox)
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_mpesa_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/wallet/mpesa/callback

# CORS Configuration
FRONTEND_URL=http://localhost:3001

# Session Configuration
SESSION_SECRET=your-session-secret-key-here
EOF
    echo "✅ Backend .env file created"
else
    echo "⚠️  Backend .env file already exists"
fi

# Frontend .env.local
if [ ! -f "frontend/.env.local" ]; then
    cat > frontend/.env.local << 'EOF'
# Frontend Environment Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001
NEXT_PUBLIC_ENVIRONMENT=development
EOF
    echo "✅ Frontend .env.local file created"
else
    echo "⚠️  Frontend .env.local file already exists"
fi

# Create VSCode workspace settings
echo "🎯 Setting up VS Code workspace..."
mkdir -p .vscode

# Create tasks.json
cat > .vscode/tasks.json << 'EOF'
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Install All Dependencies",
            "type": "shell",
            "command": "npm install",
            "options": {
                "cwd": "${workspaceFolder}/frontend"
            },
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            },
            "dependsOrder": "sequence",
            "dependsOn": "Install Backend Dependencies"
        },
        {
            "label": "Install Backend Dependencies",
            "type": "shell",
            "command": "npm install",
            "options": {
                "cwd": "${workspaceFolder}/backend"
            },
            "group": "build"
        },
        {
            "label": "Start MongoDB",
            "type": "shell",
            "command": "docker-compose up -d mongodb",
            "options": {
                "cwd": "${workspaceFolder}/.devcontainer"
            },
            "group": "build",
            "isBackground": true,
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            }
        },
        {
            "label": "Start Backend Server",
            "type": "shell",
            "command": "npm run dev",
            "options": {
                "cwd": "${workspaceFolder}/backend"
            },
            "group": "build",
            "isBackground": true,
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            }
        },
        {
            "label": "Start Frontend Server",
            "type": "shell",
            "command": "npm run dev",
            "options": {
                "cwd": "${workspaceFolder}/frontend"
            },
            "group": "build",
            "isBackground": true,
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            }
        },
        {
            "label": "Start Full Stack",
            "dependsOn": [
                "Start Backend Server",
                "Start Frontend Server"
            ],
            "group": "build",
            "isBackground": true
        },
        {
            "label": "Lint Frontend",
            "type": "shell",
            "command": "npm run lint",
            "options": {
                "cwd": "${workspaceFolder}/frontend"
            },
            "group": "test"
        },
        {
            "label": "Test Backend",
            "type": "shell",
            "command": "npm test",
            "options": {
                "cwd": "${workspaceFolder}/backend"
            },
            "group": "test"
        }
    ]
}
EOF

# Create launch.json for debugging
cat > .vscode/launch.json << 'EOF'
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Backend",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/backend/src/index.js",
            "env": {
                "NODE_ENV": "development"
            },
            "envFile": "${workspaceFolder}/backend/.env",
            "console": "integratedTerminal",
            "restart": true,
            "runtimeArgs": ["--inspect"],
            "skipFiles": ["<node_internals>/**"]
        },
        {
            "name": "Debug Frontend",
            "type": "node",
            "request": "attach",
            "port": 9229,
            "address": "localhost",
            "localRoot": "${workspaceFolder}/frontend",
            "remoteRoot": "${workspaceFolder}/frontend",
            "skipFiles": ["<node_internals>/**"]
        }
    ]
}
EOF

# Create settings.json
cat > .vscode/settings.json << 'EOF'
{
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "javascript.preferences.importModuleSpecifier": "relative",
    "typescript.preferences.importModuleSpecifier": "relative",
    "emmet.includeLanguages": {
        "javascript": "javascriptreact"
    },
    "files.associations": {
        "*.env*": "dotenv"
    },
    "search.exclude": {
        "**/node_modules": true,
        "**/build": true,
        "**/.next": true,
        "**/dist": true
    },
    "files.exclude": {
        "**/node_modules": true,
        "**/.git": false,
        "**/.DS_Store": true
    }
}
EOF

echo "✅ VS Code workspace configured"

# Create development scripts
echo "📝 Creating development scripts..."

cat > start-dev.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Beverage E-Commerce Development Environment..."

# Start MongoDB
echo "📊 Starting MongoDB..."
docker-compose -f .devcontainer/docker-compose.yml up -d mongodb

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to start..."
until docker-compose -f .devcontainer/docker-compose.yml exec mongodb mongosh --eval "print('MongoDB is ready')" > /dev/null 2>&1; do
    sleep 2
done

echo "✅ MongoDB is ready!"

# Start backend in background
echo "🔧 Starting Backend API..."
cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend in background  
echo "🎨 Starting Frontend..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "🎉 Development servers started!"
echo "📍 Frontend: http://localhost:3001"
echo "📍 Backend API: http://localhost:5000"
echo "📍 MongoDB: mongodb://localhost:27017"

# Keep script running
wait $BACKEND_PID $FRONTEND_PID
EOF

chmod +x start-dev.sh

echo "✅ Development scripts created"

# Display completion message
echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "📍 Available services:"
echo "   - Frontend: http://localhost:3001"
echo "   - Backend API: http://localhost:5000"
echo "   - MongoDB: mongodb://localhost:27017"
echo ""
echo "🚀 To start development:"
echo "   1. Run: ./start-dev.sh"
echo "   2. Or use VS Code tasks (Ctrl+Shift+P > Tasks: Run Task)"
echo ""
echo "🔧 Configuration files created:"
echo "   - .devcontainer/ (Dev container configuration)"
echo "   - .vscode/ (VS Code workspace settings)"
echo "   - backend/.env (Backend environment variables)"
echo "   - frontend/.env.local (Frontend environment variables)"
echo ""