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

// ============================================================================
// IMPORT ROUTES
// ============================================================================
const axiomRoutes = require('./routes/axiom');        // NEW: Simple Axiom API
const unifiedRoutes = require('./routes/unified');    // NEW: Unified advanced API
const authRoutes = require('./routes/auth');          // NEW: Simple AUTH API      // Auth routes (login, signup, etc.)
// ============================================================================
// REGISTER ROUTES
// ============================================================================
app.use('/api/axiom', axiomRoutes);                   // Direct Axiom control
app.use('/api', unifiedRoutes);                       // Advanced unified API 
app.use('/api/auth', authRoutes);                     // Auth routes

console.log('✅ Routes registered:');
console.log('   - /api/axiom/*        (Direct Axiom control)');
console.log('   - /api/vpn/*          (VPN management)');
console.log('   - /api/osint/*        (OSINT scans)');
console.log('   - /api/collection/*   (Collection jobs)');
console.log('   - /api/analytics/*    (Analytics & costs)');

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'atlas-backend', 
    timestamp: new Date().toISOString() 
  });
});

// ============================================================================
// LEGACY MOCK DATA ROUTES (Fallback for quick dev)
// ============================================================================

// Import mock data
const { mockVPNNodes } = require('./mock-data-frontend-format');

// In-memory storage (for quick dev)
let vpnNodes = [...mockVPNNodes];

// Legacy VPN Nodes API (fallback if routes don't work)
app.get('/api/vpn/nodes/mock', async (req, res) => {
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

app.post('/api/vpn/nodes/mock', async (req, res) => {
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

app.delete('/api/vpn/nodes/mock/:id', async (req, res) => {
  const { id } = req.params;
  const index = vpnNodes.findIndex(n => n.id === parseInt(id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Node not found' });
  }
  
  const deleted = vpnNodes.splice(index, 1)[0];
  res.json({ success: true, deleted });
});

// Legacy Axiom Fleets API (fallback)
app.get('/api/axiom/fleets/mock', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM axiom_fleets ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching Axiom fleets:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Legacy OSINT Jobs API (fallback)
app.get('/api/osint/jobs/mock', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM osint_jobs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching OSINT jobs:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Legacy Collection Jobs API (fallback)
app.get('/api/collections/jobs/mock', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM collection_jobs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching collection jobs:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================================
// START SERVER
// ============================================================================
app.listen(port, () => {
  console.log(`🚀 Atlas Backend API running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`📡 API endpoints: http://localhost:${port}/api`);
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  pool.end();
  process.exit(0);
});
