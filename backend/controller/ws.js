const WebSocket = require('ws');
const { createWorker } = require('./worker');

let mediaSoupRouter;

const WebSocketConnection = async (websocket) => {
    try {
        mediaSoupRouter = await createWorker();
    } catch (error) {
        throw error;
    }

    websocket.on('connection', (ws) => {
        ws.on('message', (message) => {
            console.log(`Received message => ${message}`);
            ws.send('Hello! Message received!');
        });
    });
}

module.exports = WebSocketConnection;