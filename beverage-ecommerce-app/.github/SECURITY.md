# Security Best Practices

This document outlines security best practices for the Beverage E-Commerce application across development, deployment, and production environments.

## 🔐 Application Security

### 1. Authentication & Authorization

#### JWT Security
```javascript
// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

// Use strong, random JWT secrets (32+ characters)
const JWT_SECRET = process.env.JWT_SECRET; // Must be 32+ random characters

// Implement proper token validation
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'beverage-ecommerce',
      audience: 'api.beverage-ecommerce.com',
      clockTolerance: 30 // seconds
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

#### Password Security
```javascript
// Use bcrypt with minimum 12 rounds
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// Hash passwords
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Validate password strength
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && 
         hasUpperCase && hasLowerCase && 
         hasNumbers && hasSpecial;
};
```

### 2. Input Validation & Sanitization

#### API Input Validation
```javascript
// Use express-validator for input validation
const { body, validationResult } = require('express-validator');

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  body('name').trim().escape().isLength({ min: 2, max: 50 }),
  body('phone').isMobilePhone('en-KE')
];

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
```

#### XSS Prevention
```javascript
// Install and use helmet
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Sanitize HTML inputs
const DOMPurify = require('isomorphic-dompurify');
const sanitizeHtml = (html) => DOMPurify.sanitize(html);
```

### 3. Database Security

#### MongoDB Security
```javascript
// Use parameterized queries to prevent injection
const User = require('../models/User');

// Safe query
const findUser = async (email) => {
  return await User.findOne({ email: email });
};

// Validate ObjectIds
const mongoose = require('mongoose');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Implement rate limiting on database operations
const rateLimit = require('express-rate-limit');
const dbRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many database requests, please try again later'
});
```

### 4. API Security

#### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many API requests, please try again later'
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

#### CORS Configuration
```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com', 'https://www.your-domain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

## 🛡️ Infrastructure Security

### 1. Server Hardening

#### SSH Security
```bash
# /etc/ssh/sshd_config
Protocol 2
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitEmptyPasswords no
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxSessions 2
```

#### Firewall Configuration
```bash
# UFW rules for production
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Fail2ban for SSH protection
# /etc/fail2ban/jail.local
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 1h
findtime = 10m
```

### 2. Container Security

#### Docker Security
```dockerfile
# Use non-root user in containers
FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Use specific versions, not latest
FROM node:18.17.1-alpine

# Scan for vulnerabilities
RUN npm audit --audit-level moderate
```

#### Docker Compose Security
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  frontend:
    read_only: true
    tmpfs:
      - /tmp
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
```

### 3. Secrets Management

#### Environment Variables
```bash
# Never commit secrets to git
# Use separate .env files for different environments

# Production secrets template
NODE_ENV=production
JWT_SECRET=32_character_random_string_here
MONGO_URI=mongodb://secure_user:secure_password@host:port/db
MPESA_CONSUMER_SECRET=production_secret_here
```

#### GitHub Secrets
```yaml
# .github/workflows/ci-cd.yml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  MONGO_URI: ${{ secrets.MONGO_URI }}
  MPESA_CONSUMER_KEY: ${{ secrets.MPESA_CONSUMER_KEY }}
  MPESA_CONSUMER_SECRET: ${{ secrets.MPESA_CONSUMER_SECRET }}
```

## 🔍 Security Monitoring

### 1. Logging and Auditing

#### Application Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/security.log', level: 'warn' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Log security events
const logSecurityEvent = (event, req, details = {}) => {
  logger.warn('Security Event', {
    event,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    ...details
  });
};
```

#### Security Event Monitoring
```javascript
// Monitor failed login attempts
const monitorFailedLogins = (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode === 401) {
      logSecurityEvent('FAILED_LOGIN', req, {
        email: req.body.email,
        attempts: getFailedAttempts(req.ip)
      });
    }
    originalSend.call(this, data);
  };
  next();
};
```

### 2. Vulnerability Scanning

#### Automated Security Scanning
```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  push:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: |
          cd frontend && npm audit --audit-level high
          cd ../backend && npm audit --audit-level high
      
      - name: Run CodeQL Analysis
        uses: github/codeql-action/analyze@v2
        with:
          languages: javascript
      
      - name: Docker security scan
        run: |
          docker build -t security-scan ./frontend
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            -v $(pwd):/app aquasec/trivy image security-scan
```

