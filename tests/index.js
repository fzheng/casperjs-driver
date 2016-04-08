'use strict';

var CDriver = require('../');
var cDriver = new CDriver();
var logger = require('../log/');
var req = require('./config.js');
var util = require('util');

cDriver.run(req, function(err, data){
  if(err) {
    logger.error("Test console received error = "  + util.inspect(err));
  } else {
    logger.info("Test console received message = "  + util.inspect(data));
  }
});