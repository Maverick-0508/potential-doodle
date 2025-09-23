# Production Server Setup Guide

This guide helps you set up and configure a production server for the Beverage E-Commerce application.

## 🖥️ Server Requirements

### Minimum System Requirements
- **CPU**: 2 cores (4 cores recommended)
- **RAM**: 4GB (8GB recommended)
- **Storage**: 20GB SSD minimum
- **OS**: Ubuntu 20.04 LTS or newer
- **Network**: Stable internet connection with static IP

### Recommended Cloud Providers
- **DigitalOcean**: $20/month droplet (4GB RAM, 2 CPUs)
- **AWS EC2**: t3.medium instance
- **Google Cloud**: e2-medium instance
- **Linode**: Nanode 4GB plan
- **Vultr**: Regular Performance 4GB plan

## 🔧 Initial Server Setup

### 1. Create and Access Server

```bash
# Connect to your server
ssh root@your-server-ip

# Update system packages
apt update && apt upgrade -y

# Create application user
adduser beverage-app
usermod -aG sudo beverage-app
```

### 2. Install Required Software

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker beverage-app

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Nginx (for reverse proxy)
apt install nginx -y
systemctl enable nginx

# Install Git
apt install git -y

# Install fail2ban (security)
apt install fail2ban -y
systemctl enable fail2ban
```

### 3. Configure Firewall

```bash
# Install and configure UFW
apt install ufw -y

# Allow SSH, HTTP, and HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable
```

## 🔐 Security Configuration

### 1. SSH Key Authentication

```bash
# On your local machine, generate SSH key
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy public key to server
ssh-copy-id beverage-app@your-server-ip

# On server, disable password authentication
sudo nano /etc/ssh/sshd_config
```

Update SSH config:
```bash
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
```

```bash
# Restart SSH service
sudo systemctl restart sshd
```

### 2. Fail2Ban Configuration

```bash
# Create jail configuration
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
```

```bash
# Restart fail2ban
sudo systemctl restart fail2ban
```

## 🌐 Domain and SSL Setup

### 1. Domain Configuration

Update your domain's DNS records:

```bash
# A Records
A     @              your-server-ip
A     www            your-server-ip
A     api            your-server-ip

# Optional: Staging subdomain
A     staging        your-server-ip
```

### 2. SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate certificates
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Add to crontab for auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

## 📁 Application Deployment Setup

### 1. Create Application Directory

```bash
# Switch to application user
su - beverage-app

# Create application directories
sudo mkdir -p /opt/beverage-ecommerce
sudo chown beverage-app:beverage-app /opt/beverage-ecommerce
cd /opt/beverage-ecommerce

# Clone repository (replace with your repo URL)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git .
```

### 2. Environment Configuration

```bash
# Create production environment file
nano .env.production
```

```bash
# Application
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com

# Database
MONGO_URI=mongodb://localhost:27017/beverage-ecommerce-prod

# JWT
JWT_SECRET=your-super-secure-32-character-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# M-Pesa (Production values)
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_SHORTCODE=your_production_shortcode
MPESA_PASSKEY=your_production_passkey
MPESA_CALLBACK_URL=https://api.your-domain.com/api/wallet/mpesa/callback
```

### 3. Database Setup

```bash
# Create MongoDB data directory
sudo mkdir -p /opt/beverage-ecommerce/data/mongodb
sudo chown beverage-app:beverage-app /opt/beverage-ecommerce/data/mongodb

# Start MongoDB container
docker run -d \
  --name mongodb \
  --restart unless-stopped \
  -p 27017:27017 \
  -v /opt/beverage-ecommerce/data/mongodb:/data/db \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=secure_password_here \
  mongo:latest
```

## 🚀 Application Deployment

### 1. Initial Deployment

```bash
# Make deployment script executable
chmod +x deploy/deploy.sh

