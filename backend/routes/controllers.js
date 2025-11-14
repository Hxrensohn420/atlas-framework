// backend/routes/controllers.js
// Multi-controller management API

const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // List all controllers
    router.get('/', async (req, res) => {
        try {
            const result = await db.query(`
                SELECT * FROM axiom_controllers 
                ORDER BY is_active DESC, created_at DESC
            `);
            res.json({ success: true, controllers: result.rows });
        } catch (err) {
            console.error('❌ Failed to list controllers:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Get active controller
    router.get('/active', async (req, res) => {
        try {
            const result = await db.query(`
                SELECT * FROM axiom_controllers 
                WHERE is_active = true 
                LIMIT 1
            `);
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'No active controller' });
            }
            res.json({ success: true, controller: result.rows[0] });
        } catch (err) {
            console.error('❌ Failed to get active controller:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Add new controller
    router.post('/', async (req, res) => {
        try {
            const { name, host, ssh_user, ssh_port, ssh_key_path, provider, region } = req.body;

            if (!name || !host) {
                return res.status(400).json({ success: false, error: 'Name and host required' });
            }

            const result = await db.query(`
                INSERT INTO axiom_controllers 
                (name, host, ssh_user, ssh_port, ssh_key_path, provider, region, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
                RETURNING *
            `, [name, host, ssh_user || 'ubuntu', ssh_port || 22, 
                ssh_key_path || '/app/keys/axiom_controller_key', 
                provider || 'gcp', region]);

            res.json({ success: true, controller: result.rows[0] });
        } catch (err) {
            console.error('❌ Failed to add controller:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Activate controller (deactivates all others)
    router.post('/:id/activate', async (req, res) => {
        try {
            const { id } = req.params;

            await db.query('BEGIN');
            await db.query('UPDATE axiom_controllers SET is_active = false');
            const result = await db.query(`
                UPDATE axiom_controllers 
                SET is_active = true, updated_at = NOW()
                WHERE id = $1
                RETURNING *
            `, [id]);
            await db.query('COMMIT');

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Controller not found' });
            }

            res.json({ success: true, controller: result.rows[0] });
        } catch (err) {
            await db.query('ROLLBACK');
            console.error('❌ Failed to activate controller:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Health check for controller
    router.post('/:id/health', async (req, res) => {
        try {
            const { id } = req.params;
            const axiomService = require('../services/axiomService');

            const controller = await db.query('SELECT * FROM axiom_controllers WHERE id = $1', [id]);
            if (controller.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Controller not found' });
            }

            // Try to execute axiom-ls
            const health = await axiomService.executeCommandForController(controller.rows[0], 'axiom-ls');
            const isHealthy = health.success;

            await db.query(`
                UPDATE axiom_controllers 
                SET status = $1, last_health_check = NOW()
                WHERE id = $2
            `, [isHealthy ? 'active' : 'error', id]);

            res.json({ success: true, healthy: isHealthy, output: health.output });
        } catch (err) {
            console.error('❌ Health check failed:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Delete controller
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await db.query('DELETE FROM axiom_controllers WHERE id = $1 RETURNING *', [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Controller not found' });
            }

            res.json({ success: true, deleted: result.rows[0] });
        } catch (err) {
            console.error('❌ Failed to delete controller:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    return router;
};
