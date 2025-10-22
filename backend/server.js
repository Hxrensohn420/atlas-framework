const express = require('express');
const cors = require('cors');
const http = require('http');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
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

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
    } else {
        console.log('✅ Database connected:', res.rows[0].now);
    }
});

// ============================================================================
// IMPORT ROUTES
// ============================================================================

const axiomRoutes = require('./routes/axiom'); // Existing Axiom API
const unifiedRoutes = require('./routes/unified'); // Unified advanced API
const authRoutes = require('./routes/auth'); // Auth routes

// NEW AXIOM DASHBOARD ROUTES
const controllersRoute = require('./routes/controllers')(pool);
const scansRoute = require('./routes/scans')(pool);
const filesRoute = require('./routes/files')(pool);
const { router: terminalRouter, initializeWebSocket } = require('./routes/terminal')(pool);

// ============================================================================
// REGISTER ROUTES
// ============================================================================

// Existing routes
app.use('/api/axiom', axiomRoutes); // Direct Axiom control
app.use('/api', unifiedRoutes); // Advanced unified API
app.use('/api/auth', authRoutes); // Auth routes

// NEW AXIOM DASHBOARD ROUTES
app.use('/api/controllers', controllersRoute); // Multi-controller management
app.use('/api/scans', scansRoute); // Scan management
app.use('/api/files', filesRoute); // File operations
app.use('/api/terminal', terminalRouter); // Terminal REST endpoints

console.log('✅ Routes registered:');
console.log('   - /api/axiom/* (Direct Axiom control)');
console.log('   - /api/controllers/* (Multi-controller management) [NEW]');
console.log('   - /api/scans/* (Scan management) [NEW]');
console.log('   - /api/files/* (File operations) [NEW]');
console.log('   - /api/terminal/* (Terminal API) [NEW]');
console.log('   - /api/vpn/* (VPN management)');
console.log('   - /api/osint/* (OSINT scans)');
console.log('   - /api/collection/* (Collection jobs)');
console.log('   - /api/analytics/* (Analytics & costs)');

// ============================================================================
// WEBSOCKET TERMINAL SERVER
// ============================================================================

const wss = initializeWebSocket(server, pool);
console.log('✅ WebSocket terminal server initialized on /terminal');

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', async (req, res) => {
    try {
        const dbCheck = await pool.query('SELECT NOW()');
        res.json({
            status: 'ok',
            service: 'atlas-backend',
            database: 'connected',
            websocket: wss ? 'active' : 'inactive',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            service: 'atlas-backend',
            database: 'disconnected',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
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
// START SERVER (HTTP + WebSocket)
// ============================================================================

server.listen(port, () => {
    console.log('');
    console.log('='.repeat(60));
    console.log('🚀 Atlas Backend API + WebSocket Server');
    console.log('='.repeat(60));
    console.log(`📡 HTTP Server: http://localhost:${port}`);
    console.log(`🔌 WebSocket: ws://localhost:${port}/terminal`);
    console.log(`📊 Health Check: http://localhost:${port}/health`);
    console.log(`📚 API Base: http://localhost:${port}/api`);
    console.log('='.repeat(60));
    console.log('');
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');

    // Close WebSocket connections
    if (wss) {
        wss.clients.forEach((client) => {
            client.close();
        });
        wss.close();
    }

    // Close database pool
    pool.end();

    // Close HTTP server
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully');

    if (wss) {
        wss.close();
    }

    pool.end();

    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
