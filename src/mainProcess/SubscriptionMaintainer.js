const Mesh = require('../meshConstants');
const axiosInstance = require('axios').create();
const { RegisterAppCodeException, InsufficientRetryTimesException } = require('../exceptions');
const constant = require('../meshConstants');

/**
 * subscribe rules to online registry center
 * if a host is not included in rules, it will use http to request
 */
class SubscriptionMaintainer {
    constructor() {
        this.registerStatus = false;
        this.registeredApp = [];
        this.logger = require('./logger')('main');
    }

    getRegisterStatus() {
        return this.registerStatus;
    }

    getRegisteredApp() {
        return this.registeredApp;
    }

    addRegisteredApp(item) {
        this.registeredApp.push(item);
    }

    /**
     * upload rules
     */
    async flushRegisterSubscribeToServiceMesh() {
        if (this.registeredApp.length === 0) {
            this.logger.warn('no appcode in registeredApp');
        } else {
            let retryTimes = Mesh.SUBSCRIPTION_MAX_RETRY_TIMES;
            while (true) {
                retryTimes--;
                try {
                    await this.doRegister();
                    this.registerStatus = true;
                    this.logger.info('registry success, registered appcode and selector are:');
                    this.registeredApp.forEach((item) => {
                        this.logger.info(`${item.host} --> ${item.targetAppcode} & ${item.selector}`);
                    })
                    break;
                } catch (e) {
                    if (e instanceof RegisterAppCodeException) {
                        if (retryTimes <= 0) {
                            throw new InsufficientRetryTimesException('stop register since no retry');
                        }
                        this.logger.info('retry register in 100ms');
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } else {
                        this.logger.info(e.message);
                    }
                }
            }
        }
    }

    async doRegister() {
        try {
            const res = await this.registerTask();
            if (res.data.err_no === 1) {
                this.logger.error('registration failed')
                this.logger.error(res.data.err_msg);
                throw new RegisterAppCodeException('registration failed');
            } else {
                this.logger.info('registration success')
            }
        } catch (e) {
            throw new RegisterAppCodeException('registration failed');
        }
    }

    registerTask() {
        const requestParams = {subAppCodes: this.registeredApp.map(item => item.targetAppcode)};
        const option = {
            headers: {
                'Content-Type': 'application/json',
            },
        }
        return axiosInstance.post(constant.SUBSCRIBE_URL, JSON.stringify(requestParams), option);
    }
}

let maintainerInstance;

function getSubscriptionMaintainerSingleton() {
  if (!maintainerInstance) {
    maintainerInstance = new SubscriptionMaintainer();
  }
  return maintainerInstance;
}

module.exports = getSubscriptionMaintainerSingleton;
