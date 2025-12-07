#!/bin/bash
# ===========================================
# mikromatter Deployment Script for Hostinger Cloud
# ===========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  mikromatter Deployment Script${NC}"
echo -e "${GREEN}=========================================${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}Warning: Running as root. Consider using a non-root user.${NC}"
fi

# Configuration
APP_DIR="/var/www/mikromatter"
REPO_URL="${REPO_URL:-https://github.com/your-username/mikromatter.git}"

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: System Updates
echo -e "\n${YELLOW}Step 1: Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Step 2: Install Node.js 20.x
echo -e "\n${YELLOW}Step 2: Installing Node.js 20.x...${NC}"
if ! command_exists node; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Step 3: Install PM2
echo -e "\n${YELLOW}Step 3: Installing PM2...${NC}"
if ! command_exists pm2; then
    sudo npm install -g pm2
fi
echo "PM2 version: $(pm2 --version)"

# Step 4: Install Nginx
echo -e "\n${YELLOW}Step 4: Installing Nginx...${NC}"
if ! command_exists nginx; then
    sudo apt install -y nginx
fi
sudo systemctl enable nginx
sudo systemctl start nginx

# Step 5: Install Certbot for SSL
echo -e "\n${YELLOW}Step 5: Installing Certbot...${NC}"
if ! command_exists certbot; then
    sudo apt install -y certbot python3-certbot-nginx
fi

# Step 6: Clone/Update Repository
echo -e "\n${YELLOW}Step 6: Setting up application...${NC}"
if [ -d "$APP_DIR" ]; then
    echo "Updating existing installation..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "Cloning repository..."
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# Step 7: Install Dependencies
echo -e "\n${YELLOW}Step 7: Installing npm dependencies...${NC}"
npm ci --production=false

# Step 8: Build Application
echo -e "\n${YELLOW}Step 8: Building application...${NC}"
npm run build

# Step 9: Create logs directory
echo -e "\n${YELLOW}Step 9: Setting up logs...${NC}"
mkdir -p logs

# Step 10: Environment Check
echo -e "\n${YELLOW}Step 10: Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo "Please create a .env file based on env.example"
    echo "  cp env.example .env"
    echo "  nano .env"
    exit 1
fi

# Step 11: Run Database Migrations
echo -e "\n${YELLOW}Step 11: Running database migrations...${NC}"
npm run db:push

# Step 12: Start/Restart PM2
echo -e "\n${YELLOW}Step 12: Starting application with PM2...${NC}"
pm2 delete mikromatter 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# Step 13: Setup PM2 Startup
echo -e "\n${YELLOW}Step 13: Configuring PM2 startup...${NC}"
pm2 startup systemd -u $USER --hp $HOME
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. Configure Nginx:"
echo -e "   ${YELLOW}sudo cp nginx.conf.example /etc/nginx/sites-available/mikromatter${NC}"
echo -e "   ${YELLOW}sudo ln -s /etc/nginx/sites-available/mikromatter /etc/nginx/sites-enabled/${NC}"
echo -e "   ${YELLOW}sudo nginx -t && sudo systemctl reload nginx${NC}"
echo ""
echo -e "2. Setup SSL with Let's Encrypt:"
echo -e "   ${YELLOW}sudo certbot --nginx -d your-domain.com${NC}"
echo ""
echo -e "3. View logs:"
echo -e "   ${YELLOW}pm2 logs mikromatter${NC}"
echo ""
echo -e "4. Monitor:"
echo -e "   ${YELLOW}pm2 monit${NC}"

