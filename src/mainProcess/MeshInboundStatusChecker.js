const axiosInstance = require('axios').create();
const constant = require('../meshConstants');

/**
 * check
 */
class MeshInboundStatusChecker {
    constructor() {
        this.subscribeAppSelectors = new Map();
        this.logger = require('./logger')('main');
    }

    getSubScribeAppSelectors() {
        return this.subscribeAppSelectors;
    }

    /**
     * check whether appcode and selector is legal, then add them to cache
     */
    async isInboundEnabled(targetAppcode, selector) {
        const baseUrl = constant.MESH_INBOUND_CHECK_URL;
        if (!baseUrl) {
            this.logger.info(`skip inbound, ${targetAppcode}`)
            this.subscribeAppSelectors.set({targetAppcode, selector}, false);
            return false;
        }
        try {
            const res = await this.checkAppcodeAndSelectorTask(baseUrl, targetAppcode, selector);
            const checkRes = res.data.data;
            this.logger.info(`inbound success, ${targetAppcode} & ${selector} & ${checkRes}`)
            this.subscribeAppSelectors.set({targetAppcode, selector}, checkRes);
            return checkRes;
        } catch(e) {
            this.logger.info(`inbound fail, ${targetAppcode} & ${selector}`);
            this.logger.info(e.message);
            this.subscribeAppSelectors.set({targetAppcode, selector}, false);
            return false;
        }
    }

    checkAppcodeAndSelectorTask(baseUrl, appcode, selector) {
        const url = `${baseUrl}?appCode=${appcode}&selector=${selector}`;
        return axiosInstance.get(url, {
            timeout: constant.AXIOS_DEFAULT_TIMEOUT,
        });
    }
}

let checkerInstance;

function getInboundCheckerSingleton() {
  if (!checkerInstance) {
    checkerInstance = new MeshInboundStatusChecker();
  }
  return checkerInstance;
}

module.exports = getInboundCheckerSingleton;
