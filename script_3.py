
# Create comprehensive deployment guide and CDN configurations

import json

# 1. Terraform for AWS CloudFront CDN
terraform_cloudfront = """# infra/terraform/cloudfront.tf
# Atlas Framework - AWS CloudFront CDN Configuration

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# S3 Bucket for Frontend Assets
resource "aws_s3_bucket" "frontend" {
  bucket = "atlas-framework-frontend-\${var.environment}"
  
  tags = {
    Name        = "Atlas Frontend"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "frontend" {
  comment = "Atlas Framework Frontend OAI"
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontAccess"
        Effect    = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.frontend.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "\${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

# ACM Certificate for Custom Domain
resource "aws_acm_certificate" "cert" {
  provider          = aws.us-east-1  # Must be in us-east-1 for CloudFront
  domain_name       = var.domain_name
  validation_method = "DNS"
  
  subject_alternative_names = [
    "www.\${var.domain_name}",
    "api.\${var.domain_name}",
    "*.api.\${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "Atlas Framework Certificate"
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "atlas" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Atlas Framework CDN"
  default_root_object = "index.html"
  price_class         = "PriceClass_All"  # Global edge locations
  
  aliases = [
    var.domain_name,
    "www.\${var.domain_name}"
  ]

  # Origin for Frontend (S3)
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-Frontend"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

  # Origin for API (ALB)
  origin {
    domain_name = var.api_alb_dns_name
    origin_id   = "ALB-API"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default cache behavior (Frontend)
  default_cache_behavior {
    target_origin_id       = "S3-Frontend"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Cache behavior for API
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "ALB-API"
    viewer_protocol_policy = "https-only"
    compress               = true
    
    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD"]
    
    forwarded_values {
      query_string = true
      headers      = ["Authorization", "CloudFront-Viewer-Country"]
      cookies {
        forward = "all"
      }
    }
    
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # Cache behavior for WebSocket
  ordered_cache_behavior {
    path_pattern           = "/ws/*"
    target_origin_id       = "ALB-API"
    viewer_protocol_policy = "https-only"
    
    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD"]
    
    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }
    
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # SSL Certificate
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Custom error responses
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  tags = {
    Name        = "Atlas Framework CDN"
    Environment = var.environment
  }
}

# Route53 DNS Records
resource "aws_route53_record" "apex" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.atlas.domain_name
    zone_id                = aws_cloudfront_distribution.atlas.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id = var.route53_zone_id
  name    = "www.\${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.atlas.domain_name
    zone_id                = aws_cloudfront_distribution.atlas.hosted_zone_id
    evaluate_target_health = false
  }
}

# Outputs
output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.atlas.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.atlas.domain_name
}

output "s3_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

# Variables
variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  default = "production"
}

variable "domain_name" {
  description = "Your custom domain name"
}

variable "api_alb_dns_name" {
  description = "DNS name of API ALB"
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID"
}
"""

with open('terraform_cloudfront.tf', 'w') as f:
    f.write(terraform_cloudfront)

# 2. Cloudflare Workers CDN (Free alternative)
cloudflare_worker = """// cloudflare-workers/atlas-cdn.js
// Atlas Framework - Cloudflare Workers CDN Router

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  // API requests -> Backend
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/ws')) {
    const backendUrl = 'https://api.yourdomain.com' + url.pathname + url.search
    
    const modifiedRequest = new Request(backendUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    })
    
    const response = await fetch(modifiedRequest)
    const modifiedResponse = new Response(response.body, response)
    
    // Add CORS headers
    Object.keys(corsHeaders).forEach(key => {
      modifiedResponse.headers.set(key, corsHeaders[key])
    })
    
    return modifiedResponse
  }
  
  // Static assets -> S3/GCS
  const staticUrl = 'https://frontend-bucket.s3.amazonaws.com' + url.pathname
  const response = await fetch(staticUrl)
  
  // Cache static assets
  const cache = caches.default
  const cacheKey = new Request(staticUrl)
  
  // Check cache first
  let cachedResponse = await cache.match(cacheKey)
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Cache for 1 hour
  const modifiedResponse = new Response(response.body, response)
  modifiedResponse.headers.set('Cache-Control', 'public, max-age=3600')
  
  event.waitUntil(cache.put(cacheKey, modifiedResponse.clone()))
  
  return modifiedResponse
}
"""

