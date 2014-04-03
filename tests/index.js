var CDriver = require('../');
var cDriver = new CDriver();
var logger = require('../log/logger');
var req = require('./test_request.js');
var util = require('util');

cDriver.run(req, function(err, data){
  if(err) logger.error("Test console received error = "  + util.inspect(err));
  else logger.info("Test console received message = "  + util.inspect(data));
});