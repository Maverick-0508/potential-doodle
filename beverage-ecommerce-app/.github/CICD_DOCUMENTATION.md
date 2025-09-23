# CI/CD Pipeline Documentation

This document describes the comprehensive CI/CD pipeline setup for the Beverage E-Commerce application.

## 🚀 Pipeline Overview

The CI/CD pipeline consists of multiple workflows that handle different aspects of the development and deployment process:

### 1. **Main CI/CD Pipeline** (`ci-cd.yml`)
- **Triggers**: Push to `main`/`develop`, Pull Requests
- **Stages**: Test → Security → Build → Deploy
- **Features**: 
  - Parallel testing for frontend and backend
  - Security scanning with CodeQL
  - Docker image building and pushing
  - Environment-specific deployments

### 2. **Code Quality Check** (`code-quality.yml`)
- **Triggers**: Pull Requests, Push to main branches
- **Checks**: ESLint, Prettier, TypeScript, Security audits
- **Purpose**: Maintain code quality standards

### 3. **Performance Testing** (`performance.yml`)
- **Triggers**: Daily schedule, Manual trigger, Push to main
- **Tests**: Lighthouse performance tests, Load testing with Artillery
- **Purpose**: Monitor application performance

### 4. **Dependency Updates** (`dependency-update.yml`)
- **Triggers**: Weekly schedule
- **Action**: Automated dependency updates via Pull Requests
- **Purpose**: Keep dependencies secure and up-to-date

### 5. **Release Management** (`release.yml`)
- **Triggers**: Git tags (`v*`), Manual workflow dispatch
- **Action**: Create GitHub releases with changelogs and Docker images
- **Purpose**: Automate release process

## 🔧 Setup Instructions

### 1. Repository Secrets

Configure the following secrets in GitHub Settings → Secrets and variables → Actions:

#### Required Secrets
```bash
# Production URLs
PRODUCTION_API_URL=https://api.your-domain.com
PRODUCTION_FRONTEND_URL=https://your-domain.com

# Database
MONGO_URI=mongodb://your-mongo-connection-string
JWT_SECRET=your-32-character-jwt-secret

# M-Pesa (Production)
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_SHORTCODE=your_production_shortcode
MPESA_PASSKEY=your_production_passkey

# Container Registry (automatically provided)
GITHUB_TOKEN=automatically_provided_by_github

# Optional: Lighthouse CI
LHCI_GITHUB_APP_TOKEN=your_lighthouse_ci_token
```

### 2. Environment Configuration

#### Staging Environment
- Name: `staging`
- Protection rules: None
- Secrets: Same as production but with staging values

#### Production Environment
- Name: `production`
- Protection rules: Required reviewers, Wait timer
- Secrets: Production values

### 3. Branch Protection Rules

Configure branch protection for `main` and `develop`:

```yaml
Protection Rules:
  - Require pull request reviews
  - Require status checks to pass:
    - test (frontend)
    - test (backend)
    - security
    - code-quality
  - Require branches to be up to date
  - Restrict pushes that create files larger than 100MB
```

## 📦 Docker Images

The pipeline builds and pushes Docker images to GitHub Container Registry:

```bash
# Frontend image
ghcr.io/maverick-0508/potential-doodle/frontend:latest
ghcr.io/maverick-0508/potential-doodle/frontend:main-abc1234

# Backend image
ghcr.io/maverick-0508/potential-doodle/backend:latest
ghcr.io/maverick-0508/potential-doodle/backend:main-abc1234
```

## 🚀 Deployment Process

### Automatic Deployments

1. **Develop Branch** → Staging Environment
   - Triggered on push to `develop`
   - Uses staging secrets and configuration
   - No manual approval required

2. **Main Branch** → Production Environment
   - Triggered on push to `main`
   - Uses production secrets and configuration
   - Requires manual approval (if configured)

### Manual Deployments

Use the deployment script for manual deployments:

```bash
# On production server
cd /opt/beverage-ecommerce
./deploy/deploy.sh deploy
```

### Release Process

1. **Create Release**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Automatic Actions**:
   - GitHub release created with changelog
   - Docker images tagged with version
   - Production deployment triggered

## 🔍 Monitoring & Health Checks

### Application Health Checks

The pipeline includes health checks for:
- **API Health**: `GET /api/health`
- **Frontend**: `GET /` (status 200)
- **Database**: MongoDB connection test

### Performance Monitoring

- **Lighthouse CI**: Daily performance testing
- **Load Testing**: Artillery-based load tests
- **Metrics**: Performance budgets and thresholds

### Error Handling

- **Failed Deployments**: Automatic rollback capabilities
- **Failed Tests**: Pipeline stops, notifications sent
- **Performance Degradation**: Alerts and reports

## 📊 Quality Gates

### Code Quality Requirements

- **ESLint**: No errors, warnings allowed
- **Test Coverage**: Minimum 80% (configurable)
- **Security Audit**: No high-severity vulnerabilities
- **Performance**: Lighthouse scores > 80

### Security Requirements

- **CodeQL**: No security vulnerabilities
- **Dependency Audit**: No high-risk packages
- **Container Scanning**: Base images scanned
- **Secrets Detection**: No hardcoded secrets

## 🔧 Customization

### Adding New Environments

1. Create environment in GitHub Settings
2. Add environment-specific secrets
3. Update `ci-cd.yml` with new deployment job
4. Create environment-specific configuration

### Modifying Build Process

1. **Frontend Build**: Update `frontend/Dockerfile`
2. **Backend Build**: Update `backend/Dockerfile`
3. **Pipeline Steps**: Modify workflow YAML files
4. **Tests**: Update test scripts in `package.json`

### Custom Deployment Targets

The pipeline supports various deployment targets:

- **Cloud Platforms**: Vercel, Netlify, Railway, Digital Ocean
- **Container Orchestration**: Kubernetes, Docker Swarm
- **Traditional Servers**: SSH deployment with scripts
- **Serverless**: AWS Lambda, Cloudflare Workers

## 🐛 Troubleshooting

### Common Issues

1. **Docker Build Failures**
   ```bash
   # Check Dockerfile syntax
   docker build -t test ./frontend
   
   # Check build context
   ls -la frontend/
   ```

2. **Test Failures**
   ```bash
   # Run tests locally
   cd frontend && npm test
   cd backend && npm test
   ```

3. **Deployment Failures**
   ```bash
   # Check deployment logs
   ./deploy/deploy.sh health
   
   # View container logs
   docker-compose logs
   ```

### Debug Mode

Enable debug mode by adding these secrets:
```bash
ACTIONS_STEP_DEBUG=true
ACTIONS_RUNNER_DEBUG=true
```

## 📚 Best Practices

### Development Workflow

1. **Feature Development**:
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git push origin feature/new-feature
   # Create pull request
   ```

2. **Code Review Process**:
   - Automated tests must pass
   - Code quality checks must pass
   - Manual review required
   - Security scan must pass

3. **Release Process**:
   ```bash
   # Merge to develop first
   git checkout develop
   git merge feature/new-feature
   
   # Then to main for production
   git checkout main
   git merge develop
   git tag v1.0.0
   git push origin main --tags
   ```

### Security Best Practices

- Never commit secrets to repository
- Use environment-specific secrets
- Regular dependency updates
- Container security scanning
- Access control for production deployments

This CI/CD pipeline provides a robust, automated development and deployment process that ensures code quality, security, and reliable deployments.