'use strict';

const winston = require('winston');

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      json: false,
      timestamp: true,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({
      filename: `${__dirname}/debug.log`,
      json: false,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      json: false,
      timestamp: true,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    new winston.transports.File({
      filename: `${__dirname}/exceptions.log`,
      json: false,
    }),
  ],
  exitOnError: false,
});

module.exports = logger;
