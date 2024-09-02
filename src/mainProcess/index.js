/**
 * main process initialization
 * 1. test whether sidecar is on
 * 3. init remote config center (if it has)
 * 4. do register operations
 * 5. sending 'init' to child and start heart beat
 * 6. add listener to child's response to 'init'
 */
const path = require('path');
const fork = require('child_process').fork;
const HealthChecker = require('./HealthChecker')();
const axiosInstance = require('axios').create();
const constant = require('../meshConstants');
const {initConfigClient} = require('./initConfig');
const semver = require('semver');

let IsInit = false;
let logger;

const init = async (options) => {
    const {
        appcode,
        meshConfig,
        interval,
        maxInterval,
        increaseInterval,
        // node < 12 (only process) || node >= 12 (can use thread)
        execMode = 'none', // 'process' || 'thread' || 'none'
    } = options;
    logger = require('./logger')('main');
    logger.info('****** main process starting ******');

    checkRunningEnv();
    checkRequiredOptions(appcode, execMode);
    await testSidecarExistance();
    initConfigClient(appcode);
    await addRegisteredAppAndPushToMesh(meshConfig);

    global.meshInputAppcode = appcode;

    if (execMode === 'process') {
        logger.info('child start');
        const child = fork(path.resolve(__dirname, '../childProcess/indexProcess.js'));

        child.on('message', (msg) => {
            if (msg.type === 'health') {
                logger.info(`main process receive health status: ${msg.meshHealthStatus}`);
                HealthChecker.statusChange(msg.meshHealthStatus);
            }
            if (msg.type === 'start' && !IsInit) { // start heart beat only when receive 'init' response
                IsInit = true;
                logger.info('main process start');
                child.send({
                    type: 'init',
                    interval,
                    maxInterval,
                    increaseInterval,
                });
            }
        });

        child.on('exit', (code) => {
            logger.info(`child quit: ${code}`);
            HealthChecker.statusChange(false);
        })
    }
    if (execMode === 'thread') {
        logger.info('child start');
        if (semver.satisfies(process.version, '>=12.0.0')) {
            const { Worker } = require('worker_threads');
            const worker = new Worker(path.resolve(__dirname, '../childProcess/indexThread.js'));

            worker.on('message', (msg) => {
                if (msg.type === 'health') {
                    logger.info(`main process receive health status: ${msg.meshHealthStatus}`);
                    HealthChecker.statusChange(msg.meshHealthStatus);
                }
                if (msg.type === 'start' && !IsInit) {
                    IsInit = true;
                    logger.info('main process start');
                    worker.postMessage({
                        type: 'init',
                        interval,
                        maxInterval,
                        increaseInterval,
                    });
                }
            });

            worker.on('exit', (code) => {
                logger.info(`child quit: ${code}`);
                HealthChecker.statusChange(false);
            })
        } else {
            logger.error('your env is not satisfied with thread mode');
            throw new Error('your env is not satisfied with thread mode');
        }
    }
    if (execMode === 'none') {
        throw new Error('not supported');
    }
}

const checkRequiredOptions = (appcode, execMode) => {
    if (!appcode) {
        logger.error(`appcode is required`);
        throw new Error('appcode is required');
    }
    if (!['process', 'thread', 'none'].includes(execMode)) {
        logger.error(`execMode illegal`);
        throw new Error('execMode illegal');
    }
}

const checkRunningEnv = () => {
    if (!process.env.NODE_ENV) {
        console.log(`NODE_ENV is required`);
    }
    logger.info(`current env: ${process.env.NODE_ENV}`);
}


const testSidecarExistance = async () => {
    try {
        const res = await axiosInstance.get(constant.MESH_ENABLE_TEST_URL, {
            timeout: constant.AXIOS_DEFAULT_TIMEOUT,
        });
        HealthChecker.enableChange(true);
        logger.info('sidecar status is good');
    }
    catch(err) {
        HealthChecker.enableChange(false);
        logger.error('sidecar status is bad');
    }
}

/**
 * 1. check params in meshConfig 2. send data to remote register center
 * meshConfig pattern example:
 * [{host: 'www.test.com:3001', targetAppcode: 'test_mesh', selector: 'xxxx'}, ...]
 */
const addRegisteredAppAndPushToMesh = async (meshConfig = []) => {
    const RegisteredApp = require('./SubscriptionMaintainer')();
    const MeshInboundStatusChecker = require('./MeshInboundStatusChecker')();

    const promises = meshConfig.map(async (item) => {
        const res = await MeshInboundStatusChecker.isInboundEnabled(item.targetAppcode, item.selector);
        if (res){
            RegisteredApp.addRegisteredApp(item); // cache
        } else {
            logger.error(`Before register: ${item.targetAppcode} & ${item.selector} illegal`);
        }
    });

    try {
        await Promise.all(promises);
        await RegisteredApp.flushRegisterSubscribeToServiceMesh();
    } catch(e) {
        console.log('register appcode failed');
        logger.error(e.message);
    }
}

module.exports = init;
