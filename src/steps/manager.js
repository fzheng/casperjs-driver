'use strict';

function CasperManager(casperObj, config) {
  this.casper = casperObj;
  this.config = config;
  return this;
}

CasperManager.prototype.run = function (cb) {
  const _me = this;
  const self = this.casper;
  const { id } = self.custom.item;

  if (self.custom && self.custom.merchantName === 'macys') {
    self.thenEvaluate((keyword) => {
      $('input#globalSearchInputField').val(keyword); // eslint-disable-line no-undef
    }, id).thenClick('input#subnavSearchSubmit');
    self.waitForSelector('div#pdpAttributes', () => {
      _me.Done(cb);
    }, () => {
      self.customCache();
      self.die(`Unable to reach product detail page: ${self.getTitle()}`, 122);
    });
  }
  if (self.custom && self.custom.merchantName === 'bestbuy') {
    self.thenClick('a[data-lid="ubr_cp_lnb"]');
    self.waitForSelector('form[name="frmSearchResults"]', () => {
      _me.Done(cb);
    }, () => {
      self.customCache();
      self.die(`Unable to reach product detail page: ${self.getTitle()}`, 122);
    });
  }
};

CasperManager.prototype.Done = function (cb) {
  this.casper.customCache();
  cb();
};

module.exports = CasperManager;
