'use strict';

function CasperManager(casperObj, config){
  this.casper = casperObj;
  return this;
}

CasperManager.prototype.run = function(){
  this.Done();
};

CasperManager.prototype.Done = function(){
  this.casper.echo("Step done");
};

module.exports = CasperManager;