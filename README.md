# 🎯 Atlas VPN Dashboard

**Multi-Cloud VPN Infrastructure Management Platform**

![Status](https://img.shields.io/badge/status-active-success) ![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- **5 Global VPN Nodes**: Monitor infrastructure across AWS, GCP, and DigitalOcean
- **Real-Time Dashboard**: Interactive map with live metrics
- **Traffic Monitoring**: Per-node bandwidth and connection tracking
- **Cost Tracking**: Monthly spending overview per provider
- **Client Management**: Track active connections and sessions
- **Docker Deployment**: Fully containerized with docker-compose

## 🏗️ Architecture

┌─────────────┐
│ Frontend │ (nginx + vanilla JS)
│ Port 3000 │
└──────┬──────┘

│ ┌──────▼
─────┐ │ Backend │ (Node.js E
press) │ Port
000 │ └──────┬
─
───┘ │ ┌───┴
──┬────────────┐ │
│ │ ┌──▼──┐
──▼──┐ ┌───▼───┐ │ DB │
Redis│ │ Kong │ │5432 │
text

### Tech Stack

- **Frontend**: Vanilla JS, Leaflet Maps, Chart.js
- **Backend**: Node.js 20, Express
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **API Gateway**: Kong 3.5
- **Deployment**: Docker Compose

## 📦 Quick Start

### Prerequisites

docker --version # Docker 20+
docker-compo

text

- 4GB+ RAM
- Ports: 3000, 5000, 5432, 6379, 8000-8002

### Installation

Clone repository
git clone https://github.com/Hxrensohn420/atlas-framework.git
cd atlas-framewor

Start all services
docker-compose -f docker-compose-atlas.yml up -d

Check status
docker-compose -f docker-compose-atlas.yml ps

View logs
docker-compose -f docker-compose-atlas.yml logs -f

text

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Dashboard** | http://localhost:3000 | Main web interface |
| **Backend API** | http://localhost:5000 | REST API |
| **Kong Gateway** | http://localhost:8000 | API Gateway |
| **Kong Admin** | http://localhost:8001 | Kong management |

## 🌍 VPN Nodes

| Location | Provider | IP | Status |
|----------|----------|-----|--------|
| Virginia, USA | AWS EC2 | 54.123.45.67 | 🟢 Active |
| Belgium | GCP | 34.76.89.12 | 🟢 Active |
| Singapore | DigitalOcean | 143.198.45.78 | 🟢 Active |
| Tokyo, Japan | AWS EC2 | 52.193.12.34 | 🟢 Active |
| Frankfurt, Germany | DigitalOcean | 164.92.156.23 | 🟢 Active |

## 📊 API Endpoints

### VPN Management
GET /health # Health check
GET /api/vpn/nodes # List all VPN nodes
GET /api/vpn/nodes/:id # Get specific node
text

### Example Response
{
"id": "vpn-001
, "name": "Virginia Prima
y", "location": "US-
ast", "provider"
"aws", "status":
"active", "cl
ents": 142,
bandwidth": {
"in": "1.2 GB
,
text

## 🔧 Configuration

All configuration via environment variables. See `.env.example`.

### Default Credentials

Database (auto-generated on first run)
DB_NAME=atlas
DB_USER=atlas
DB_P<random>

Ports
FRONTEND_PORT=3000
BACKEND_PORT=5000
POSTGRES_PORT=5432
text

## 🛠️ Development

### Local Development

Start services
docker-compose -f docker-compose-atlas.yml up

Rebuild after changes
docker-compose -f docker-compose-atlas.yml build
docker-compose -f docker-compose

View backend logs
docker-compose -f docker-compose-atlas.yml logs -f backend

Stop all services
docker-compose -f docker-compose-atlas.yml down

Full cleanup (including volumes)
docker-compose -f docker-compose-atlas.yml down -v

text

### Project Structure

atlas-framework/
├── frontend/ # Frontend static files
│ ├── app.js # Main application logic
│ ├── index.html # HTML template
│ └── style.css # Styles
├── backend/ # Backend API
│ ├── server.js # Express server
│ ├── atlas_schema.sql # Database schema
│ └── package.json # Dependencies
├── deployment/ # Deployment configs
│ ├── local/ # Local deployment
│ └── aws/ # AWS deployment
├── docs/ # Documentation
text

## 📸 Screenshots

### Dashboard Overview
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard+Screenshot)

### Node Details
![Node View](https://via.placeholder.com/800x400?text=Node+Details)

## 🚀 Roadmap

### Completed ✅
- [x] VPN node dashboard
- [x] Interactive map visualization
- [x] PostgreSQL backend
- [x] Redis caching
- [x] Docker deployment
- [x] Kong API Gateway integration

### In Progress 🚧
- [ ] AWS EC2 deployment automation
- [ ] Real-time WebSocket updates
- [ ] User authentication (JWT)

### Planned 📋
- [ ] WireGuard VPN automation
- [ ] Axiom fleet orchestration
- [ ] OSINT workflow integration
- [ ] Cost optimization engine
- [ ] Multi-user support

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## ⚠️ Disclaimer

This is a security research tool. Use responsibly and ethically. The authors are not responsible for misuse.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Hxrensohn420/atlas-framework/issues)
- **Docs**: See `/docs` folder

---

**Built with ❤️ for security researchers and infrastructure engineers**
