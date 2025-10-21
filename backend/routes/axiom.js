/**
 * Axiom Routes
 * REST API endpoints for Axiom fleet management
 */

const express = require('express');
const router = express.Router();
const axiomService = require('../services/axiomService');

/**
 * Health check - Test Axiom controller connection
 * GET /api/axiom/health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await axiomService.healthCheck();
    res.status(health.success ? 200 : 503).json(health);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get Axiom configuration
 * GET /api/axiom/config
 */
router.get('/config', (req, res) => {
  try {
    const config = axiomService.getConfig();
    res.json({
      success: true,
      config: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * List all instances
 * GET /api/axiom/instances
 */
router.get('/instances', async (req, res) => {
  try {
    const result = await axiomService.listInstances();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get fleet status (parsed instances)
 * GET /api/axiom/status
 */
router.get('/status', async (req, res) => {
  try {
    const result = await axiomService.getFleetStatus();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get selected instances
 * GET /api/axiom/selected
 */
router.get('/selected', async (req, res) => {
  try {
    const result = await axiomService.getSelected();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Select instances by pattern
 * POST /api/axiom/select
 * Body: { "pattern": "myfleet*" }
 */
router.post('/select', async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (!pattern) {
      return res.status(400).json({
        success: false,
        error: 'Pattern is required'
      });
    }
    
    const result = await axiomService.selectInstances(pattern);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Initialize new instance
 * POST /api/axiom/init
 * Body: { "name": "test-instance", "region": "us-east-1" }
 */
router.post('/init', async (req, res) => {
  try {
    const { name, region } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Instance name is required'
      });
    }
    
    const result = await axiomService.initInstance(name, region);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Deploy fleet
 * POST /api/axiom/fleet
 * Body: { "prefix": "myfleet", "count": 5, "regions": ["us-east-1", "eu-west-1"] }
 */
router.post('/fleet', async (req, res) => {
  try {
    const { prefix, count, regions } = req.body;
    
    if (!prefix || !count) {
      return res.status(400).json({
        success: false,
        error: 'Prefix and count are required'
      });
    }
    
    if (count < 1 || count > 50) {
      return res.status(400).json({
        success: false,
        error: 'Count must be between 1 and 50'
      });
    }
    
    const result = await axiomService.deployFleet(prefix, count, regions || []);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Remove instances
 * DELETE /api/axiom/instances/:pattern
 * Example: DELETE /api/axiom/instances/myfleet*
 */
router.delete('/instances/:pattern', async (req, res) => {
  try {
    const { pattern } = req.params;
    
    if (!pattern) {
      return res.status(400).json({
        success: false,
        error: 'Pattern is required'
      });
    }
    
    const result = await axiomService.removeInstances(pattern);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Execute command on selected instances
 * POST /api/axiom/exec
 * Body: { "command": "whoami" }
 */
router.post('/exec', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({
        success: false,
        error: 'Command is required'
      });
    }
    
    const result = await axiomService.execOnInstances(command);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Power instances on/off
 * POST /api/axiom/power
 * Body: { "action": "on|off", "pattern": "myfleet*" }
 */
router.post('/power', async (req, res) => {
  try {
    const { action, pattern } = req.body;
    
    if (!action || !pattern) {
      return res.status(400).json({
        success: false,
        error: 'Action and pattern are required'
      });
    }
    
    const result = await axiomService.powerInstances(action, pattern);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get account info
 * GET /api/axiom/account
 */
router.get('/account', async (req, res) => {
  try {
    const result = await axiomService.getAccountInfo();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get regions
 * GET /api/axiom/regions
 */
router.get('/regions', async (req, res) => {
  try {
    const result = await axiomService.getRegions();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get available sizes
 * GET /api/axiom/sizes
 */
router.get('/sizes', async (req, res) => {
  try {
    const result = await axiomService.getSizes();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
