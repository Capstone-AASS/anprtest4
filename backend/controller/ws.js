const WebSocket = require('ws');
const { createWorker } = require('./worker');
const { createWebrtcTransport } = require('./createWebRtcTransport');

let mediaSoupRouter;
let producerTransport;
let producer;
let consumerTransport;
let consumer;

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

const onCreateConsumerTransport = async (event,ws) => {
    try{
        const {transport, params} = await createWebrtcTransport(mediaSoupRouter);
        consumerTransport  = transport
        sendResponse(ws,'subTransportCreated',params);
    }
    catch(error){
        console.error('Error creating consumer transport:',error);
        sendResponse(ws,'error',error);
    }
}

const onConnectConsumerTransport = async (event,ws) => {
    await consumerTransport.connect({dtlsParameters: event.dtlsParameters});
    sendResponse(ws,'subTransportConnected','consumer transport connected');
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

const onResume = async (ws) => {
    await consumer.resume();
    sendResponse(ws,'resumed','resumed');
}

const onConsume = async (event,ws) => {
    const res = await createConsumer(producer,event.rtpCapabilities);
    sendResponse(ws,'subscribed',res);
}

const createConsumer = async (producer,rtpCapabilities)=>{
    if (!mediaSoupRouter.canConsume({
        producerId: producer.id,
        rtpCapabilities,
    })) {
        console.error('Can not consume');
        return;
    }

    try {
        consumer = await consumerTransport.consume({
            producerId: producer.id,
            rtpCapabilities,
            paused: producer.kind === 'video',
        });
    } catch (error) {
        console.error('consume failed! ', error);
        return;
    }
    return {
        producerId: producer.id,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
    }
}

const feeds = [
  { location: "Location 1", isOverspeeding: false, videoSrc: "video1.mp4" },
  { location: "Location 2", isOverspeeding: true, videoSrc: "video2.mp4" },
  // Add more feeds as needed
];

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
                case 'getFeeds':
                    sendResponse(ws, 'feeds', feeds);
                    break;
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
                case 'createConsumerTransport':
                    onCreateConsumerTransport(event,ws);
                    break;
                case 'connectConsumerTransport':
                    onConnectConsumerTransport(event,ws);
                    break;
                case 'resume':
                    onResume(ws);
                case 'consume':
                    onConsume(event,ws);
                    break;
                default:
                    console.error('Invalid message');
                    break;
            }
        });
    });
}

module.exports = WebSocketConnection;