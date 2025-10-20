#!/bin/bash

# ============================================================================
# Atlas Framework - AWS EC2 Deployment Script
# ============================================================================

# Run this script ON the EC2 instance after launching it.
# This script installs all dependencies and deploys Atlas Framework.

# USAGE:
# 1. Launch EC2 instance (t3.medium, Ubuntu 22.04)
# 2. SSH into instance
# 3. Clone repo: git clone https://github.com/Hxrensohn420/atlas-framework.git
# 4. Run: cd atlas-framework && chmod +x deploy-aws.sh && ./deploy-aws.sh

# ============================================================================
set -e # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get EC2 instance public IP automatically
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || echo "localhost")

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║ Atlas Framework - AWS EC2 Deployment Script        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 Detected EC2 IP: ${EC2_IP}${NC}"
echo ""

# Prompt for Axiom Controller IP
read -p "Enter Axiom Controller IP [13.53.50.201]: " AXIOM_IP
AXIOM_IP=${AXIOM_IP:-13.53.50.201}
echo ""

echo -e "${YELLOW}🔐 Generating secure secrets...${NC}"

# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 24)
KONG_DB_PASSWORD=$(openssl rand -base64 24)
GRAFANA_PASSWORD=$(openssl rand -base64 16)

echo -e "${GREEN}✅ Secrets generated${NC}"
echo ""

echo "════════════════════════════════════════════════════════"
echo "Step 1/8: System Update"
echo "════════════════════════════════════════════════════════"
sudo apt-get update -qq
sudo apt-get upgrade -y -qq
echo -e "${GREEN}✅ System updated${NC}"
echo ""

echo "════════════════════════════════════════════════════════"
echo "Step 2/8: Install Docker"
echo "════════════════════════════════════════════════════════"
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  rm get-docker.sh
  echo -e "${GREEN}✅ Docker installed${NC}"
else
  echo -e "${GREEN}✅ Docker already installed${NC}"
fi
echo ""

echo "════════════════════════════════════════════════════════"
echo "Step 3/8: Install Docker Compose"
echo "════════════════════════════════════════════════════════"
if ! command -v docker-compose &> /dev/null; then
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
  echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi
echo ""

echo "════════════════════════════════════════════════════════"
echo "Step 4/8: Verify Installation"
echo "════════════════════════════════════════════════════════"
docker --version
docker-compose --version
echo -e "${GREEN}✅ All dependencies verified${NC}"
echo ""

echo "════════════════════════════════════════════════════════"
echo "Step 5/8: Configure Environment"
echo "════════════════════════════════════════════════════════"

# Create .env file with generated secrets
cat > .env << ENVFILE
# ============================================================================
# Atlas Framework Production Configuration
# Generated: $(date)
# EC2 Instance: ${EC2_IP}
# ============================================================================

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=atlas
DB_USER=atlas_user
DB_PASSWORD=${DB_PASSWORD}

# Kong API Gateway
KONG_DB_PASSWORD=${KONG_DB_PASSWORD}

# API
NODE_ENV=production
API_PORT=5000
CDN_URL=http://${EC2_IP}:3000

# Security
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRY=24h
ENCRYPTION_KEY=${ENCRYPTION_KEY}
CORS_ORIGIN=http://${EC2_IP}:3000

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Axiom Integration (SSH to controller)
AXIOM_CONTROLLER_IP=${AXIOM_IP}
AXIOM_SSH_USER=ubuntu
AXIOM_SSH_KEY=/app/keys/axiom_controller_key

# AWS Credentials (TODO: Add your real credentials)
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=eu-north-1

# Optional Cloud Providers
GCP_PROJECT_ID=optional
GCP_SERVICE_ACCOUNT_KEY=/app/keys/gcp-service-account.json
DO_API_TOKEN=optional

# Monitoring
GRAFANA_PASSWORD=${GRAFANA_PASSWORD}
ENVFILE

echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

