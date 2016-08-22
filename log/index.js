'use strict';

var winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      json: false,
      timestamp: true
    }),
    new winston.transports.File({
      filename: __dirname + '/debug.log',
      json: false
    })
  ],
  exceptionHandlers: [
    new (winston.transports.Console)({
      json: false,
      timestamp: true
    }),
    new winston.transports.File({
      filename: __dirname + '/exceptions.log',
      json: false
    })
  ],
  exitOnError: false
});

module.exports = {
  error: logger.error,
  warn: logger.warn,
  info: logger.info,
  debug: logger.debug
};