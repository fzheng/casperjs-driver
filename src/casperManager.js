'use strict';

function CasperManager(casperObj, /* config */) {
  const self = this;

  self.casper = casperObj;

  self.run = function () {
    self.casper.customCache();
  };
}

module.exports = CasperManager;
