'use strict';

const util = require('util');
const logger = require('../log/');
const Driver = require('../');
const driver = new Driver();
const req = require('./sample_request');

driver.execute(req, function(err, data){
  if(err) {
    logger.error("Test console received error = "  + util.inspect(err));
  } else {
    logger.info("Test console received message = "  + util.inspect(data));
  }
});