with open('cloudflare_worker.js', 'w') as f:
    f.write(cloudflare_worker)

# 3. Deployment script
deploy_script = """#!/bin/bash
# Atlas Framework - Complete Deployment Script

set -e

echo "================================================"
echo "   Atlas Framework - Complete Deployment"
echo "================================================"
echo ""

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

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
    JWT_SECRET=\$(openssl rand -base64 32)
    ENCRYPTION_KEY=\$(openssl rand -base64 32)
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=\${JWT_SECRET}/" .env.atlas
    sed -i "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=\${ENCRYPTION_KEY}/" .env.atlas
    echo -e "\${GREEN}✓ Secure keys generated\${NC}"
else
    echo -e "\${YELLOW}⚠ Please generate JWT_SECRET and ENCRYPTION_KEY manually\${NC}"
fi
echo ""

# SSH key for Axiom
echo "Setting up Axiom SSH key..."
if [ ! -f ./keys/axiom_rsa ]; then
    mkdir -p ./keys
    ssh-keygen -t rsa -b 4096 -f ./keys/axiom_rsa -N "" -q
    echo -e "\${GREEN}✓ Axiom SSH key generated\${NC}"
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
echo -e "\${GREEN}✓ Images built\${NC}"
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
if [[ \$REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Deploying AWS CloudFront CDN..."
    cd infra/terraform
    terraform init
    terraform plan
    read -p "Apply Terraform configuration? (y/N): " -n 1 -r
    echo
    if [[ \$REPLY =~ ^[Yy]$ ]]; then
        terraform apply
        echo -e "\${GREEN}✓ CDN deployed\${NC}"
    fi
    cd ../..
fi

echo ""
echo -e "\${GREEN}🚀 Atlas Framework is ready!\${NC}"
"""

with open('deploy_atlas.sh', 'w') as f:
    f.write(deploy_script)

