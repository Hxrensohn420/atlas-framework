# 🎯 Atlas Security Research Framework

> **Full-stack unified security research platform with VPN management, Axiom fleet orchestration, and OSINT operations**

## 🚀 Features

- **VPN Management**: Deploy and manage WireGuard nodes across multiple providers
- **Axiom Integration**: Automated cloud instance fleet orchestration
- **OSINT Operations**: Coordinated intelligence gathering workflows
- **Cost Tracking**: Real-time multi-cloud spending monitoring
- **Interactive Dashboard**: React-based UI with live maps and metrics
- **API Gateway**: Kong-powered rate limiting and authentication
- **Scalable Architecture**: Microservices with Redis queue and PostgreSQL

## 🏗️ Architecture

Frontend (React) → Kong Gateway → Backend API (Node.js)
↓
PostgreSQL + Redis + Axiom Proxy


### Tech Stack

- **Frontend**: React 18, Leaflet Maps, Chart.js
- **Backend**: Node.js, Express
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7
- **API Gateway**: Kong 3.5
- **Deployment**: Docker Compose

## 📦 Quick Start

### Prerequisites

- Docker & Docker Compose
- 4GB+ RAM
- Ports 3000, 5000, 8000-8002 available

### Installation

Clone repository
git clone https://github.com/YOUR_USERNAME/atlas-framework.git
cd atlas-framework
Copy environment file
cp .env.example .env
Edit .env and add your credentials
nano .env
Start services
docker-compose -f docker-compose-atlas.yml up -d
Check status
docker-compose -f docker-compose-atlas.yml ps



### Access

- **Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Kong Admin**: http://localhost:8001
- **Kong Manager**: http://localhost:8002

## 🔧 Configuration

See `.env.example` for all configuration options.

Required environment variables:
- `DB_PASSWORD` - PostgreSQL password
- `JWT_SECRET` - JWT signing key

Optional (for integrations):
- `DO_API_TOKEN` - DigitalOcean API token
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AXIOM_CONTROLLER_IP` - Axiom controller IP

## 📊 API Endpoints

GET /health - Health check
GET /api/vpn/nodes - List VPN nodes
POST /api/vpn/nodes - Create VPN node
GET /api/axiom/fleets - List Axiom fleets
GET /api/osint/jobs - List OSINT jobs


## 🛠️ Development

View logs
docker-compose -f docker-compose-atlas.yml logs -f backend
Rebuild after changes
docker-compose -f docker-compose-atlas.yml build
docker-compose -f docker-compose-atlas.yml up -d
Stop all services
docker-compose -f docker-compose-atlas.yml down



## 🔮 Roadmap

- [x] Core infrastructure
- [x] Database schema
- [x] API Gateway
- [ ] Ars0n Framework integration
- [ ] WireGuard VPN automation
- [ ] Full Axiom fleet management
- [ ] OSINT workflow engine
- [ ] Cost optimization engine

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## ⚠️ Security

This is security research software. Use responsibly and ethically.
