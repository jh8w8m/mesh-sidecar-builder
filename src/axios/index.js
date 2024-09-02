let sourceAxios = require('axios');
const constant = require('../meshConstants');
const HealthChecker = require('../mainProcess/HealthChecker')();
const { getSwitchFromWhitelist } = require('../mainProcess/initConfig.js');
const SubscriptionMaintainer = require('../mainProcess/SubscriptionMaintainer')();
const { RequestNotReadyForServiceMeshException } = require('../exceptions');
const URL = require('url');
const logger = require('../mainProcess/logger')('connection');

/**
 * using axios request interceptor and response interceptor
 */
const requestHook = (config) => {
    const {
        HTTP_HEADER_MSON_TARGET_APPCODE,
        HTTP_HEADER_MSON_TARGET_SELECTOR,
        HTTP_HEADER_MSON_TIMEOUT,
        HTTP_HEADER_MSON_SOURCE,
        HTTP_HEADER_MSON_REQUEST_TYPE,
    } = constant;
    let {url, headers = {}, timeout} = config;

    if(!url.includes('127.0.0.1')) {
        /**
         * whether using service mesh
         * 1. local switch is on
         * 2. healthy status is 'OK'
         * 3. remote switch is on
         * 4. had registered?
         */
        try {
            if (HealthChecker.enableCheck()
                && HealthChecker.statusCheck()
                && getSwitchFromWhitelist()
                && SubscriptionMaintainer.getRegisterStatus()) {
                if (headers[HTTP_HEADER_MSON_TARGET_APPCODE]
                    || headers[HTTP_HEADER_MSON_TARGET_SELECTOR]
                    || headers[HTTP_HEADER_MSON_TIMEOUT])
                {
                    logger.warn(`founding headers: "${HTTP_HEADER_MSON_TARGET_APPCODE}" 
                    "${HTTP_HEADER_MSON_TARGET_SELECTOR}" "${HTTP_HEADER_MSON_TIMEOUT}", you should not use these keywords`);
                    throw new RequestNotReadyForServiceMeshException('mesh header is already exist, use http instead');
                } else {
                    const originTarget = URL.parse(url);
                    const searchRes = findMeshConfigFromListByHost(originTarget.host);

                    if (!searchRes) {
                        throw new RequestNotReadyForServiceMeshException('legal host not founding, use http instead');
                    }

                    config.headers[HTTP_HEADER_MSON_TARGET_APPCODE] = searchRes.targetAppcode;
                    config.headers[HTTP_HEADER_MSON_TARGET_SELECTOR] = searchRes.selector;
                    config.headers[HTTP_HEADER_MSON_SOURCE] = global.meshInputAppcode || 'unknownAppcode';
                    config.headers[HTTP_HEADER_MSON_REQUEST_TYPE] = 1;
                    config.headers[HTTP_HEADER_MSON_TIMEOUT] = timeout;

                    const {host, hostname, port} = URL.parse(constant.MESH_HTTP_ENDPOINT);
                    originTarget.host = host;
                    originTarget.hostname = hostname;
                    originTarget.port = port;

                    config.url = URL.format(originTarget);
                    logger.info(`new request to ${config.url} ，this request will be redirected`);
                }
            } else {
                throw new RequestNotReadyForServiceMeshException(`use http instead`);
            }
        } catch (e) {
            logger.info(e.message);
        }
    }

    return config;
}

const responseHook = (response) => {
    if(response.config.url.includes(constant.MESH_HTTP_ENDPOINT)) {
        logger.info(`response has been recorded，${response.config.url} --- ${response.status}`);
    }
}

const axiosResponseHookSuccessAdapter = response => {
  responseHook(response);
  return response
}

const axiosResponseHookFailAdapter = err => {
    if (err.response) {
        responseHook(err.response);
    } else if (err.code === 'ECONNABORTED' || err.message === 'timeout exceeded') {
        logger.info(`request timeout: ${err.config.url} --- ${err.config.timeout}`);
    }
    return Promise.reject(err);
}

/**
 * setting axios
 */
const axiosSetting = () => {
    sourceAxios.interceptors.request.use(requestHook);
    sourceAxios.interceptors.response.use(axiosResponseHookSuccessAdapter, axiosResponseHookFailAdapter);

    let _create = sourceAxios.create;

    sourceAxios.create = (createConfig = {}) => {
        let customCreate = _create(createConfig);
        customCreate.interceptors.request.use(requestHook);
        customCreate.interceptors.response.use(axiosResponseHookSuccessAdapter, axiosResponseHookFailAdapter);
        return customCreate;
    }
}
axiosSetting();

/**
 * replace axios source
 */
function setAxiosSource(axios) {
    sourceAxios = axios;
    axiosSetting();
}

/**
 * find target appcode & selector by input host
 */
const findMeshConfigFromListByHost = (host) => {
    const meshList = SubscriptionMaintainer.getRegisteredApp();
    return meshList.find((item) => item.host === host);
}

module.exports = {
    axios: sourceAxios,
    setAxiosSource
};
