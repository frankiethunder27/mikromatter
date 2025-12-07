# 🚀 mikromatter Deployment Guide - Hostinger Cloud

This guide walks you through deploying mikromatter to Hostinger Cloud Hosting.

## Prerequisites

- Hostinger Cloud Hosting account with SSH access
- A domain name pointed to your Hostinger server
- Your Neon PostgreSQL database URL (keep using the same one)

---

## Step 1: Set Up OAuth Providers

You need at least one OAuth provider. GitHub is recommended as it's the easiest.

### Option A: GitHub OAuth (Recommended)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: `mikromatter`
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-domain.com/api/auth/github/callback`
4. Click **"Register application"**
5. Copy the **Client ID**
6. Generate and copy a **Client Secret**

### Option B: Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Go to **APIs & Services > Credentials**
4. Click **"Create Credentials" > "OAuth client ID"**
5. Select **"Web application"**
6. Add authorized redirect URI: `https://your-domain.com/api/auth/google/callback`
7. Copy **Client ID** and **Client Secret**

---

## Step 2: Connect to Your Hostinger Server

```bash
ssh root@your-server-ip
# Or use the SSH terminal in Hostinger hPanel
```

---

## Step 3: Run Automated Deployment

### Option A: Fresh Install

```bash
# Clone the repository
git clone https://github.com/your-username/mikromatter.git /var/www/mikromatter
cd /var/www/mikromatter

# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Option B: Upload Files Manually

If you can't use git, upload files via SFTP to `/var/www/mikromatter`, then:

```bash
cd /var/www/mikromatter
chmod +x deploy.sh
./deploy.sh
```

---

## Step 4: Configure Environment Variables

```bash
cd /var/www/mikromatter

# Copy example env file
cp env.example .env

# Edit with your values
nano .env
```

**Required variables:**

```env
# App
NODE_ENV=production
PORT=5000
APP_URL=https://your-domain.com

# Database (your existing Neon URL)
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require

# Session (generate with: openssl rand -base64 32)
SESSION_SECRET=your-random-secret-here

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional: OpenAI (for AI features)
OPENAI_API_KEY=sk-your-key
```

Save and exit (`Ctrl+X`, then `Y`, then `Enter`)

---

## Step 5: Configure Nginx

```bash
# Copy nginx config
sudo cp nginx.conf.example /etc/nginx/sites-available/mikromatter

# Edit to update your domain
sudo nano /etc/nginx/sites-available/mikromatter
# Replace "your-domain.com" with your actual domain

# Enable the site
sudo ln -s /etc/nginx/sites-available/mikromatter /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## Step 6: Set Up SSL Certificate

```bash
# Install SSL with Let's Encrypt
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts - choose to redirect HTTP to HTTPS
```

---

## Step 7: Start the Application

```bash
cd /var/www/mikromatter

# Push database schema (if not already done)
npm run db:push

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save

# Ensure PM2 starts on boot
pm2 startup
```

---

## 🎉 Done!

Your app should now be live at `https://your-domain.com`

---

## Useful Commands

### View Logs
```bash
pm2 logs mikromatter
```

### Monitor App
```bash
pm2 monit
```

### Restart App
```bash
pm2 restart mikromatter
```

### Update App
```bash
cd /var/www/mikromatter
git pull
npm ci
npm run build
pm2 restart mikromatter
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### App won't start
```bash
# Check PM2 logs
pm2 logs mikromatter --lines 50

# Check if port 5000 is in use
sudo lsof -i :5000

# Verify environment variables
cat .env
```

### 502 Bad Gateway
- App might not be running: `pm2 status`
- Check nginx config: `sudo nginx -t`
- Check app logs: `pm2 logs mikromatter`

### Database Connection Issues
- Verify DATABASE_URL in .env
- Check Neon dashboard for connection limits
- Ensure SSL mode is set: `?sslmode=require`

### OAuth Callback Errors
- Verify callback URLs match exactly in provider settings
- Check APP_URL in .env matches your domain
- Ensure HTTPS is working

---

## Security Checklist

- [ ] SSL certificate installed
- [ ] Strong SESSION_SECRET generated
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] Regular backups configured
- [ ] PM2 log rotation enabled

---

## Architecture

```
                    ┌─────────────────┐
                    │    Internet     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │     Nginx       │
                    │  (Port 80/443)  │
                    │   SSL + Proxy   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Node.js       │
                    │  (Port 5000)    │
                    │   Express +     │
                    │   WebSockets    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼────┐  ┌──────▼──────┐  ┌────▼────┐
     │    Neon     │  │   GitHub    │  │  Google │
     │  PostgreSQL │  │   OAuth     │  │  OAuth  │
     └─────────────┘  └─────────────┘  └─────────┘
```

