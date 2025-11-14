// backend/routes/terminal.js
// WebSocket SSH Terminal for Axiom Controllers

const WebSocket = require('ws');
const { Client } = require('ssh2');

let wss;

// Initialize WebSocket server
function initializeWebSocket(server, db) {
    wss = new WebSocket.Server({ 
        server,
        path: '/terminal'
    });

    console.log('✅ WebSocket terminal server initialized on /terminal');

    wss.on('connection', async (ws, req) => {
        console.log('🔌 Terminal client connected');

        let sshClient = null;
        let sshStream = null;

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);

                // Connect to SSH
                if (data.action === 'connect') {
                    const controllerId = data.controllerId || null;

                    // Get controller info from DB
                    let controller;
                    if (controllerId) {
                        const result = await db.query('SELECT * FROM axiom_controllers WHERE id = $1', [controllerId]);
                        controller = result.rows[0];
                    } else {
                        const result = await db.query('SELECT * FROM axiom_controllers WHERE is_active = true LIMIT 1');
                        controller = result.rows[0];
                    }

                    if (!controller) {
                        ws.send(JSON.stringify({ error: 'No controller found' }));
                        return;
                    }

                    // Create SSH connection
                    sshClient = new Client();

                    sshClient.on('ready', () => {
                        console.log('✅ SSH connection ready');
                        ws.send(JSON.stringify({ connected: true, controller: controller.name }));

                        sshClient.shell((err, stream) => {
                            if (err) {
                                ws.send(JSON.stringify({ error: err.message }));
                                return;
                            }

                            sshStream = stream;

                            // SSH output -> WebSocket
                            stream.on('data', (data) => {
                                ws.send(JSON.stringify({ output: data.toString('utf-8') }));
                            });

                            stream.stderr.on('data', (data) => {
                                ws.send(JSON.stringify({ output: data.toString('utf-8') }));
                            });

                            stream.on('close', () => {
                                console.log('🔌 SSH stream closed');
                                ws.send(JSON.stringify({ disconnected: true }));
                            });
                        });
                    });

                    sshClient.on('error', (err) => {
                        console.error('❌ SSH error:', err);
                        ws.send(JSON.stringify({ error: err.message }));
                    });

                    // Read SSH key
                    const fs = require('fs');
                    const privateKey = fs.readFileSync(controller.ssh_key_path);

                    sshClient.connect({
                        host: controller.host,
                        port: controller.ssh_port || 22,
                        username: controller.ssh_user || 'ubuntu',
                        privateKey: privateKey
                    });
                }

                // Send input to SSH
                if (data.action === 'input' && sshStream) {
                    sshStream.write(data.data);
                }

                // Resize terminal
                if (data.action === 'resize' && sshStream) {
                    sshStream.setWindow(data.rows, data.cols);
                }

            } catch (err) {
                console.error('❌ Terminal message error:', err);
                ws.send(JSON.stringify({ error: err.message }));
            }
        });

        ws.on('close', () => {
            console.log('🔌 Terminal client disconnected');
            if (sshStream) sshStream.end();
            if (sshClient) sshClient.end();
        });
    });

    return wss;
}

// Express router for REST endpoints
const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Get active terminal sessions
    router.get('/sessions', (req, res) => {
        const sessions = [];
        if (wss) {
            wss.clients.forEach((client, index) => {
                if (client.readyState === WebSocket.OPEN) {
                    sessions.push({ id: index, connected: true });
                }
            });
        }
        res.json({ success: true, sessions });
    });

    return { router, initializeWebSocket };
};
