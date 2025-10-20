
# Create unified Docker Compose for Atlas Framework

docker_compose_atlas = """version: '3.9'

# Atlas Framework - Unified Security Research Platform
# Components: VPN + Axiom + Ars0n + Collection + CDN

networks:
  atlas-net:
    driver: bridge
  
volumes:
  postgres_data:
  redis_data:
  axiom_data:

services:
  # ============================================================================
  # API GATEWAY - Kong
  # ============================================================================
  
  kong-database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: kong
      POSTGRES_USER: kong
      POSTGRES_PASSWORD: ${KONG_DB_PASSWORD:-kongpass}
    networks:
      - atlas-net
    volumes:
      - ./data/kong-db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "kong"]
      interval: 10s
      timeout: 5s
      retries: 5

  kong-migrations:
    image: kong/kong-gateway:3.5
    command: kong migrations bootstrap
    depends_on:
      kong-database:
        condition: service_healthy
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-database
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: ${KONG_DB_PASSWORD:-kongpass}
    networks:
      - atlas-net
    restart: on-failure

  kong-gateway:
    image: kong/kong-gateway:3.5
    depends_on:
      kong-migrations:
        condition: service_completed_successfully
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-database
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: ${KONG_DB_PASSWORD:-kongpass}
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
      KONG_PROXY_LISTEN: 0.0.0.0:8000, 0.0.0.0:8443 ssl
      KONG_ADMIN_GUI_URL: http://localhost:8002
    networks:
      - atlas-net
    ports:
      - "8000:8000"    # Proxy
      - "8001:8001"    # Admin API
      - "8002:8002"    # Admin GUI
      - "8443:8443"    # Proxy SSL
    healthcheck:
      test: ["CMD", "kong", "health"]
      interval: 10s
      timeout: 10s
      retries: 10
    restart: unless-stopped

  # ============================================================================
  # FRONTEND - React Dashboard
  # ============================================================================
  
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: atlas-frontend
    environment:
      - REACT_APP_API_URL=http://localhost:8000/api
      - REACT_APP_WS_URL=ws://localhost:8000/ws
      - REACT_APP_CDN_URL=${CDN_URL:-http://localhost:3000}
    ports:
      - "3000:80"
    networks:
      - atlas-net
    depends_on:
      - kong-gateway
    restart: unless-stopped

  # ============================================================================
  # BACKEND - Unified API
  # ============================================================================
  
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: atlas-backend
    environment:
      # Application
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 5000
      
      # JWT
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRY: 24h
      
      # Database
      DATABASE_URL: postgresql://atlas:${DB_PASSWORD}@postgres:5432/atlas
      
      # Redis
      REDIS_URL: redis://redis:6379
      
      # AWS
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_DEFAULT_REGION: ${AWS_DEFAULT_REGION:-us-east-1}
      
      # GCP
      GCP_PROJECT_ID: ${GCP_PROJECT_ID}
      GCP_SERVICE_ACCOUNT_KEY: ${GCP_SERVICE_ACCOUNT_KEY}
      
      # DigitalOcean
      DO_API_TOKEN: ${DO_API_TOKEN}
      
      # Axiom
      AXIOM_SSH_KEY_PATH: /keys/axiom_rsa
      AXIOM_CONTROLLER_IP: ${AXIOM_CONTROLLER_IP}
      
      # Security
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      RATE_LIMIT_MAX: 100
      RATE_LIMIT_WINDOW: 15m
    ports:
      - "5000:5000"
    networks:
      - atlas-net
    volumes:
      - ./keys:/keys:ro
      - ./data/uploads:/app/uploads
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # ============================================================================
  # DATABASE - PostgreSQL
  # ============================================================================
  
  postgres:
    image: postgres:15-alpine
    container_name: atlas-postgres
    environment:
      POSTGRES_DB: atlas
      POSTGRES_USER: atlas
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_INITDB_ARGS: "-E UTF8"
    ports:
      - "5432:5432"
    networks:
      - atlas-net
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./atlas_schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U atlas"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ============================================================================
  # CACHE & QUEUE - Redis
  # ============================================================================
  
  redis:
    image: redis:7-alpine
    container_name: atlas-redis
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    networks:
      - atlas-net
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ============================================================================
  # AXIOM CONTROLLER PROXY
  # ============================================================================
  
  axiom-proxy:
    build:
      context: ./services/axiom-proxy
      dockerfile: Dockerfile
    container_name: atlas-axiom-proxy
    environment:
      - AXIOM_CONTROLLER_HOST=${AXIOM_CONTROLLER_IP}
      - AXIOM_SSH_KEY=/keys/axiom_rsa
      - REDIS_URL=redis://redis:6379
    networks:
      - atlas-net
    volumes:
      - ./keys:/keys:ro
    depends_on:
      - redis
    restart: unless-stopped

  # ============================================================================
  # ARS0N FRAMEWORK INTEGRATION
  # ============================================================================
  
  ars0n-service:
    image: ghcr.io/r-s0n/ars0n-framework-v2:latest
    container_name: atlas-ars0n
    environment:
      - DATABASE_URL=postgresql://atlas:${DB_PASSWORD}@postgres:5432/atlas
      - REDIS_URL=redis://redis:6379
      - AXIOM_SSH_KEY=/keys/axiom_rsa
      - AXIOM_CONTROLLER=${AXIOM_CONTROLLER_IP}
    networks:
      - atlas-net
    volumes:
      - ./keys:/keys:ro
      - ./data/ars0n-results:/results
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # ============================================================================
  # COLLECTION WORKERS
  # ============================================================================
  
  collection-worker:
    build:
      context: ./services/collection-worker
      dockerfile: Dockerfile
    container_name: atlas-collection-worker
    environment:
      - DATABASE_URL=postgresql://atlas:${DB_PASSWORD}@postgres:5432/atlas
      - REDIS_QUEUE=redis://redis:6379
      - WORKER_CONCURRENCY=5
    networks:
      - atlas-net
    volumes:
      - ./data/collection-results:/results
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 3
    restart: unless-stopped

  # ============================================================================
  # MONITORING - Prometheus & Grafana (Optional)
  # ============================================================================
  
  prometheus:
    image: prom/prometheus:latest
    container_name: atlas-prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    networks:
      - atlas-net
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./data/prometheus:/prometheus
    restart: unless-stopped
    profiles:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: atlas-grafana
    ports:
      - "3001:3000"
    networks:
      - atlas-net
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
    volumes:
      - ./data/grafana:/var/lib/grafana
      - ./monitoring/grafana-dashboards:/etc/grafana/provisioning/dashboards
    restart: unless-stopped
    profiles:
      - monitoring

  # ============================================================================
  # NGINX REVERSE PROXY (Optional for production)
  # ============================================================================
  
  nginx:
    image: nginx:alpine
    container_name: atlas-nginx
    ports:
      - "80:80"
      - "443:443"
    networks:
      - atlas-net
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - kong-gateway
    restart: unless-stopped
    profiles:
      - production
"""

