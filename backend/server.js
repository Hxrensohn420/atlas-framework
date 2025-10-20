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

// VPN Nodes API
app.get('/api/vpn/nodes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vpn_nodes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching VPN nodes:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/vpn/nodes', async (req, res) => {
  const { provider, region, instance_type, public_ip } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO vpn_nodes (provider, region, instance_type, public_ip, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [provider, region, instance_type, public_ip, 'active']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating VPN node:', err);
    res.status(500).json({ error: 'Database error' });
  }
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
