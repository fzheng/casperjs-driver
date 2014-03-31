var CDriver = require('../');
var cDriver = new CDriver();
var logger = require('../log/');
var req = require('./config.js');

cDriver.run(req, function(err, data){
  if(err) logger.error(err); else logger.info(data);
});