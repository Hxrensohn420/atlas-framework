const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'atlas-postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'atlas',
  user: process.env.POSTGRES_USER || 'atlas',
  password: process.env.POSTGRES_PASSWORD || 'atlas_secure_password'
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'atlas-backend', timestamp: new Date().toISOString() });
});

// Import mock data
const { mockVPNNodes } = require('./mock-data-frontend-format');

// In-memory storage (for quick dev)
let vpnNodes = [...mockVPNNodes];

// VPN Nodes API (mock version for fast dev)
app.get('/api/vpn/nodes', async (req, res) => {
  // Try DB first, fallback to mock
  try {
    const result = await pool.query('SELECT * FROM vpn_nodes ORDER BY created_at DESC');
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      // No DB data, use mock
      res.json(vpnNodes);
    }
  } catch (err) {
    console.log('DB not ready, using mock data');
    res.json(vpnNodes);
  }
});

app.post('/api/vpn/nodes', async (req, res) => {
  const { provider, region, instance_type, public_ip, location, coordinates } = req.body;
  
  // Mock version - in-memory
  const newNode = {
    id: vpnNodes.length + 1,
    provider,
    region,
    instance_type,
    public_ip,
    location,
    coordinates,
    status: 'active',
    created_at: new Date().toISOString()
  };
  
  vpnNodes.push(newNode);
  res.json(newNode);
});

app.delete('/api/vpn/nodes/:id', async (req, res) => {
  const { id } = req.params;
  const index = vpnNodes.findIndex(n => n.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Node not found' });
  }
  
  const deleted = vpnNodes.splice(index, 1)[0];
  res.json({ success: true, deleted });
});

// Axiom Fleets API
app.get('/api/axiom/fleets', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM axiom_fleets ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching Axiom fleets:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// OSINT Jobs API
app.get('/api/osint/jobs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM osint_jobs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching OSINT jobs:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Collection Jobs API
app.get('/api/collections/jobs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM collection_jobs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching collection jobs:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Atlas Backend API running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  pool.end();
  process.exit(0);
});
