'use strict';

function CasperManager(casperObj, config){
  'use strict';
  this.casper = casperObj;
  this.config = config;
  return this;
}

CasperManager.prototype.run = function(cb){
  'use strict';
  var _me = this;
  var self = this.casper;
  var id = self.custom.item.id;

  if (self.custom && self.custom.merchantName === "macys") {
    self.thenEvaluate(function(keyword){
      $('input#globalSearchInputField').val(keyword);
    }, id).thenClick('input#subnavSearchSubmit');
    self.waitForSelector('div#pdpAttributes', function then(){
      _me.Done(cb);
    }, function timeout(){
      self.customCache();
      self.die("Unable to reach product detail page: " + self.getTitle(), 122);
    });
  }
  if (self.custom && self.custom.merchantName === "bestbuy") {
    self.thenClick('a[data-lid="ubr_cp_lnb"]');
    self.waitForSelector('form[name="frmSearchResults"]', function then() {
      _me.Done(cb);
    }, function timeout() {
      self.customCache();
      self.die("Unable to reach product detail page: " + self.getTitle(), 122);
    })
  }
};

CasperManager.prototype.Done = function(cb){
  'use strict';
  this.casper.customCache();
  cb();
};

module.exports = CasperManager;