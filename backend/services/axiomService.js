/**
 * Axiom Service
 * Manages Axiom fleet operations via SSH
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const path = require('path');

// Axiom Configuration from environment
const AXIOM_CONFIG = {
  host: process.env.AXIOM_CONTROLLER_IP || '13.53.50.201',
  user: process.env.AXIOM_SSH_USER || 'ubuntu',
  keyPath: process.env.AXIOM_SSH_KEY || '/app/keys/axiom_controller_key',
  binaryDir: '/home/ubuntu/.axiom/interact',
  timeout: 60000, // 60 seconds
  maxBuffer: 10 * 1024 * 1024 // 10MB
};

// Command to binary mapping
const COMMAND_MAP = {
  'ls': 'axiom-ls',
  'select': 'axiom-select',
  'init': 'axiom-init',
  'fleet': 'axiom-fleet',
  'fleet2': 'axiom-fleet2',
  'rm': 'axiom-rm',
  'exec': 'axiom-exec',
  'account': 'axiom-account',
  'region': 'axiom-region',
  'sizes': 'axiom-sizes',
  'disks': 'axiom-disks',
  'images': 'axiom-images',
  'ssh': 'axiom-ssh',
  'scp': 'axiom-scp',
  'power': 'axiom-power',
  'build': 'axiom-build',
  'deploy': 'axiom-deploy',
  'configure': 'axiom-configure'
};

/**
 * Execute Axiom command over SSH using direct binary
 * @param {string} command - Command name (e.g., 'ls', 'select', 'init')
 * @param {array} args - Command arguments
 * @returns {Promise<object>} - Result with success, output, error
 */
async function executeAxiomCommand(command, args = []) {
  const binary = COMMAND_MAP[command];
  
  if (!binary) {
    return {
      success: false,
      error: `Unknown command: ${command}`,
      command: command,
      timestamp: new Date().toISOString()
    };
  }
  
  const argsString = args.join(' ');
  const binaryPath = `${AXIOM_CONFIG.binaryDir}/${binary}`;
  
  // Build SSH command with direct binary path
  const sshCommand = `ssh -i "${AXIOM_CONFIG.keyPath}" ` +
                    `-o StrictHostKeyChecking=no ` +
                    `-o ConnectTimeout=10 ` +
                    `-o ServerAliveInterval=30 ` +
                    `${AXIOM_CONFIG.user}@${AXIOM_CONFIG.host} ` +
                    `"${binaryPath} ${argsString}"`;
  
  console.log(`[Axiom] Executing: ${binary} ${argsString}`);
  
  try {
    const { stdout, stderr } = await execPromise(sshCommand, {
      timeout: AXIOM_CONFIG.timeout,
      maxBuffer: AXIOM_CONFIG.maxBuffer
    });
    
    // SSH warnings are OK, filter them out
    if (stderr && !stderr.includes('Warning') && !stderr.includes('Pseudo-terminal')) {
      console.error(`[Axiom] stderr: ${stderr}`);
    }
    
    return {
      success: true,
      output: stdout.trim(),
      command: `${binary} ${argsString}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[Axiom] Error executing ${binary}: ${error.message}`);
    return {
      success: false,
      error: error.message,
      command: `${binary} ${argsString}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * List all Axiom instances
 */
async function listInstances() {
  return await executeAxiomCommand('ls');
}

/**
 * Get selected instances
 */
async function getSelected() {
  return await executeAxiomCommand('select');
}

/**
 * Select instances by pattern
 * @param {string} pattern - Instance name pattern (e.g., 'myfleet*')
 */
async function selectInstances(pattern) {
  return await executeAxiomCommand('select', [pattern]);
}

/**
 * Parse axiom-ls output into structured data
 * @param {string} output - Raw output from axiom-ls
 */
function parseInstanceList(output) {
  try {
    const lines = output.split('\n').filter(l => l.trim());
    const instances = [];
    
    for (const line of lines) {
      // Skip header and summary lines
      if (line.includes('Instance') || line.includes('Instances') || line.includes('_')) {
        continue;
      }
      
      // Parse instance line (simplified parser)
      const parts = line.split(/\s+/).filter(p => p);
      if (parts.length >= 6) {
        instances.push({
          name: parts[0],
          primaryIp: parts[1],
          backendIp: parts[2],
          region: parts[3],
          type: parts[4],
          status: parts[5],
          cost: parts.length > 6 ? parts[6] : null
        });
      }
    }
    
    return instances;
  } catch (error) {
    console.error('[Axiom] Error parsing instance list:', error);
    return [];
  }
}

/**
 * Get fleet status with parsed instances
 */
async function getFleetStatus() {
  try {
    const listResult = await listInstances();
    
    if (!listResult.success) {
      return {
        success: false,
        error: 'Failed to get instance list',
        timestamp: new Date().toISOString()
      };
    }
    
    const instances = parseInstanceList(listResult.output);
    
    return {
      success: true,
      instances: instances,
      total: instances.length,
      raw_output: listResult.output,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Initialize new instance
 * @param {string} name - Instance name
 * @param {string} region - Region (optional)
 */
async function initInstance(name, region = '') {
  const args = region ? [`--region=${region}`, name] : [name];
  return await executeAxiomCommand('init', args);
}

/**
 * Deploy fleet
 * @param {string} prefix - Fleet name prefix
 * @param {number} count - Number of instances
 * @param {array} regions - List of regions (optional)
 */
async function deployFleet(prefix, count, regions = []) {
  const args = ['-i', count.toString()];
  if (regions.length > 0) {
    args.push('-r', regions.join(','));
  }
  args.push(prefix);
  return await executeAxiomCommand('fleet', args);
}

/**
 * Remove instances
 * @param {string} pattern - Instance name pattern
 */
async function removeInstances(pattern) {
  return await executeAxiomCommand('rm', [pattern, '-f']);
}

/**
 * Execute command on selected instances
 * @param {string} command - Shell command to execute
 */
async function execOnInstances(command) {
  // Quote the command properly for remote execution
  const quotedCommand = `'${command.replace(/'/g, "'\\''")}'`;
  return await executeAxiomCommand('exec', [quotedCommand]);
}