with open('docker-compose-atlas.yml', 'w') as f:
    f.write(docker_compose_atlas)

# Create environment template
env_atlas = """# Atlas Framework Environment Configuration

# ============================================================================
# APPLICATION
# ============================================================================
NODE_ENV=production
CDN_URL=https://cdn.yourdomain.com

# ============================================================================
# SECURITY
# ============================================================================
JWT_SECRET=generate-with-openssl-rand-base64-32
ENCRYPTION_KEY=generate-with-openssl-rand-base64-32

# ============================================================================
# DATABASE
# ============================================================================
DB_PASSWORD=change-this-secure-password
KONG_DB_PASSWORD=kong-secure-password

# ============================================================================
# AWS CREDENTIALS
# ============================================================================
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_DEFAULT_REGION=us-east-1

# ============================================================================
# GCP CREDENTIALS
# ============================================================================
GCP_PROJECT_ID=your-gcp-project-id
GCP_SERVICE_ACCOUNT_KEY=base64-encoded-service-account-json

# ============================================================================
# DIGITALOCEAN
# ============================================================================
DO_API_TOKEN=your-digitalocean-api-token

# ============================================================================
# AXIOM CONFIGURATION
# ============================================================================
AXIOM_CONTROLLER_IP=your-axiom-controller-ip
# Generate SSH key: ssh-keygen -t rsa -b 4096 -f ./keys/axiom_rsa -N ""

# ============================================================================
# MONITORING (Optional)
# ============================================================================
GRAFANA_PASSWORD=admin-change-this

# ============================================================================
# CDN CONFIGURATION (Choose one)
# ============================================================================

# Option 1: AWS CloudFront
AWS_CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id

# Option 2: Cloudflare
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_API_TOKEN=your-api-token

# Option 3: GCP Cloud CDN
GCP_CDN_BACKEND_BUCKET=your-cdn-bucket
"""

with open('.env.atlas.example', 'w') as f:
    f.write(env_atlas)

print("✅ Docker Compose and environment template created")
print("\nGenerated files:")
print("  ✓ docker-compose-atlas.yml - Complete multi-service stack")
print("  ✓ .env.atlas.example - Environment configuration")
