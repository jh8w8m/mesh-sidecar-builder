/**
 * healthChecker in child，sending healthy status to parent
 */

class HealthChecker {
    constructor(execMode) {
        this.meshHealthStatus = undefined;
        this.execMode = execMode;

        // only send message when healthy status is changed, to make sure no unnecessary message
        this.change(false);
    }

    check() {
        return this.meshHealthStatus;
    }

    change(state) {
        // sending message when healthy status is changed
        if (state !== this.meshHealthStatus) {
            if (this.execMode === 'process') {
                process.send({
                    type: 'health',
                    meshHealthStatus: state,
                })
            }
            if (this.execMode === 'thread') {
                const { parentPort } = require('worker_threads');
                parentPort.postMessage({
                    type: 'health',
                    meshHealthStatus: state,
                })
            }

            this.meshHealthStatus = state;
        }
    }
}

let checkerInstance;

function getCheckerSingleton(execMode) {
    if (!checkerInstance) {
        checkerInstance = new HealthChecker(execMode);
    }
    return checkerInstance;
}

module.exports = getCheckerSingleton;
