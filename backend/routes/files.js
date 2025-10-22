// backend/routes/files.js
// File Upload/Download with axiom-scp

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: '/tmp/axiom-uploads/',
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

module.exports = (db) => {
    const axiomService = require('../services/axiomService');

    // Upload file to fleet
    router.post('/upload', upload.single('file'), async (req, res) => {
        try {
            const { fleet, split, destination } = req.body;
            const file = req.file;

            if (!file || !fleet) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'File and fleet target required' 
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

            // Save file metadata to DB
            const fileRecord = await db.query(`
                INSERT INTO axiom_files 
                (controller_id, original_name, stored_name, fleet_target, is_split, file_size, upload_status)
                VALUES ($1, $2, $3, $4, $5, $6, 'uploading')
                RETURNING *
            `, [controller.id, file.originalname, file.filename, fleet, split === 'true', file.size]);

            const fileId = fileRecord.rows[0].id;

            // Build axiom-scp command
            const dest = destination || `/tmp/${file.originalname}`;
            const splitFlag = split === 'true' ? '--split' : '';
            const cmd = `axiom-scp ${file.path} '${fleet}*':${dest} ${splitFlag}`;

            console.log(`📤 Uploading file: ${cmd}`);

            // Execute upload
            const result = await axiomService.executeCommandForController(controller, cmd);

            if (result.success) {
                await db.query(`
                    UPDATE axiom_files 
                    SET upload_status = 'completed'
                    WHERE id = $1
                `, [fileId]);

                res.json({ success: true, file: fileRecord.rows[0], output: result.output });
            } else {
                await db.query(`
                    UPDATE axiom_files 
                    SET upload_status = 'failed'
                    WHERE id = $1
                `, [fileId]);

                res.status(500).json({ success: false, error: result.error });
            }

        } catch (err) {
            console.error('❌ File upload failed:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // List uploaded files
    router.get('/', async (req, res) => {
        try {
            const result = await db.query(`
                SELECT f.*, c.name as controller_name
                FROM axiom_files f
                LEFT JOIN axiom_controllers c ON f.controller_id = c.id
                ORDER BY f.created_at DESC
            `);
            res.json({ success: true, files: result.rows });
        } catch (err) {
            console.error('❌ Failed to list files:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    return router;
};
