// index.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const WebSocketConnection = require('./controller/ws3');
const config = require('./config');

const port = 8000;
const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (if any)
app.use(express.static(path.join(__dirname, 'public')));

// Serve Homepage
app.get('/', (req, res) => {
    res.send('WebSocket Server is Running');
});

// Initialize WebSocket Server
const wss = new WebSocket.Server({ noServer: true });
WebSocketConnection(wss);

server.on('upgrade', (request, socket, head) => {
    const { url } = request;
    if (url.startsWith('/ws')) {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});