/**
 * Get account info
 */
async function getAccountInfo() {
  return await executeAxiomCommand('account');
}

/**
 * Get regions
 */
async function getRegions() {
  return await executeAxiomCommand('region');
}

/**
 * Get available sizes
 */
async function getSizes() {
  return await executeAxiomCommand('sizes');
}

/**
 * Power instances on/off
 * @param {string} action - 'on' or 'off'
 * @param {string} pattern - Instance name pattern
 */
async function powerInstances(action, pattern) {
  if (!['on', 'off'].includes(action)) {
    return {
      success: false,
      error: 'Action must be "on" or "off"'
    };
  }
  return await executeAxiomCommand('power', [action, pattern]);
}

/**
 * Health check - test SSH connection to Axiom controller
 */
async function healthCheck() {
  try {
    const result = await listInstances();
    return {
      success: result.success,
      status: result.success ? 'connected' : 'disconnected',
      controller: AXIOM_CONFIG.host,
      message: result.success ? 'Axiom controller is reachable' : result.error,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      status: 'error',
      controller: AXIOM_CONFIG.host,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get Axiom configuration (without sensitive data)
 */
function getConfig() {
  return {
    controller: AXIOM_CONFIG.host,
    user: AXIOM_CONFIG.user,
    keyConfigured: !!AXIOM_CONFIG.keyPath,
    binaryDir: AXIOM_CONFIG.binaryDir
  };
}

module.exports = {
  // Core operations
  listInstances,
  getSelected,
  selectInstances,
  getFleetStatus,
  
  // Instance management
  initInstance,
  deployFleet,
  removeInstances,
  execOnInstances,
  powerInstances,
  
  // Information
  getAccountInfo,
  getRegions,
  getSizes,
  
  // Utils
  healthCheck,
  getConfig,
  executeAxiomCommand
};
