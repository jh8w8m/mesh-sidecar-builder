/**
 * fork child process entry
 */
let initMessageReceived = false;
let logger;

/**
 * Child process listens for messages sent by the main process.
 * Upon receiving the "init" command, it starts execution and stops sending start messages.
 * The msg carries the parameters for starting the child process.
 */
process.on('message', (msg) => {
  if (msg.type === 'init') {
    logger = require('./logger')();
    initMessageReceived = true;

    logger.info('****** child process start ******');
    logger.info('child receive init, starting heartbeat');

    if (msg.interval && msg.interval < 1000) {
        logger.warn('Heartbeat interval is reset to 1000ms. It is not recommended to use a number lower than this');
        msg.interval = 1000;
    }

    require('./HeartBeatMaintainer')(
        msg.interval,
        msg.maxInterval,
        msg.increaseInterval,
        'process',
    );
  }
});

/**
 * Child process continuously sends start messages until main process responds.
 * Main process may lose the signal, so the operation needs to continue until respond received.
 */
const sendStartMessage = setInterval(() => {
  if (!initMessageReceived) {
    process.send({
      type: 'start',
    });
  } else {
    clearInterval(sendStartMessage);
  }
}, 100);
