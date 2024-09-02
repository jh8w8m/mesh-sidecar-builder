const axiosInstance = require('axios').create();
const constant = require('../meshConstants');
const chokidar = require('chokidar');
const path = require('path');

/**
 * Heartbeat maintainer, including heartbeat task creation and interval timing sending
 */
class HeartBeatMaintainer {
    constructor(interval=1000, maxInterval=10000, increaseInterval=1000, execMode) {
        this.onlineTimes = 0;
        this.inputInterval = interval; // heartbeat interval
        this.interval = interval; // heartbeat interval, will be adjusted automatically according to the number of retries
        this.maxInterval = maxInterval; // maximum interval
        this.increaseInterval = increaseInterval; // maximum increasing interval

        this.heartBeatTimer = undefined;
        this.counter = 0;

        this.heartBeatStatus = false;
        this.warmupEnable = false;
        this.logger = require('./logger')();
        this.logger.info('starting')
        this.HealthChecker = require('./HealthChecker')(execMode);

        /**
         *  NOTICE:
         *  usually, there is file on machine to conditionally control the service status (healthcheck.html in this case)
         *  listen to this file can control the status of sidecar (online/offline)
         */
        this.watcher = chokidar.watch(path.resolve(process.cwd(), './healthcheck.html'), {
            ignored: /(^|[\/\\])\../,
            persistent: true
        });

        // listen to the file change event
        this.watcher.on('add', (path) => {
            this.logger.info(`detecting ${path} add in root directory, start heartbeat`);
            this.heartBeatStatus = true;
            this.onlineTimes++;
            if(this.onlineTimes === 1) { // first time work
                this.warmupEnable = true;
            }
            this.executeHeartBeatTaskOnce();
        });
        this.watcher.on('unlink', (path) => {
            this.logger.warn(`detecting ${path} unlink in root directory, start backoff heartbeat`);
            this.heartBeatStatus = false;
        });
    }

    /**
     * create a heartbeat task and execute it recursively by setTimeout
     */
    async executeHeartBeatTaskOnce() {
        try {
            const connectionStatus = await this.heartBeatTask();
            if (connectionStatus) { // normal heartbeat
                if (this.warmupEnable && this.heartBeatStatus) {
                    this.warmupEnable = false;
                }
                this.submitNormalTask();
                this.HealthChecker.change(this.heartBeatStatus);
            } else { // abnormal heartbeat
                if (this.heartBeatStatus) {
                    this.submitNormalTask();
                } else {
                    this.submitBackoffTask();
                }
                this.HealthChecker.change(false);
            }
        } catch(e) {
            this.logger.error(`uncaught heartbeat exception`);
            this.logger.error(e.message);
            if (this.heartBeatStatus) {
                this.submitNormalTask();
            } else {
                this.submitBackoffTask();
            }
            this.HealthChecker.change(false);
        }
    }

    getHeartBeatState() {
        return this.heartBeatStatus;
    }

    /**
     * start normal task with inputInterval
     */
    submitNormalTask() {
        if(this.interval !== this.inputInterval) {
            this.interval = this.inputInterval; // reset
        }
        clearTimeout(this.heartBeatTimer);
        this.logger.info(`next heartbeat start, interval is ${this.interval}ms`);
        this.heartBeatTimer = setTimeout(this.executeHeartBeatTaskOnce.bind(this), this.interval);
    }

    /**
     * start backoff task with increasing interval
     */
    submitBackoffTask() {
        const nextInterval = this.interval + this.increaseInterval;
        this.interval = (nextInterval>this.maxInterval)?this.maxInterval:nextInterval;
        clearTimeout(this.heartBeatTimer);
        this.logger.info(`next backoff heartbeat start，interval is ${this.interval}ms`);
        this.heartBeatTimer = setTimeout(this.executeHeartBeatTaskOnce.bind(this), this.interval);
    }

    async heartBeatTask() {
        const option = {
            headers: {
                'Content-Type': 'application/json',
            },
        }
        try {
            const res = await axiosInstance.post(constant.HEARTBEAT_URL, JSON.stringify(this.getRequestJson()), {
                ...option,
                timeout: constant.AXIOS_DEFAULT_TIMEOUT, // need timeout to prevent requests hanging
            });
            if (res.data.err_no === 0) {
                this.logger.info('heartbeat success');
                return true;
            } else {
                this.logger.error('heartbeat failed');
                this.logger.error(res.data.err_msg);
                return false;
            }
        }
        catch(e) {
            if (e.code === 'ECONNABORTED') {
                this.logger.error('heartbeat request timeout');
            } else if (e.response) {
                this.logger.error(`heartbeat status code is not 200, ${e.response.status}`);
            } else {
                this.logger.error('sidecar cannot be reached');
                this.logger.error(e.message);
            }
            return false;
        }
    }

    getRequestJson() {
        if (this.heartBeatStatus) {
            if (this.warmupEnable) {
                return {state: "1", warmup: true};
            }
            return {state: "1", warmup: false};
        }
        return {state: "0", warmup: false};
    }
}

module.exports = function (interval, maxInterval, increaseInterval, execMode) {
    return new HeartBeatMaintainer(interval, maxInterval, increaseInterval, execMode)
};
