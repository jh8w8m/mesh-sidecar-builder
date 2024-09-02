/**
 * spawn child thread entry
 */
const { parentPort } = require('worker_threads');
let initMessageReceived = false;
let logger;

/**
 * same to child process. see "./indexProcess"
 */
parentPort.on('message', (msg) => {
  if (msg.type === 'init') {
    logger = require('./logger')();
    initMessageReceived = true;

    logger.info('****** child thread start ******');
    logger.info('child receive init, starting heartbeat');

    if (msg.interval && msg.interval < 1000) {
        logger.warn('Heartbeat interval is reset to 1000ms. It is not recommended to use a number lower than this');
        msg.interval = 1000;
    }

    require('./HeartBeatMaintainer')(
        msg.interval,
        msg.maxInterval,
        msg.increaseInterval,
        'thread',
    );
  }
});

const sendStartMessage = setInterval(() => {
  if (!initMessageReceived) {
    parentPort.postMessage({ type: 'start', });
  } else {
    clearInterval(sendStartMessage);
  }
}, 100);
