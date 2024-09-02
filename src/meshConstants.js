/**
 * NOTICE THAT THIS FILE IS JUST AN EXAMPLE
 */
// sidecar local subscribe url
const SUBSCRIBE_URL = "http://127.0.0.1:50001/sub";

// sidecar local heartbeat url
const HEARTBEAT_URL = "http://127.0.0.1:50001/provider-heartbeat";

// sidecar local http endpoint, your request will be redirected through this url
// eg. http://www.google.com/test/123     -- sidecar -->    http://127.0.0.1:49527/test/123
const MESH_HTTP_ENDPOINT = "http://127.0.0.1:49527"; //

// test sidecar is installed
const MESH_ENABLE_TEST_URL = "http://127.0.0.1:60002/version";

// remote url to test if target appcode and selector is legal
const MESH_INBOUND_CHECK_URL = "http://my-service-mesh.com/is-inbound-enabled"

// mson header (REQUIRE)
const HTTP_HEADER_MSON_TARGET_APPCODE = "x-mosn-target-appcode";
const HTTP_HEADER_MSON_TARGET_SELECTOR = "x-mosn-target-selector";
const HTTP_HEADER_MSON_SOURCE = "x-mosn-source-appcode";
const HTTP_HEADER_MSON_REQUEST_TYPE = "x-mosn-request-type";
// mson header (ALTERNATIVE)
const HTTP_HEADER_MSON_TIMEOUT = "x-mosn-global-timeout";

const SUBSCRIPTION_MAX_RETRY_TIMES = 3;

// default heart beat timeout
const AXIOS_DEFAULT_TIMEOUT = 800;

// service local log path
// using pid to identify different process
const LOG_OUTPUT_PATH = {
    'main': `../logs/mesh_main_${process.pid}.log`,
    'child': `../logs/mesh_child_${process.pid}.log`,
    'connection': `../logs/mesh_connection_${process.pid}.log`,
}

module.exports = {
    SUBSCRIBE_URL,
    HEARTBEAT_URL,
    MESH_HTTP_ENDPOINT,
    MESH_ENABLE_TEST_URL,
    MESH_INBOUND_CHECK_URL,
    HTTP_HEADER_MSON_TARGET_APPCODE,
    HTTP_HEADER_MSON_TARGET_SELECTOR,
    HTTP_HEADER_MSON_TIMEOUT,
    HTTP_HEADER_MSON_SOURCE,
    HTTP_HEADER_MSON_REQUEST_TYPE,
    SUBSCRIPTION_MAX_RETRY_TIMES,
    AXIOS_DEFAULT_TIMEOUT,
    LOG_OUTPUT_PATH
}
