const os = require('os');

const config = {
    listenIp: '0.0.0.0',
    listenPort: 3016,

    mediasoup:{
        numWorkers: Object.keys(os.cpus()).length,
        worker : {
            rtcMinPort: 10000,
            rtcMaxPort: 10100,
            loglevel: 'debug',
            logtags: [
                'info',
                'ice',
                'dtls',
                'rtp',
                'srtp',
                'rtcp',
            ],
        },
        router:{
            mediaCodecs:[
                {
                    kind: 'audio',
                    mimeType: 'audio/opus',
                    clockRate: 48000,
                    channels: 2,
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP8',
                    clockRate: 90000,
                    parameters: {
                        'x-google-start-bitrate': 1000,
                    },
                },
            ],
        },
        //webrtc transport settings
        webRtcTransport: {
            listenIps: [
                {
                    ip: '0.0.0.0',
                    announcedIp: '127.0.0.1', // replace by public ip address
                },
            ],
        },  
    }
}

module.exports = config;