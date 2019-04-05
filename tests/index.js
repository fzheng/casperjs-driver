'use strict';

const util = require('util');
const logger = require('../log/');
const Driver = require('../');

const driver = new Driver();
const req = require('./sample_request');

driver.execute(req, (err, data) => {
  if (err) {
    return logger.error(`Test console received error = ${util.inspect(err)}`);
  }
  return logger.info(`Test console received message = ${util.inspect(data)}`);
});
