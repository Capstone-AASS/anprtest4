const mediasoup = require('mediasoup');
const config = require('../config');

const createWebRtcTransport = async (mediaSoupRouter) => {
    const transport = await mediaSoupRouter.createWebRtcTransport({
        listenIps: [{ ip: '0.0.0.0', announcedIp: null }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
    });

    transport.on('dtlsstatechange', (dtlsState) => {
        if (dtlsState === 'closed') {
            console.log('Transport DTLS state closed');
            transport.close();
        }
    });

    transport.on('close', () => {
        console.log('Transport closed');
    });

    return transport;
};

module.exports = { createWebRtcTransport };