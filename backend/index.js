const express = require('express');
const http = require('http');
const Websocket = require('ws');
const WebSocketConnection = require('./controller/ws');

const port = 3000;


const app = express();
const server = http.createServer(app);
const websocket = new Websocket.Server({ server,path: '/ws' });

// app.get('/', (req, res) => {
// res.send('Hello World!');
// }
// );

WebSocketConnection(websocket);
server.listen(port, () => {
    console.log(`listening at http://localhost:${port}`);
    });
