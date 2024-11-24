const mediasoup = require('mediasoup');
const config = require('../config');

const worker = [
    {
        worker: mediasoup.types.Worker,
        router: mediasoup.types.Router,
    },
];

let nextMediasoupWorkerIdx = 0;

const createWorker = async () => {
    const worker = await mediasoup.createWorker({
        logLevel: config.mediasoup.worker.loglevel,
        logTags: config.mediasoup.worker.logtags,
        rtcMinPort: config.mediasoup.worker.rtcMinPort,
        rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    });
    worker.on('died', () => {
        console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
        setTimeout(() => process.exit(1), 2000);
    });
}

module.exports = {createWorker };