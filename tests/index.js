var CDriver = require('../');
var cDriver = new CDriver();
var logger = require('../log/');

var req = {
  url: "http://casperjs.org/"
};

cDriver.run(req, function(err, data) {
  if (err) logger.error(err);
  else logger.info(data);
});