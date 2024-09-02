/**
 * this file needed to be implemented by yourself if necessary
 * Generally, sidecar will work with an online config center (local config is also ok)
 * So that sidecar will load dynamic config from config center and change its local status directly
 */

function initConfigClient() {

}


// get meshEnable from online whitelist
// you can directly return true
function getSwitchFromWhitelist() {

}

module.exports = {
    initConfigClient,
    getSwitchFromWhitelist
};
