// backend/src/routes/unified.js - Atlas Framework Unified API
const express = require('express');
const router = express.Router();

// Import all service modules
const vpnService = require('../services/vpnService');
const axiomService = require('../services/axiomService');
const ars0nService = require('../services/ars0nService');
const collectionService = require('../services/collectionService');
const analyticsService = require('../services/analyticsService');

// ============================================================================
// VPN MANAGEMENT ENDPOINTS
// ============================================================================

// Get all VPN nodes
router.get('/vpn/nodes', async (req, res) => {
  try {
    const nodes = await vpnService.getAllNodes(req.user.userId);
    res.json({ success: true, nodes });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching VPN nodes', error: error.message });
  }
});

// Deploy new VPN node
router.post('/vpn/deploy', async (req, res) => {
  try {
    const { provider, region, quantity } = req.body;
    const result = await vpnService.deployNodes({
      userId: req.user.userId,
      provider,
      region,
      quantity
    });
    res.json({ success: true, nodes: result });
  } catch (error) {
    res.status(500).json({ message: 'Error deploying VPN nodes', error: error.message });
  }
});

// Get VPN configuration
router.get('/vpn/:nodeId/config', async (req, res) => {
  try {
    const config = await vpnService.getConfig(req.params.nodeId, req.user.userId);
    res.json({ success: true, config });
  } catch (error) {
    res.status(404).json({ message: 'VPN node not found' });
  }
});

// Get VPN QR code
router.get('/vpn/:nodeId/qr', async (req, res) => {
  try {
    const qrCode = await vpnService.getQRCode(req.params.nodeId, req.user.userId);
    res.json({ success: true, qrCode });
  } catch (error) {
    res.status(404).json({ message: 'VPN node not found' });
  }
});

// Delete VPN node
router.delete('/vpn/:nodeId', async (req, res) => {
  try {
    await vpnService.deleteNode(req.params.nodeId, req.user.userId);
    res.json({ success: true, message: 'VPN node deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting VPN node' });
  }
});

// ============================================================================
// AXIOM FLEET MANAGEMENT ENDPOINTS
// ============================================================================

// Get all fleets
router.get('/axiom/fleets', async (req, res) => {
  try {
    const fleets = await axiomService.getAllFleets(req.user.userId);
    res.json({ success: true, fleets });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fleets' });
  }
});

// Deploy new fleet
router.post('/axiom/fleet/deploy', async (req, res) => {
  try {
    const { fleetName, provider, instanceType, regions, quantity, vpnNodeId, modules } = req.body;

    const fleet = await axiomService.deployFleet({
      userId: req.user.userId,
      fleetName,
      provider,
      instanceType,
      regions,
      quantity,
      vpnNodeId,
      modules
    });

    res.json({ success: true, fleet });
  } catch (error) {
    res.status(500).json({ message: 'Error deploying fleet', error: error.message });
  }
});

// Get fleet details with instances
router.get('/axiom/fleet/:fleetId', async (req, res) => {
  try {
    const fleet = await axiomService.getFleetDetails(req.params.fleetId, req.user.userId);
    res.json({ success: true, fleet });
  } catch (error) {
    res.status(404).json({ message: 'Fleet not found' });
  }
});

// Scale fleet
router.post('/axiom/fleet/:fleetId/scale', async (req, res) => {
  try {
    const { action, count } = req.body; // action: 'up' or 'down'
    await axiomService.scaleFleet(req.params.fleetId, action, count, req.user.userId);
    res.json({ success: true, message: `Fleet scaled ${action}` });
  } catch (error) {
    res.status(500).json({ message: 'Error scaling fleet' });
  }
});

// Terminate fleet
router.delete('/axiom/fleet/:fleetId', async (req, res) => {
  try {
    await axiomService.terminateFleet(req.params.fleetId, req.user.userId);
    res.json({ success: true, message: 'Fleet terminated' });
  } catch (error) {
    res.status(500).json({ message: 'Error terminating fleet' });
  }
});

// Execute command on fleet
router.post('/axiom/fleet/:fleetId/execute', async (req, res) => {
  try {
    const { command } = req.body;
    const results = await axiomService.executeCommand(req.params.fleetId, command, req.user.userId);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ message: 'Error executing command' });
  }
});

// ============================================================================
// ARS0N OSINT ENDPOINTS
// ============================================================================

// Get all OSINT jobs
router.get('/osint/jobs', async (req, res) => {
  try {
    const jobs = await ars0nService.getAllJobs(req.user.userId);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching OSINT jobs' });
  }
});