# 4. Cost optimization guide
cost_guide = """# Atlas Framework - Cost Optimization Guide

## Monthly Cost Breakdown

### VPN Infrastructure
- **t3.micro (AWS)**: $0.0104/hr × 24h × 30d = $7.49/month per node
- **e2-micro (GCP)**: $0.007/hr × 24h × 30d = $5.04/month per node  
- **Basic Droplet (DO)**: $4/month per node

**Recommendation**: Use 3 strategic nodes
- 1× GCP (us-central1): $5.04/mo
- 1× DO (sgp1): $4/mo
- 1× AWS (eu-west-1): $7.49/mo
**Total VPN**: ~$16.50/month

### Axiom Fleets (On-Demand)
Only pay when running. Example:
- **c5.xlarge (AWS)**: $0.17/hr
- **n2-standard-4 (GCP)**: $0.19/hr

For 10-instance fleet running 8 hours/day:
- 10 × $0.17 × 8h × 30d = $408/month

**Optimization**: Use Spot Instances (70% discount!)
- **c5.xlarge Spot**: ~$0.05/hr
- 10 × $0.05 × 8h × 30d = $120/month
**Savings**: $288/month

### Database & Cache
- **PostgreSQL RDS (db.t3.small)**: $25/month
- **Redis ElastiCache (cache.t3.micro)**: $12/month

**Alternative**: Self-hosted on t3.medium = $30/month total

### CDN
- **AWS CloudFront**: $0.085/GB first 10TB
  - 100GB/month = $8.50
- **Cloudflare**: FREE up to unlimited bandwidth!

**Recommendation**: Use Cloudflare = $0/month

### Storage
- **S3 Standard**: $0.023/GB/month
  - 50GB = $1.15/month
- **GCS Standard**: $0.020/GB/month (slightly cheaper)

## Total Cost Estimates

### Minimal Setup (Learning/Testing)
- VPN nodes: $16.50
- Database (self-hosted): $30
- CDN (Cloudflare): $0
- Storage: $1.15
**Total**: ~$48/month

### Active Research (Part-Time)
- VPN nodes: $16.50
- Axiom (spot, 4h/day avg): $60
- Database (RDS): $25
- Redis: $12
- CDN: $0
- Storage: $5
**Total**: ~$118.50/month

### Heavy Usage (Full-Time)
- VPN nodes (5 nodes): $30
- Axiom (spot, 8h/day): $120
- Database (RDS): $50
- Redis: $20
- CDN: $10
- Storage: $20
**Total**: ~$250/month

## Cost Optimization Strategies

### 1. Use Spot Instances
**Savings**: 60-90% off on-demand pricing
```bash
# Configure Axiom for spot instances
ax fleet my-fleet --spot --max-price 0.05
```

### 2. Auto-Scaling
Only run instances when needed:
```javascript
// Stop idle instances after 30 minutes
if (instance.idleTime > 1800) {
  await stopInstance(instance.id);
}
```

### 3. Regional Arbitrage
Choose cheapest regions:
- **Cheapest AWS**: us-east-1
- **Cheapest GCP**: us-central1
- **Cheapest DO**: nyc1

### 4. Reserved Instances
For always-on services (DB, Redis):
- 1-year commitment = 30% discount
- 3-year commitment = 60% discount

### 5. Lifecycle Policies
Auto-delete old data:
```sql
-- Delete OSINT findings older than 90 days
DELETE FROM osint_findings 
WHERE created_at < NOW() - INTERVAL '90 days';
```

### 6. Compression & Deduplication
- Enable gzip compression on S3
- Use PostgreSQL TOAST for large text
- Deduplicate collection results

### 7. Monitoring & Alerts
Set budget alerts:
```terraform
resource "aws_budgets_budget" "atlas" {
  name              = "atlas-monthly-budget"
  budget_type       = "COST"
  limit_amount      = "100"
  limit_unit        = "USD"
  time_period_start = "2025-01-01_00:00"
  time_unit         = "MONTHLY"
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["admin@yourdomain.com"]
  }
}
```

### 8. Alternative Providers
- **Hetzner**: 40% cheaper than AWS for VPS
- **Vultr**: Competitive with DigitalOcean
- **Linode**: Good bandwidth included

## ROI Analysis

Compare to buying individual tools:
- **Steg.ai (watermarking)**: $500/month
- **ProxyRack VPN**: $100/month
- **Bug bounty automation**: $200/month
- **Cloud management tools**: $150/month

**Atlas Framework**: $118/month (active usage)
**Total Savings**: $832/month

## Free Tier Usage

Maximize free tiers:
- **AWS Free Tier**: 750hrs/month t2.micro (12 months)
- **GCP Free Tier**: 1× e2-micro always free
- **DO**: $200 credit for new accounts
- **Cloudflare**: Unlimited CDN bandwidth
- **GitHub**: Free for public repos

**Estimated Free Tier Value**: $50-100/month

## Break-Even Analysis

If doing paid bug bounty work:
- **1 medium bug** ($500) = 4 months of Atlas
- **1 high bug** ($2000) = 16 months of Atlas
- **Critical bug** ($10k+) = Years of Atlas

**Plus**: Time saved with automation = priceless!
"""

with open('cost_optimization_guide.md', 'w') as f:
    f.write(cost_guide)

print("✅ Deployment guides and CDN configurations created")
print("\nGenerated files:")
print("  ✓ terraform_cloudfront.tf - AWS CloudFront CDN setup")
print("  ✓ cloudflare_worker.js - Free Cloudflare CDN alternative")
print("  ✓ deploy_atlas.sh - Automated deployment script")
print("  ✓ cost_optimization_guide.md - Cost analysis and savings")
