let sourceRequest = require('request');
const constant = require('../meshConstants');
const HealthChecker = require('../mainProcess/HealthChecker')();
const { getSwitchFromWhitelist } = require('../mainProcess/initConfig.js');
const SubscriptionMaintainer = require('../mainProcess/SubscriptionMaintainer')();
const { RequestNotReadyForServiceMeshException } = require('../exceptions');
const URL = require('url');
const logger = require('../mainProcess/logger')('connection');

/**
 * replace request module
 */
const setRequestSource = (request) => {
    sourceRequest = request;
}

const newRequest = () => {
    return sourceRequest.defaults(function(options, callback) {
        const {
            HTTP_HEADER_MSON_TARGET_APPCODE,
            HTTP_HEADER_MSON_TARGET_SELECTOR,
            HTTP_HEADER_MSON_TIMEOUT
        } = constant;
        options.headers = options.headers || {};

        /**
         * same as other request methods
         */
        try {
            if (HealthChecker.enableCheck()
                && HealthChecker.statusCheck()
                && getSwitchFromWhitelist()
                && SubscriptionMaintainer.getRegisterStatus()) {
                if (options.headers[HTTP_HEADER_MSON_TARGET_APPCODE]
                    || options.headers[HTTP_HEADER_MSON_TARGET_SELECTOR]
                    || options.headers[HTTP_HEADER_MSON_TIMEOUT])
                {
                    logger.warn(`founding headers: "${HTTP_HEADER_MSON_TARGET_APPCODE}" 
                    "${HTTP_HEADER_MSON_TARGET_SELECTOR}" "${HTTP_HEADER_MSON_TIMEOUT}", you should not use these keywords`);
                    throw new RequestNotReadyForServiceMeshException('mesh header is already exist, use http instead');
                } else {
                    const url = options.uri;
                    const originTarget = URL.parse(url);
                    const searchRes = findMeshConfigFromListByHost(originTarget.host);

                    if (!searchRes) {
                        throw new RequestNotReadyForServiceMeshException('legal host not founding, use http instead');
                    }

                    options.headers[HTTP_HEADER_MSON_TARGET_APPCODE] = searchRes.targetAppcode;
                    options.headers[HTTP_HEADER_MSON_TARGET_SELECTOR] = searchRes.selector;

                    const {host, hostname, port} = URL.parse(constant.MESH_HTTP_ENDPOINT);
                    originTarget.host = host;
                    originTarget.hostname = hostname;
                    originTarget.port = port;

                    const newUrl = URL.format(originTarget);
                    logger.info(`new request to ${newUrl} ，this request will be redirected`);
                    options.uri = newUrl;
                }
            } else {
                throw new RequestNotReadyForServiceMeshException('use http instead');
            }
        } catch (e) {
            logger.info(e.message);
        }

        const recordResponse = function (response) {
            if (response) {
                console.log(response);
                logger.info(`response has been recorded，${response.config.url} --- ${response.status}`);
            }
        }

        return sourceRequest(options, callback)
            .on('response', recordResponse);
    })
}

/**
 * find targetappcode & selector by input host
 */
const findMeshConfigFromListByHost = (host) => {
    const meshList = SubscriptionMaintainer.getRegisteredApp();
    return meshList.find((item) => item.host === host);
}

module.exports = {
    request: newRequest(),
    setRequestSource,
};
