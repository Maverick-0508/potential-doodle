# GitHub Repository Configuration

This file contains the necessary configuration steps for setting up the GitHub repository to work with the CI/CD pipeline.

## 🔐 Secrets Configuration

### Navigate to Repository Settings
1. Go to your GitHub repository
2. Click **Settings** tab
3. Go to **Secrets and variables** → **Actions**

### Add Repository Secrets

Click **New repository secret** for each of the following:

#### Application Configuration
```bash
# API Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://localhost:3001

# Database Configuration
MONGO_URI=mongodb://localhost:27017/beverage-ecommerce
# For production: mongodb://your-mongo-connection-string

# JWT Configuration
JWT_SECRET=your-super-secure-32-character-jwt-secret-key-here
JWT_EXPIRES_IN=7d
```

#### M-Pesa Configuration (Production)
```bash
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_SHORTCODE=your_production_shortcode
MPESA_PASSKEY=your_production_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/wallet/mpesa/callback
```

#### Deployment Configuration
```bash
# Production URLs
PRODUCTION_API_URL=https://api.your-domain.com
PRODUCTION_FRONTEND_URL=https://your-domain.com

# Staging URLs (optional)
STAGING_API_URL=https://staging-api.your-domain.com
STAGING_FRONTEND_URL=https://staging.your-domain.com
```

#### Optional: Performance Monitoring
```bash
# Lighthouse CI (optional)
LHCI_GITHUB_APP_TOKEN=your_lighthouse_ci_token
```

## 🌍 Environment Configuration

### Create Environments

1. Go to **Settings** → **Environments**
2. Click **New environment**

#### Staging Environment
- **Name**: `staging`
- **Protection rules**: None (optional)
- **Environment secrets**: Add staging-specific values

#### Production Environment
- **Name**: `production`
- **Protection rules**: 
  - ✅ Required reviewers (add team members)
  - ✅ Wait timer: 5 minutes
  - ✅ Deployment branches: `main` only
- **Environment secrets**: Add production values

## 🛡️ Branch Protection Rules

### Configure for `main` branch:

1. Go to **Settings** → **Branches**
2. Click **Add rule** for `main`
3. Configure:

```yaml
Branch Protection Settings:
  ✅ Require a pull request before merging
    ✅ Require approvals: 1
    ✅ Dismiss stale PR approvals when new commits are pushed
    ✅ Require review from code owners
  
  ✅ Require status checks to pass before merging
    ✅ Require branches to be up to date before merging
    Required status checks:
      - test (frontend)
      - test (backend)
      - security
      - code-quality
  
  ✅ Require conversation resolution before merging
  ✅ Restrict pushes that create files larger than 100 MB
  ✅ Allow force pushes: Everyone (for emergency fixes)
  ✅ Allow deletions: No
```

### Configure for `develop` branch:
Same as `main` but with relaxed approval requirements.

## 📦 Container Registry Setup

The pipeline automatically uses GitHub Container Registry (ghcr.io). No additional setup required.

### Generated Image Names:
```bash
# Frontend
ghcr.io/YOUR_USERNAME/YOUR_REPO_NAME/frontend:latest
ghcr.io/YOUR_USERNAME/YOUR_REPO_NAME/frontend:main-{commit-sha}

# Backend
ghcr.io/YOUR_USERNAME/YOUR_REPO_NAME/backend:latest
ghcr.io/YOUR_USERNAME/YOUR_REPO_NAME/backend:main-{commit-sha}
```

## 🏷️ Labels Setup

Create these labels for better issue and PR management:

```bash
# Type labels
bug         🐛 Something isn't working         #d73a4a
enhancement ✨ New feature or request         #a2eeef
documentation 📚 Improvements or additions to docs #0075ca
security    🔒 Security related changes      #b60205

# Priority labels
priority: low     ⬇️ Low priority            #0e8a16
priority: medium  ➡️ Medium priority         #fbca04
priority: high    ⬆️ High priority           #d93f0b
priority: critical 🚨 Critical priority     #b60205

# Status labels
status: blocked   🚫 Blocked by other work   #6f42c1
status: in-review 👀 Under review           #0052cc
status: ready     ✅ Ready for deployment    #28a745
```

## 🤖 GitHub Apps (Optional)

Consider installing these GitHub Apps for enhanced functionality:

### Recommended Apps:
1. **CodeQL** - Already enabled in workflow
2. **Dependabot** - Automated dependency updates
3. **Lighthouse CI** - Performance monitoring
4. **Codecov** - Test coverage tracking

## 📊 Repository Insights

### Enable Insights:
1. Go to **Insights** tab
2. Configure **Community Standards**:
   - ✅ README
   - ✅ Contributing guidelines
   - ✅ Code of conduct
   - ✅ License
   - ✅ Issue templates
   - ✅ Pull request template

## 🔧 Webhook Configuration

The CI/CD pipeline uses GitHub's built-in webhooks. No manual webhook setup required.

### Webhook Events Triggered:
- `push` to main/develop branches
- `pull_request` opened/synchronized
- `release` created
- `schedule` for automated tasks

## 🌐 Custom Domain Setup (Optional)

If deploying to a custom domain:

### DNS Configuration:
```bash
# For frontend (example with Vercel/Netlify)
CNAME www.your-domain.com -> your-deployment-url.vercel.app

# For API (example with Railway/Heroku)
CNAME api.your-domain.com -> your-api-deployment-url.railway.app
```

### SSL Certificate:
- Most platforms provide automatic SSL
- For custom servers, use Let's Encrypt

## 📋 Verification Checklist

After configuration, verify:

- [ ] All secrets are added and correct
- [ ] Environments are created with proper protection
- [ ] Branch protection rules are active
- [ ] Labels are created
- [ ] First workflow run completes successfully
- [ ] Test deployment to staging works
- [ ] Health checks pass

## 🚀 First Deployment

To trigger your first deployment:

```bash
# Create a small change
echo "CI/CD Pipeline Active ✅" >> README.md

# Commit and push
git add .
git commit -m "feat: activate CI/CD pipeline"
git push origin main
```

Watch the **Actions** tab to see your pipeline in action!

## 🆘 Troubleshooting

### Common Issues:

1. **Secrets Not Found**
   - Check secret names match exactly
   - Ensure secrets are in correct environment

2. **Branch Protection Blocking**
   - Check required status checks are passing
   - Ensure approvals are obtained

3. **Container Registry Permissions**
   - Verify GitHub token has package permissions
   - Check organization settings if applicable

4. **Environment Deployment Failing**
   - Check environment secrets are correct
   - Verify deployment target accessibility

For more help, check the [CI/CD Documentation](./CICD_DOCUMENTATION.md) or create an issue.