const winston = require('winston');
const path = require('path');
const constant = require('../meshConstants');

/**
 * logger based on winston, support local or console
 */
class WinstonWrapper {
    constructor() {
        this.logger = {
            'main': winston.createLogger({
                format: winston.format.combine(
                    winston.format.timestamp({format: () => {
                        return new Date(+new Date()+8*3600*1000).toISOString().replace(/T/g, ' ');
                      }}),
                    winston.format.prettyPrint(),
                    winston.format.printf(info =>
                        `[${info.level}] ${info.timestamp} : ${info.message}`
                    )
                ),
                transports: [
                    new winston.transports.File({
                        filename: path.resolve(process.cwd(), constant.LOG_OUTPUT_PATH['main']),
                    })
                ]
            }),
            'connection': winston.createLogger({
                format: winston.format.combine(
                    winston.format.timestamp({format: () => {
                        return new Date(+new Date()+8*3600*1000).toISOString().replace(/T/g, ' ');
                      }}),
                    winston.format.prettyPrint(),
                    winston.format.printf(info =>
                        `[${info.level}] ${info.timestamp} : ${info.message}`
                    )
                ),
                transports: [
                    new winston.transports.File({
                        filename: path.resolve(process.cwd(), constant.LOG_OUTPUT_PATH['connection']),
                    })
                ]
            }),
        }
    }

    getLoggerInstance() {
        return this.logger;
    }
}

let loggerInstance;

function getLoggerSingleton(mode) {
  if (!loggerInstance) {
    loggerInstance = new WinstonWrapper().getLoggerInstance();
  }
  if (['main', 'connection'].includes(mode)) {
    return loggerInstance[mode];
  } else {
    console.error('cannot find mesh logger');
  }
}

module.exports = getLoggerSingleton;

