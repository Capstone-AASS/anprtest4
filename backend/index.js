// index.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const { createWorker } = require('./controller/worker'); // Adjust the path if necessary
const config = require('./config'); // Adjust the path if necessary

const WebSocketConnection = require('./controller/ws3'); // Ensure correct relative path

const port = 3000;

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Homepage
app.get('/', (req, res) => {
    res.send('WebSocket Server is Running');
});

// Initialize Mediasoup Worker and Router
let mediaSoupRouter;

// Initialize Mediasoup Worker and Router before setting up WebSockets
(async () => {
    try {
        console.log('Configuration loaded:', JSON.stringify(config, null, 2));

        const worker = await createWorker();
        console.log(`Mediasoup worker created with PID: ${worker.pid}`);

        mediaSoupRouter = await worker.createRouter({ mediaCodecs: config.mediasoup.router.mediaCodecs });
        console.log('Mediasoup router created');

        // Initialize Single WebSocket Server
        const wss = new WebSocket.Server({ noServer: true });

        // Handle Upgrade Requests
        server.on('upgrade', (request, socket, head) => {
            const { url } = request;

            if (url === '/ws' || url === '/ws/video') {
                wss.handleUpgrade(request, socket, head, (ws) => {
                    wss.emit('connection', ws, request);
                });
            } else {
                socket.destroy();
            }
        });

        // Integrate ws2.js WebSocket Connection Handler
        WebSocketConnection(wss, worker, mediaSoupRouter);

    } catch (error) {
        console.error('Error during Mediasoup initialization:', error);
        process.exit(1);
    }
})();

// Global Error Handlers
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start Server
server.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});

server.on('error', (error) => {
    console.error('HTTP server error:', error);
});