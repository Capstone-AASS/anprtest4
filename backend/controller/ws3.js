// ws3.js
const WebSocket = require('ws');
const { createWebRtcTransport } = require('./createWebRtcTransport'); // Ensure correct path
const config = require('../config'); // Ensure correct path

const isJsonString = (str) => {
    try {
        JSON.parse(str);
    } catch (error) {
        return false;
    }
    return true;
};

// Function to send responses to a WebSocket client
const sendResponse = (ws, type, data) => {
    ws.send(JSON.stringify({
        type,
        data,
    }));
};

const WebSocketConnection = (wss, worker, router) => {
    wss.on('connection', (ws, req) => {
        const path = req.url;
        console.log(`WebSocket client connected to path: ${path}`);
        console.log('Client IP:', req.socket.remoteAddress);

        if (path === '/ws') {
            ws.on('message', async (message) => {
                console.log('Message from frontend:', message);
                if (!isJsonString(message)) {
                    sendResponse(ws, 'error', 'Invalid JSON format');
                    return;
                }

                const parsed = JSON.parse(message);
                const { type, data } = parsed;

                switch (type) {
                    case 'getRouterRtpCapabilities':
                        sendResponse(ws, 'routerRtpCapabilities', { routerRtpCapabilities: router.rtpCapabilities });
                        break;

                    case 'createProducerTransport':
                        try {
                            const transport = await createWebRtcTransport(router);
                            const params = {
                                id: transport.id,
                                iceParameters: transport.iceParameters,
                                iceCandidates: transport.iceCandidates,
                                dtlsParameters: transport.dtlsParameters,
                            };
                            sendResponse(ws, 'producerTransportCreated', params);
                        } catch (error) {
                            console.error('Error creating producer transport:', error);
                            sendResponse(ws, 'error', 'Failed to create producer transport');
                        }
                        break;

                    case 'createConsumerTransport':
                        try {
                            const transport = await createWebRtcTransport(router);
                            const params = {
                                id: transport.id,
                                iceParameters: transport.iceParameters,
                                iceCandidates: transport.iceCandidates,
                                dtlsParameters: transport.dtlsParameters,
                            };
                            sendResponse(ws, 'consumerTransportCreated', params);
                        } catch (error) {
                            console.error('Error creating consumer transport:', error);
                            sendResponse(ws, 'error', 'Failed to create consumer transport');
                        }
                        break;

                    case 'connectProducerTransport':
                        try {
                            const { transportId, dtlsParameters } = data;
                            const transport = router.getTransportById(transportId);
                            await transport.connect({ dtlsParameters });
                            sendResponse(ws, 'producerTransportConnected', null);
                        } catch (error) {
                            console.error('Error connecting producer transport:', error);
                            sendResponse(ws, 'error', 'Failed to connect producer transport');
                        }
                        break;

                    case 'connectConsumerTransport':
                        try {
                            const { transportId, dtlsParameters } = data;
                            const transport = router.getTransportById(transportId);
                            await transport.connect({ dtlsParameters });
                            sendResponse(ws, 'consumerTransportConnected', null);
                        } catch (error) {
                            console.error('Error connecting consumer transport:', error);
                            sendResponse(ws, 'error', 'Failed to connect consumer transport');
                        }
                        break;

                    case 'produce':
                        try {
                            const { transportId, kind, rtpParameters } = data;
                            const transport = router.getTransportById(transportId);
                            const producer = await transport.produce({ kind, rtpParameters });
                            sendResponse(ws, 'producerCreated', { id: producer.id });
                        } catch (error) {
                            console.error('Error producing:', error);
                            sendResponse(ws, 'error', 'Failed to produce');
                        }
                        break;

                    case 'consume':
                        try {
                            const { consumerTransportId, producerId, rtpCapabilities } = data;
                            if (!router.canConsume({ producerId, rtpCapabilities })) {
                                sendResponse(ws, 'error', 'Cannot consume');
                                return;
                            }
                            const consumer = await router.consume({
                                producerId,
                                rtpCapabilities,
                                paused: false,
                            });
                            sendResponse(ws, 'consumerSubscribed', {
                                id: consumer.id,
                                producerId: consumer.producerId,
                                kind: consumer.kind,
                                rtpParameters: consumer.rtpParameters,
                            });
                        } catch (error) {
                            console.error('Error consuming:', error);
                            sendResponse(ws, 'error', 'Failed to consume');
                        }
                        break;

                    case 'videoData':
                        try {
                            const { feedId, frame } = data;

                            // If a producer for this feedId doesn't exist, create one
                            if (!global.producers) global.producers = {};

                            if (!global.producers[feedId]) {
                                const transport = await createWebRtcTransport(router);
                                const params = {
                                    id: transport.id,
                                    iceParameters: transport.iceParameters,
                                    iceCandidates: transport.iceCandidates,
                                    dtlsParameters: transport.dtlsParameters,
                                };
                                // Store the producer transport
                                global.producers[feedId] = { transport, producer: null };
                                sendResponse(ws, `producerTransportCreated_${feedId}`, params);
                            }

                            const { transport, producer } = global.producers[feedId];

                            if (!producer) {
                                // If producer hasn't been created yet, send a message to frontend to create and connect it
                                // Alternatively, handle producer creation here if possible
                                sendResponse(ws, 'error', 'Producer not initialized yet.');
                                return;
                            }

                            // Decode the frame data
                            const buffer = Buffer.from(frame, 'base64');
                            // Here you would typically handle the frame data, e.g., save it or process it.
                            // Mediasoup doesn't handle raw frame data directly. Instead, producers should send MediaStreamTracks.

                            // This part depends on how you intend to integrate feed.py with Mediasoup.
                            // One approach is to have feed.py act as a separate client that produces media streams.
                            // Alternatively, you might need to process the frames and inject them into Mediasoup streams.

                        } catch (error) {
                            console.error('Error handling videoData:', error);
                            sendResponse(ws, 'error', 'Failed to handle videoData');
                        }
                        break;

                    default:
                        sendResponse(ws, 'error', 'Unknown message type');
                }
            });

            ws.on('close', () => {
                console.log('Client disconnected');
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        } else {
            console.error(`Invalid WebSocket path: ${path}`);
            ws.close(1008, 'Invalid WebSocket path');
        }
    });
};

module.exports = WebSocketConnection;