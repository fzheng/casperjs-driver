'use strict';

function CasperManager(casperObj, config) {
  var self = this;

  self.casper = casperObj;
  self.config = config;

  self.run = function (cb) {
    var id = self.casper.custom.item && self.casper.custom.item.id;

    if (self.casper.custom && self.casper.custom.merchantName === 'macys') {
      self.casper.thenEvaluate(function (keyword) {
        $('input#globalSearchInputField').val(keyword); // eslint-disable-line no-undef
      }, id).thenClick('input#subnavSearchSubmit');

      self.casper.waitForSelector('div#pdpAttributes', function () {
        self.Done(cb);
      }, function () {
        self.casper.customCache();
        self.casper.die('Unable to reach product detail page: ' + self.casper.getTitle(), 122);
      });
    } else if (self.casper.custom && self.casper.custom.merchantName === 'bestbuy') {
      self.casper.thenClick('a[data-lid="ubr_cp_lnb"]');
      self.casper.waitForSelector('form[name="frmSearchResults"]', function () {
        self.Done(cb);
      }, function () {
        self.casper.customCache();
        self.casper.die('Unable to reach product detail page: ' + self.casper.getTitle(), 122);
      });
    } else {
      self.casper.customCache();
    }
  };

  self.Done = function (cb) {
    self.casper.customCache();
    cb();
  };
}


module.exports = CasperManager;
