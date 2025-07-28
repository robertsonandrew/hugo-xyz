+++
title = "Deployment Guide"
date = 2024-01-01T00:00:00Z
draft = false
tags = ["documentation", "deployment"]
description = "Guide for deploying applications to various platforms"
weight = 3
+++

# Deployment Guide

This guide covers different deployment strategies and platforms for your applications.

## Preparation

Before deploying, ensure your application is production-ready:

### Environment Variables

Set the following environment variables for production:

```env
NODE_ENV=production
PORT=8080
DATABASE_URL=your_production_database_url
JWT_SECRET=your_jwt_secret
API_KEY=your_api_key
```

### Build Process

```bash
npm run build
npm run test
```

## Deployment Options

### 1. Vercel (Recommended for Frontend)

Vercel offers seamless deployment for static sites and serverless functions.

**Steps:**
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

**Configuration (`vercel.json`):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.js"
    }
  ]
}
```

### 2. Railway (Full-Stack Applications)

Railway provides an excellent developer experience for full-stack applications.

**Steps:**
1. Connect your GitHub repository
2. Configure environment variables
3. Deploy automatically on push

**railway.toml:**
```toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### 3. Docker Deployment

For containerized deployments, use the provided Dockerfile.

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
```

**Build and run:**
```bash
docker build -t your-app .
docker run -p 8080:8080 your-app
```

### 4. Traditional VPS Deployment

For deployment on a virtual private server:

**Prerequisites:**
- Ubuntu 20.04+ server
- Domain name pointed to your server
- SSL certificate (Let's Encrypt recommended)

**Steps:**

1. **Server Setup:**
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
```

2. **Application Setup:**
```bash
git clone your-repository
cd your-app
npm install --production
npm run build
```

3. **Process Manager (PM2):**
```bash
sudo npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'your-app',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

4. **Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring and Logging

### Health Checks

Implement health check endpoints:

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Logging

Use structured logging for production:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Troubleshooting

Common deployment issues and solutions:

- **Build failures**: Check Node.js version compatibility
- **Environment variables**: Ensure all required variables are set
- **Database connections**: Verify connection strings and firewall rules
- **SSL issues**: Check certificate installation and domain configuration

## Next Steps

After successful deployment:

1. Set up monitoring and alerting
2. Configure automated backups
3. Implement CI/CD pipelines
4. Set up performance monitoring

For more help, check the [Troubleshooting](../troubleshooting/) guide.
