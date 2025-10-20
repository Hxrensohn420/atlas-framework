const http = require('http');
const url = require('url');

const PORT = 5000;

// Mock data
const mockData = {
  stats: {
    totalInstances: 12,
    activeInstances: 8,
    totalCost: 156.42,
    monthlyCost: 3245.67,
    instances: [
      { id: 'i-001', name: 'axiom-controller', type: 't3.medium', status: 'running', cost: 45.20 },
      { id: 'i-002', name: 'worker-1', type: 't3.small', status: 'running', cost: 23.10 },
      { id: 'i-003', name: 'worker-2', type: 't3.small', status: 'stopped', cost: 0 }
    ],
    costsByService: {
      'EC2': 1245.50,
      'S3': 245.30,
      'CloudFront': 156.78,
      'RDS': 678.90
    }
  },
  health: {
    status: 'healthy',
    services: {
      database: 'online',
      redis: 'online',
      axiom: 'online'
    }
  }
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${parsedUrl.pathname}`);
  
  // API Routes
  if (parsedUrl.pathname === '/api/stats') {
    res.writeHead(200);
    res.end(JSON.stringify(mockData.stats));
  } 
  else if (parsedUrl.pathname === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify(mockData.health));
  }
  else if (parsedUrl.pathname === '/api/instances') {
    res.writeHead(200);
    res.end(JSON.stringify(mockData.stats.instances));
  }
  else if (parsedUrl.pathname === '/api/costs') {
    res.writeHead(200);
    res.end(JSON.stringify(mockData.stats.costsByService));
  }
  else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Atlas Mock Backend running on http://localhost:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /api/stats      - Dashboard statistics`);
  console.log(`  GET  /api/health     - System health`);
  console.log(`  GET  /api/instances  - EC2 instances`);
  console.log(`  GET  /api/costs      - Cost breakdown`);
  console.log(`\nFrontend: http://localhost:3000\n`);
});