# Run initial deployment
./deploy/deploy.sh deploy
```

### 2. Nginx Configuration

```bash
# Backup default config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Create application config
sudo nano /etc/nginx/sites-available/beverage-ecommerce
```

```nginx
# Frontend
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# API
server {
    listen 80;
    listen [::]:80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Add CORS headers
        add_header Access-Control-Allow-Origin https://your-domain.com;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type";
    }
}
```

```bash
# Enable site and restart nginx
sudo ln -s /etc/nginx/sites-available/beverage-ecommerce /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 📊 Monitoring Setup

### 1. Application Monitoring

```bash
# Create monitoring script
nano /opt/beverage-ecommerce/monitor.sh
```

```bash
#!/bin/bash

# Health check URLs
FRONTEND_URL="https://your-domain.com"
API_URL="https://api.your-domain.com/api/health"

# Check frontend
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
echo "$(date): Frontend status: $frontend_status" >> /var/log/beverage-app-monitor.log

# Check API
api_status=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)
echo "$(date): API status: $api_status" >> /var/log/beverage-app-monitor.log

# Check if services are down
if [ "$frontend_status" != "200" ] || [ "$api_status" != "200" ]; then
    echo "$(date): Service down! Frontend: $frontend_status, API: $api_status" >> /var/log/beverage-app-monitor.log
    # Optionally restart services
    cd /opt/beverage-ecommerce && docker-compose restart
fi
```

```bash
# Make executable and add to cron
chmod +x /opt/beverage-ecommerce/monitor.sh
echo "*/5 * * * * /opt/beverage-ecommerce/monitor.sh" | crontab -
```

### 2. Log Rotation

```bash
# Create log rotation config
sudo nano /etc/logrotate.d/beverage-ecommerce
```

```bash
/opt/beverage-ecommerce/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}

/var/log/beverage-app-monitor.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
```

## 🔄 Automatic Updates

### 1. Setup Webhook Endpoint (Optional)

```bash
# Install webhook listener
sudo apt install webhook -y

# Create webhook configuration
sudo nano /etc/webhook.conf
```

```json
[
  {
    "id": "deploy-beverage-app",
    "execute-command": "/opt/beverage-ecommerce/deploy/deploy.sh",
    "command-working-directory": "/opt/beverage-ecommerce",
    "pass-arguments-to-command": [
      {
        "source": "string",
        "name": "deploy"
      }
    ],
    "trigger-rule": {
      "match": {
        "type": "payload-hash-sha1",
        "secret": "your-webhook-secret",
        "parameter": {
          "source": "header",
          "name": "X-Hub-Signature"
        }
      }
    }
  }
]
```

### 2. Backup Strategy

```bash
# Create backup script
nano /opt/beverage-ecommerce/backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/opt/beverage-ecommerce/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec mongodb mongodump --out /tmp/backup_$DATE
docker cp mongodb:/tmp/backup_$DATE $BACKUP_DIR/

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /opt/beverage-ecommerce --exclude=/opt/beverage-ecommerce/backups

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "$(date): Backup completed - $DATE" >> /var/log/beverage-app-backup.log
```

```bash
# Make executable and schedule
chmod +x /opt/beverage-ecommerce/backup.sh
echo "0 2 * * * /opt/beverage-ecommerce/backup.sh" | crontab -
```

## ✅ Production Checklist

Before going live, verify:

- [ ] Server security configured (SSH keys, firewall, fail2ban)
- [ ] Domain pointed to server
- [ ] SSL certificates installed and working
- [ ] Environment variables configured
- [ ] Database running and accessible
- [ ] Application deployed and healthy
- [ ] Nginx reverse proxy configured
- [ ] Monitoring scripts active
- [ ] Backup strategy implemented
- [ ] Log rotation configured
- [ ] Health checks passing

## 📞 Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Check logs and monitoring
2. **Monthly**: Update system packages
3. **Quarterly**: Review security settings
4. **Semi-annually**: Test backup/restore procedures

### Emergency Procedures

```bash
# Quick service restart
cd /opt/beverage-ecommerce && docker-compose restart

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Rollback to previous version
./deploy/deploy.sh rollback

# Full system restart
sudo reboot
```

For additional support, refer to the [CI/CD Documentation](../.github/CICD_DOCUMENTATION.md) or create an issue in the repository.