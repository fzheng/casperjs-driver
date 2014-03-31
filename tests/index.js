var CDriver = require('../');
var cDriver = new CDriver();
var logger = require('../log/');

var req = [{
  url: "http://www.macys.com"
}, {
  url: "http://www.bestbuy.com"
}, {
  url: "http://www.target.com"
}];

cDriver.run(req, function(err, data){
  if(err) logger.error(err); else logger.info(data);
});