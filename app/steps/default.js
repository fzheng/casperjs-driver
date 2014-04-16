'use strict';

function CasperManager(casperObj, config){
  'use strict';
  this.casper = casperObj;
  return this;
}

CasperManager.prototype.run = function(){
  'use strict';
  this.Done();
};

CasperManager.prototype.Done = function(){
  'use strict';
  this.casper.customCache();
};

module.exports = CasperManager;