echo "════════════════════════════════════════════════════════"
echo "Step 6/8: Create Required Directories"
echo "════════════════════════════════════════════════════════"
mkdir -p data/uploads keys
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

echo "════════════════════════════════════════════════════════"
echo "Step 7/8: Pull Docker Images"
echo "════════════════════════════════════════════════════════"
docker-compose -f docker-compose-atlas.yml pull
echo -e "${GREEN}✅ Images pulled${NC}"
echo ""

echo "════════════════════════════════════════════════════════"
echo "Step 8/8: Start Atlas Framework"
echo "════════════════════════════════════════════════════════"

# Need to start Docker in new group context
newgrp docker << DOCKERSTART
cd $(pwd)
docker-compose -f docker-compose-atlas.yml up -d
DOCKERSTART

echo ""
echo -e "${YELLOW}⏳ Waiting for services to start (20 seconds)...${NC}"
sleep 20

# Check service status
echo ""
docker-compose -f docker-compose-atlas.yml ps

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""

# Save credentials to file
cat > ~/atlas-credentials.txt << CREDFILE
════════════════════════════════════════════════════════
Atlas Framework - Deployment Credentials
Generated: $(date)
════════════════════════════════════════════════════════

🌐 ACCESS URLS:
Dashboard:    http://${EC2_IP}:3000
Backend API:  http://${EC2_IP}:5000
Kong Gateway: http://${EC2_IP}:8000
Kong Admin:   http://${EC2_IP}:8001

🔐 CREDENTIALS (SAVE THESE!):
DB Password:        ${DB_PASSWORD}
Kong DB Password:   ${KONG_DB_PASSWORD}
JWT Secret:         ${JWT_SECRET}
Encryption Key:     ${ENCRYPTION_KEY}
Grafana Password:   ${GRAFANA_PASSWORD}

🔧 AXIOM INTEGRATION:
Controller IP: ${AXIOM_IP}
SSH User:      ubuntu
SSH Key Path:  keys/axiom_controller_key

⚙️ NEXT STEPS:
1. Copy Axiom SSH key:
   nano keys/axiom_controller_key
   # Paste your Axiom controller SSH key
   chmod 600 keys/axiom_controller_key

2. Add real AWS credentials to .env:
   nano .env
   # Update AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

3. Verify Security Group allows ports:
   - 22   (SSH)
   - 80   (HTTP)
   - 443  (HTTPS)
   - 3000 (Frontend)
   - 5000 (Backend)
   - 8000 (Kong Gateway)

🔍 USEFUL COMMANDS:
# View logs
docker-compose -f docker-compose-atlas.yml logs -f

# Restart service
docker-compose -f docker-compose-atlas.yml restart backend

# Stop Atlas
docker-compose -f docker-compose-atlas.yml down

# Full cleanup (WARNING: Deletes data!)
docker-compose -f docker-compose-atlas.yml down -v

════════════════════════════════════════════════════════
CREDFILE

echo -e "${YELLOW}📋 Access Information:${NC}"
echo ""
echo -e " 🌐 Dashboard:    ${BLUE}http://${EC2_IP}:3000${NC}"
echo -e " 🔌 Backend API:  ${BLUE}http://${EC2_IP}:5000${NC}"
echo -e " 🚪 Kong Gateway: ${BLUE}http://${EC2_IP}:8000${NC}"
echo -e " 📊 Kong Admin:   ${BLUE}http://${EC2_IP}:8001${NC}"
echo ""
echo -e "${YELLOW}🔐 Credentials saved to: ${BLUE}~/atlas-credentials.txt${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT NEXT STEPS:${NC}"
echo ""
echo -e " 1. ${BLUE}Copy Axiom SSH key to:${NC} keys/axiom_controller_key"
echo -e " 2. ${BLUE}Add real AWS credentials${NC} to .env"
echo -e " 3. ${BLUE}Verify Security Group${NC} allows ports: 3000, 5000, 8000"
echo ""
echo -e "${GREEN}🎉 Atlas Framework is running! 🎉${NC}"
echo ""
