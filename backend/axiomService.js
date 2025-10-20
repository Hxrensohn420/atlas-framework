// backend/src/services/axiomService.js
const { Client } = require('ssh2');
const pool = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');

class AxiomService {
  constructor() {
    this.sshClient = new Client();
    this.controllerIp = process.env.AXIOM_CONTROLLER_IP;
    this.sshKeyPath = process.env.AXIOM_SSH_KEY_PATH;
  }

  // Connect to Axiom controller via SSH
  async connectToController() {
    return new Promise((resolve, reject) => {
      this.sshClient
        .on('ready', () => resolve(this.sshClient))
        .on('error', (err) => reject(err))
        .connect({
          host: this.controllerIp,
          port: 22,
          username: 'axiom',
          privateKey: require('fs').readFileSync(this.sshKeyPath)
        });
    });
  }

  // Execute command on Axiom controller
  async executeAxiomCommand(command) {
    return new Promise((resolve, reject) => {
      this.sshClient.exec(command, (err, stream) => {
        if (err) return reject(err);

        let output = '';
        stream
          .on('data', (data) => { output += data.toString(); })
          .on('close', () => resolve(output))
          .on('error', (error) => reject(error));
      });
    });
  }

  // Deploy new Axiom fleet
  async deployFleet(config) {
    const { userId, fleetName, provider, instanceType, regions, quantity, vpnNodeId, modules } = config;

    try {
      await this.connectToController();

      // Build Axiom command
      const regionsStr = regions.join(',');
      const command = `ax fleet ${fleetName} -i ${quantity} --region ${regionsStr} --provider ${provider} --size ${instanceType}`;

      console.log('Executing:', command);
      const output = await this.executeAxiomCommand(command);

      // Store fleet in database
      const result = await pool.query(
        `INSERT INTO axiom_fleets 
         (user_id, fleet_name, provider, instance_type, instance_count, regions, status, vpn_enabled, default_vpn_node_id, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [userId, fleetName, provider, instanceType, quantity, regions, 'deploying', !!vpnNodeId, vpnNodeId, JSON.stringify({ modules })]
      );

      // If modules specified, install them
      if (modules && modules.length > 0) {
        for (const module of modules) {
          await this.executeAxiomCommand(`ax fleet ${fleetName} -m ${module}`);
        }
      }

      return result.rows[0];
    } catch (error) {
      console.error('Deploy fleet error:', error);
      throw error;
    } finally {
      this.sshClient.end();
    }
  }

  // Get all fleets for user
  async getAllFleets(userId) {
    const result = await pool.query(
      `SELECT af.*, 
              COUNT(ai.id) as instance_count,
              COUNT(ai.id) FILTER (WHERE ai.status = 'running') as running_count,
              vn.region as vpn_region
       FROM axiom_fleets af
       LEFT JOIN axiom_instances ai ON af.id = ai.fleet_id
       LEFT JOIN vpn_nodes vn ON af.default_vpn_node_id = vn.id
       WHERE af.user_id = $1
       GROUP BY af.id, vn.region
       ORDER BY af.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // Get fleet details with all instances
  async getFleetDetails(fleetId, userId) {
    const fleetResult = await pool.query(
      'SELECT * FROM axiom_fleets WHERE id = $1 AND user_id = $2',
      [fleetId, userId]
    );

    if (fleetResult.rows.length === 0) {
      throw new Error('Fleet not found');
    }

    const instancesResult = await pool.query(
      'SELECT * FROM axiom_instances WHERE fleet_id = $1 ORDER BY region, created_at',
      [fleetId]
    );

    return {
      ...fleetResult.rows[0],
      instances: instancesResult.rows
    };
  }

  // Scale fleet up or down
  async scaleFleet(fleetId, action, count, userId) {
    try {
      await this.connectToController();

      const fleet = await pool.query(
        'SELECT fleet_name FROM axiom_fleets WHERE id = $1 AND user_id = $2',
        [fleetId, userId]
      );

      if (fleet.rows.length === 0) {
        throw new Error('Fleet not found');
      }

      const fleetName = fleet.rows[0].fleet_name;

      if (action === 'up') {
        await this.executeAxiomCommand(`ax fleet ${fleetName} --add ${count}`);
      } else {
        await this.executeAxiomCommand(`ax fleet ${fleetName} --remove ${count}`);
      }

      await pool.query(
        'UPDATE axiom_fleets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [fleetId]
      );
    } catch (error) {
      console.error('Scale fleet error:', error);
      throw error;
    } finally {
      this.sshClient.end();
    }
  }

  // Terminate entire fleet
  async terminateFleet(fleetId, userId) {
    try {
      await this.connectToController();

      const fleet = await pool.query(
        'SELECT fleet_name FROM axiom_fleets WHERE id = $1 AND user_id = $2',
        [fleetId, userId]
      );

      if (fleet.rows.length === 0) {
        throw new Error('Fleet not found');
      }

      const fleetName = fleet.rows[0].fleet_name;
      await this.executeAxiomCommand(`ax fleet ${fleetName} --delete`);

      // Update status in database
      await pool.query(
        'UPDATE axiom_fleets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['terminated', fleetId]
      );

      await pool.query(
        'UPDATE axiom_instances SET status = $1 WHERE fleet_id = $2',
        ['terminated', fleetId]
      );
    } catch (error) {
      console.error('Terminate fleet error:', error);
      throw error;
    } finally {
      this.sshClient.end();
    }
  }

  // Execute command on all fleet instances
  async executeCommand(fleetId, command, userId) {
    try {
      await this.connectToController();

      const fleet = await pool.query(
        'SELECT fleet_name FROM axiom_fleets WHERE id = $1 AND user_id = $2',
        [fleetId, userId]
      );

      if (fleet.rows.length === 0) {
        throw new Error('Fleet not found');
      }

      const fleetName = fleet.rows[0].fleet_name;
      const output = await this.executeAxiomCommand(`ax scp ${fleetName} '${command}'`);

      return { output };
    } catch (error) {
      console.error('Execute command error:', error);
      throw error;
    } finally {
      this.sshClient.end();
    }
  }

  // Distribute workload across fleet using axiom-scan
  async distributeWorkload(fleetName, targets, tool, options = {}) {
    try {
      await this.connectToController();

      // Write targets to file on controller
      const targetFile = `/tmp/${fleetName}-targets.txt`;
      await this.executeAxiomCommand(`echo "${targets.join('\n')}" > ${targetFile}`);

      // Run axiom-scan
      const command = `ax scan ${targetFile} -m ${tool} -o /tmp/${fleetName}-results.txt ${options}`;
      const output = await this.executeAxiomCommand(command);

      return { output, resultsFile: `/tmp/${fleetName}-results.txt` };
    } catch (error) {
      console.error('Distribute workload error:', error);
      throw error;
    } finally {
      this.sshClient.end();
    }
  }
}

module.exports = new AxiomService();
