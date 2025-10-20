#!/bin/bash
# Atlas Framework - Complete Deployment Script

set -e

echo "================================================"
echo "   Atlas Framework - Complete Deployment"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."

command -v docker >/dev/null 2>&1 || { echo -e "\${RED}Error: Docker required\${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "\${RED}Error: Docker Compose required\${NC}"; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo -e "\${YELLOW}Warning: Terraform not found (optional for CDN)\${NC}"; }

echo -e "\${GREEN}✓ Prerequisites met\${NC}"
echo ""

# Check environment file
if [ ! -f .env.atlas ]; then
    echo "Creating .env file from template..."
    cp .env.atlas.example .env.atlas
    echo -e "\${YELLOW}⚠ Please edit .env.atlas with your credentials!\${NC}"
    echo ""
    read -p "Press Enter after editing .env.atlas..."
fi

# Generate secure keys
echo "Generating secure keys..."
if ! grep -q "generate-with-openssl" .env.atlas; then
    JWT_SECRET=$(openssl rand -base64 32)
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env.atlas
    sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=${ENCRYPTION_KEY}|" .env.atlas
    echo -e "${GREEN}✓ Secure keys generated${NC}"
else
    echo -e "${YELLOW}⚠ Please generate JWT_SECRET and ENCRYPTION_KEY manually${NC}"
fi
echo ""

# SSH key for Axiom
echo "Setting up Axiom SSH key..."
if [ ! -f ./keys/axiom_rsa ]; then
    mkdir -p ./keys
    ssh-keygen -t rsa -b 4096 -f ./keys/axiom_rsa -N "" -q
    echo -e "${GREEN}✓ Axiom SSH key generated${NC}"
    echo ""
    echo "Add this public key to your Axiom controller:"
    echo ""
    cat ./keys/axiom_rsa.pub
    echo ""
    read -p "Press Enter after adding key to Axiom controller..."
fi
echo ""

# Build Docker images
echo "Building Docker images..."
docker-compose -f docker-compose-atlas.yml build
echo -e "${GREEN}✓ Images built${NC}"
echo ""

# Start services
echo "Starting services..."
docker-compose -f docker-compose-atlas.yml up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 15

# Check service health
echo "Checking service health..."
docker-compose -f docker-compose-atlas.yml ps

echo ""
echo "================================================"
echo "   Atlas Framework Deployment Complete!"
echo "================================================"
echo ""
echo "Access URLs:"
echo "  Frontend:      http://localhost:3000"
echo "  API Gateway:   http://localhost:8000"
echo "  Kong Admin:    http://localhost:8001"
echo "  Database:      localhost:5432"
echo "  Redis:         localhost:6379"
echo ""
echo "Next Steps:"
echo "  1. Access frontend: http://localhost:3000"
echo "  2. Configure cloud providers in Settings"
echo "  3. Deploy your first VPN node"
echo "  4. Create an Axiom fleet"
echo "  5. Start OSINT reconnaissance"
echo ""
echo "Logs:"
echo "  docker-compose -f docker-compose-atlas.yml logs -f"
echo ""
echo "Stop services:"
echo "  docker-compose -f docker-compose-atlas.yml down"
echo ""

# Optional: CDN Deployment
read -p "Deploy CDN with Terraform? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Deploying AWS CloudFront CDN..."
    cd infra/terraform
    terraform init
    terraform plan
    read -p "Apply Terraform configuration? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        terraform apply
        echo -e "${GREEN}✓ CDN deployed${NC}"
    fi
    cd ../..
fi

echo ""
echo -e "${GREEN}🚀 Atlas Framework is ready!${NC}"