// Start new OSINT scan
router.post('/osint/scan', async (req, res) => {
  try {
    const { jobName, target, scanType, modules, axiomFleetId, vpnNodeId } = req.body;

    const job = await ars0nService.startScan({
      userId: req.user.userId,
      jobName,
      target,
      scanType,
      modules,
      axiomFleetId,
      vpnNodeId
    });

    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ message: 'Error starting OSINT scan', error: error.message });
  }
});

// Get OSINT job status and progress
router.get('/osint/job/:jobId', async (req, res) => {
  try {
    const job = await ars0nService.getJobStatus(req.params.jobId, req.user.userId);
    res.json({ success: true, job });
  } catch (error) {
    res.status(404).json({ message: 'Job not found' });
  }
});

// Get OSINT findings
router.get('/osint/job/:jobId/findings', async (req, res) => {
  try {
    const findings = await ars0nService.getFindings(req.params.jobId, req.user.userId);
    res.json({ success: true, findings });
  } catch (error) {
    res.status(404).json({ message: 'Job not found' });
  }
});

// Stop OSINT job
router.post('/osint/job/:jobId/stop', async (req, res) => {
  try {
    await ars0nService.stopJob(req.params.jobId, req.user.userId);
    res.json({ success: true, message: 'Job stopped' });
  } catch (error) {
    res.status(500).json({ message: 'Error stopping job' });
  }
});

// ============================================================================
// COLLECTION JOBS ENDPOINTS
// ============================================================================

// Get all collection jobs
router.get('/collection/jobs', async (req, res) => {
  try {
    const jobs = await collectionService.getAllJobs(req.user.userId);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching collection jobs' });
  }
});

// Create new collection job
router.post('/collection/job', async (req, res) => {
  try {
    const { jobName, jobType, targetList, command, axiomFleetId, distributionStrategy, rateLimit } = req.body;

    const job = await collectionService.createJob({
      userId: req.user.userId,
      jobName,
      jobType,
      targetList,
      command,
      axiomFleetId,
      distributionStrategy,
      rateLimit
    });

    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ message: 'Error creating collection job', error: error.message });
  }
});

// Get collection job results
router.get('/collection/job/:jobId/results', async (req, res) => {
  try {
    const results = await collectionService.getResults(req.params.jobId, req.user.userId);
    res.json({ success: true, results });
  } catch (error) {
    res.status(404).json({ message: 'Job not found' });
  }
});

// Export collection results
router.get('/collection/job/:jobId/export/:format', async (req, res) => {
  try {
    const { format } = req.params; // csv, json, excel
    const data = await collectionService.exportResults(req.params.jobId, format, req.user.userId);

    res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=results.${format}`);
    res.send(data);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting results' });
  }
});

// ============================================================================
// ANALYTICS & COST TRACKING ENDPOINTS
// ============================================================================

// Get infrastructure overview
router.get('/analytics/overview', async (req, res) => {
  try {
    const overview = await analyticsService.getOverview(req.user.userId);
    res.json({ success: true, overview });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching overview' });
  }
});

// Get cost breakdown
router.get('/analytics/costs', async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    const costs = await analyticsService.getCosts({
      userId: req.user.userId,
      startDate,
      endDate,
      groupBy: groupBy || 'day'
    });
    res.json({ success: true, costs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching costs' });
  }
});

// Get usage statistics
router.get('/analytics/usage', async (req, res) => {
  try {
    const { period } = req.query; // day, week, month
    const usage = await analyticsService.getUsageStats(req.user.userId, period);
    res.json({ success: true, usage });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching usage stats' });
  }
});

// Get cost optimization recommendations
router.get('/analytics/recommendations', async (req, res) => {
  try {
    const recommendations = await analyticsService.getRecommendations(req.user.userId);
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recommendations' });
  }
});

// ============================================================================
// UNIFIED MAP DATA ENDPOINT
// ============================================================================

// Get all infrastructure for world map
router.get('/map/infrastructure', async (req, res) => {
  try {
    const vpnNodes = await vpnService.getAllNodes(req.user.userId);
    const fleets = await axiomService.getAllFleets(req.user.userId);
    const osintJobs = await ars0nService.getActiveJobs(req.user.userId);
    const collectionJobs = await collectionService.getActiveJobs(req.user.userId);

    res.json({
      success: true,
      infrastructure: {
        vpnNodes,
        axiomFleets: fleets,
        osintJobs,
        collectionJobs
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching infrastructure data' });
  }
});

module.exports = router;
