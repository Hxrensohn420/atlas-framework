# Atlas Framework - Cost Optimization Guide

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
