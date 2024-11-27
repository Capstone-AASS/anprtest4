const WebSocket = require('ws');
const { createWorker } = require('./worker');
const { createWebrtcTransport } = require('./createWebRtcTransport');

let mediaSoupRouter;
let producerTransport;
let producer;

const isJsonString = (str)=>{
    try {
        JSON.parse(str);
    } catch (error) {
        return false;
    }
    return true;
}

const handleGetRouterRtpCapabilities = async (ws, event) => {
   sendResponse(ws, 'routerRtpCapabilities', mediaSoupRouter.rtpCapabilities);
}

const onCreateProducerTransport = async (ws, event) => {
    try {
        const {transport, params } = await createWebrtcTransport(mediaSoupRouter);
        producerTransport = transport;
        sendResponse(ws, 'producerTransportCreated', params);

    } catch (error) {
        console.error('Error creating producer transport:', error);
        sendResponse(ws,"errror",error);
    }
}

const onConnectProducerTransport = async (ws, event) => {
    await producerTransport.connect({ dtlsParameters: event.dtlsParameters });
    send(ws,'producerConnected','producer connected');
}

const onProduce = async (event,ws,websocket) => {
    const {kind, rtpParameters} = event;
    producer = await producerTransport.produce({ kind, rtpParameters });
    sendResponse(ws,'producerCreated',{id:producer.id});
    broadcast(websocket,'newProducer','new user');
}

const sendResponse = (ws, type, data) => {
    ws.send(JSON.stringify({
        type,
        data,
    }));
}

const broadcast =(ws, type, msg) => {
    const message={
        type,
        dtata: msg
    }
    const resp = JSON.stringify(message);
    ws.clients.forEach((client)=>{
        client.send(resp);
    })
}

const WebSocketConnection = async (websocket) => {
    try {
        mediaSoupRouter = await createWorker();
    } catch (error) {
        throw error;
    }

    websocket.on('connection', (ws) => {
        ws.on('message', (message) => {
            const jsonValidation = isJsonString(message);
            if (!jsonValidation) {
                console.error('Invalid JSON');
                return;
            }
            const event = JSON.parse(message);
            switch (event.type) {
                case 'getRouterRtpCapabilities':
                    handleGetRouterRtpCapabilities(ws, event);
                    break;
                case 'createProducerTransport':
                    onCreateProducerTransport(ws, event);
                    break;
                case 'connectProducerTransport':
                    onConnectProducerTransport(ws, event);
                    break;
                case 'produce':
                    onProduce(event,ws);
                    break;
                default:
                    console.error('Invalid message');
                    break;
            }
        });
    });
}

module.exports = WebSocketConnection;