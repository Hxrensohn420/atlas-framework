// backend/routes/scans.js
// Axiom Scan Management API

const express = require('express');
const router = express.Router();

module.exports = (db) => {
    const axiomService = require('../services/axiomService');

    // List all scans
    router.get('/', async (req, res) => {
        try {
            const result = await db.query(`
                SELECT s.*, c.name as controller_name, f.name as fleet_name
                FROM axiom_scans s
                LEFT JOIN axiom_controllers c ON s.controller_id = c.id
                LEFT JOIN axiom_fleets f ON s.fleet_id = f.id
                ORDER BY s.created_at DESC
            `);
            res.json({ success: true, scans: result.rows });
        } catch (err) {
            console.error('❌ Failed to list scans:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Create new scan
    router.post('/', async (req, res) => {
        try {
            const { name, scan_module, targets, arguments, fleet_id } = req.body;

            if (!name || !scan_module || !targets) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Name, scan_module, and targets required' 
                });
            }

            // Get active controller
            const controllerResult = await db.query(`
                SELECT * FROM axiom_controllers WHERE is_active = true LIMIT 1
            `);

            if (controllerResult.rows.length === 0) {
                return res.status(400).json({ success: false, error: 'No active controller' });
            }

            const controller = controllerResult.rows[0];

            // Insert scan record
            const scanResult = await db.query(`
                INSERT INTO axiom_scans 
                (controller_id, fleet_id, name, scan_module, targets, arguments, status, started_at)
                VALUES ($1, $2, $3, $4, $5, $6, 'running', NOW())
                RETURNING *
            `, [controller.id, fleet_id, name, scan_module, targets, arguments]);

            const scan = scanResult.rows[0];

            // Execute scan asynchronously
            executeAxiomScan(controller, scan, db).catch(err => {
                console.error('❌ Scan execution failed:', err);
                db.query(`
                    UPDATE axiom_scans 
                    SET status = 'failed', completed_at = NOW()
                    WHERE id = $1
                `, [scan.id]);
            });

            res.json({ success: true, scan });
        } catch (err) {
            console.error('❌ Failed to create scan:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Get scan details
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await db.query(`
                SELECT s.*, c.name as controller_name
                FROM axiom_scans s
                LEFT JOIN axiom_controllers c ON s.controller_id = c.id
                WHERE s.id = $1
            `, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Scan not found' });
            }

            res.json({ success: true, scan: result.rows[0] });
        } catch (err) {
            console.error('❌ Failed to get scan:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Cancel scan
    router.post('/:id/cancel', async (req, res) => {
        try {
            const { id } = req.params;

            // Update status to cancelled
            const result = await db.query(`
                UPDATE axiom_scans 
                SET status = 'cancelled', completed_at = NOW()
                WHERE id = $1
                RETURNING *
            `, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Scan not found' });
            }

            res.json({ success: true, scan: result.rows[0] });
        } catch (err) {
            console.error('❌ Failed to cancel scan:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    return router;
};

// Helper function to execute scan
async function executeAxiomScan(controller, scan, db) {
    const axiomService = require('../services/axiomService');

    try {
        // Build axiom-scan command
        const cmd = `axiom-scan ${scan.targets} -m ${scan.scan_module} ${scan.arguments || ''}`;

        console.log(`🔍 Executing scan: ${cmd}`);

        const result = await axiomService.executeCommandForController(controller, cmd);

        if (result.success) {
            await db.query(`
                UPDATE axiom_scans 
                SET status = 'completed', progress = 100, completed_at = NOW()
                WHERE id = $1
            `, [scan.id]);

            console.log(`✅ Scan ${scan.id} completed`);
        } else {
            throw new Error(result.error);
        }
    } catch (err) {
        console.error(`❌ Scan ${scan.id} failed:`, err);
        await db.query(`
            UPDATE axiom_scans 
            SET status = 'failed', completed_at = NOW()
            WHERE id = $1
        `, [scan.id]);
    }
}