## 🚨 Incident Response

### 1. Security Incident Procedures

#### Immediate Response Checklist
```markdown
## Security Incident Response

### 1. Immediate Actions (0-15 minutes)
- [ ] Identify and isolate affected systems
- [ ] Document the incident with timestamps
- [ ] Notify security team/admin
- [ ] Preserve evidence (logs, system state)

### 2. Assessment (15-60 minutes)
- [ ] Determine scope of compromise
- [ ] Identify attack vector
- [ ] Assess data exposure risk
- [ ] Check for ongoing malicious activity

### 3. Containment (1-4 hours)
- [ ] Block malicious IP addresses
- [ ] Revoke compromised credentials
- [ ] Update firewall rules
- [ ] Apply emergency patches if needed

### 4. Recovery (4-24 hours)
- [ ] Restore from clean backups if needed
- [ ] Update security measures
- [ ] Monitor for reoccurrence
- [ ] Update documentation
```

#### Automated Incident Response
```bash
#!/bin/bash
# emergency-response.sh

# Block suspicious IP
block_ip() {
    local ip=$1
    ufw insert 1 deny from $ip
    echo "$(date): Blocked IP $ip" >> /var/log/security-incidents.log
}

# Revoke JWT tokens (by updating secret)
revoke_all_tokens() {
    # Generate new JWT secret
    new_secret=$(openssl rand -base64 32)
    
    # Update environment and restart services
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$new_secret/" .env.production
    docker-compose restart backend
    
    echo "$(date): All JWT tokens revoked" >> /var/log/security-incidents.log
}

# Emergency service restart
emergency_restart() {
    docker-compose down
    sleep 5
    docker-compose up -d
    echo "$(date): Emergency restart completed" >> /var/log/security-incidents.log
}
```

### 2. Backup and Recovery

#### Automated Backups
```bash
#!/bin/bash
# secure-backup.sh

BACKUP_DIR="/secure/backups"
DATE=$(date +%Y%m%d_%H%M%S)
ENCRYPTION_KEY="/etc/ssl/private/backup.key"

# Create encrypted database backup
docker exec mongodb mongodump --archive | \
  openssl enc -aes-256-cbc -salt -kfile $ENCRYPTION_KEY > \
  $BACKUP_DIR/db_backup_$DATE.enc

# Create encrypted application backup
tar -czf - /opt/beverage-ecommerce | \
  openssl enc -aes-256-cbc -salt -kfile $ENCRYPTION_KEY > \
  $BACKUP_DIR/app_backup_$DATE.tar.gz.enc

# Upload to secure offsite storage
aws s3 cp $BACKUP_DIR/ s3://secure-backups/beverage-ecommerce/ --recursive
```

## 📋 Security Compliance

### 1. Data Protection (GDPR/CCPA)

#### User Data Handling
```javascript
// Implement data minimization
const userData = {
  id: user._id,
  email: user.email,
  name: user.name,
  // Don't include sensitive fields like password hash
};

// Data retention policy
const deleteOldUserData = async () => {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 7); // 7 years retention
  
  await User.deleteMany({
    lastLogin: { $lt: cutoffDate },
    accountDeleted: true
  });
};

// User data export (GDPR right to portability)
const exportUserData = async (userId) => {
  const user = await User.findById(userId);
  const orders = await Order.find({ userId });
  
  return {
    personalData: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      registrationDate: user.createdAt
    },
    orderHistory: orders,
    dataExportDate: new Date().toISOString()
  };
};
```

### 2. Regular Security Assessments

#### Security Checklist
```markdown
## Monthly Security Review

### Code Security
- [ ] Dependencies updated and audited
- [ ] No hardcoded secrets in code
- [ ] Input validation implemented
- [ ] Authentication mechanisms secure

### Infrastructure Security
- [ ] Server patches applied
- [ ] SSL certificates valid
- [ ] Firewall rules reviewed
- [ ] Access logs analyzed

### Operational Security
- [ ] Backup procedures tested
- [ ] Incident response plan updated
- [ ] Security monitoring active
- [ ] Team security training completed
```

This comprehensive security framework provides defense-in-depth protection for the Beverage E-Commerce application across all layers of the technology stack.