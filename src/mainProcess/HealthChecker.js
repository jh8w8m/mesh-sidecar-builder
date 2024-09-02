/**
 * healthChecker in main，receiving healthy status from child
 */

class HealthChecker {
    constructor() {
        /**
         * whether child is healthy (online)
         */
        this.meshHealthStatus = false;
        /**
         * whether sidecar is enabled in docker (whether support mesh)
         */
        this.meshEnable = false;
    }

    statusChange(state) {
       this.meshHealthStatus = state;
    }

    statusCheck() {
        return this.meshHealthStatus;
    }

    enableChange(state) {
        this.meshEnable = state;
    }

    enableCheck() {
        return this.meshEnable;
    }
}

let checkerInstance;

function getCheckerSingleton() {
    if (!checkerInstance) {
        checkerInstance = new HealthChecker();
    }
    return checkerInstance;
}

module.exports = getCheckerSingleton;
