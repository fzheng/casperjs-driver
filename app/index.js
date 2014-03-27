'use strict';

var utils = require('utils');
var fs = require('fs');
var __ = require('../vendor/underscore');

/**
 * casperjs starts
 */
var casper = require("casper").create({
  onError: function(self, m){
    casper.echo('Casperjs onError: ' + m);
    casper.exit(113);
  },
  onStepTimeout: function(self, m){
    casper.echo('Casperjs Step timeout: ' + m);
    casper.exit(113);
  }
});

casper.on('http.status.404', function(resource){
  this.echo('Error 404: ' + resource.url);
});
casper.on('http.status.500', function(resource){
  this.echo('Error 500: ' + resource.url);
});
casper.on('page.error', function(msg, trace){
  this.echo("Page has errors: " + msg, "ERROR");
});
casper.on('remote.message', function(msg){
  this.echo('remote message caught: ' + msg);
});

casper.custom = {};
casper.custom.config = require('../config')["casperSettings"];
casper.options.stepTimeout = casper.custom.config.options.stepTimeout || 30000;
casper.options.retryTimeout = casper.custom.config.options.retryTimeout || 5;
casper.options.verbose = casper.custom.config.options.verbose;
casper.options.pageSettings = casper.custom.config.options.pageSettings || {loadImages: false, loadPlugins: false};
casper.options.clientScripts = casper.custom.config.options.clientScripts || [];

casper.customCache = function(){
  var path = casper.custom.config.debug.captureCache;
  if('undefined' === typeof(this.customSequence)){
    this.customSequence = 1;
  }
  var screenshotFileName = path + '/snapshots/step-' + (this.customSequence) + '-';
  screenshotFileName += (new Date()).toLocaleTimeString().replace(/[\/\s:]/g, '_') + '.png';
  this.capture(screenshotFileName);
  var htmlFileName = path + '/html/step-' + (this.customSequence++) + '.html';
  var html = this.getHTML();
  if(html && fs){
    fs.write(htmlFileName, html, 'w');
  }
};

casper.start().then(function(){
  var args = this.cli.args;
  if(!args || !args.length){
    utils.dump(args);
    this.die("invalid command line argument", 115);
  }
  try {
    this.custom = __.extend(this.custom, JSON.parse(args[0]));
  } catch(e) {
    this.die("JSON.parse error: " + utils.dump(args[0]), 105);
  }
});

casper.thenOpen(casper.custom.url, function() {
  this.echo(this.getTitle());
});

casper.then(function(){
  // ready for scraping, capture first snapshot
  this.customCache();
  var casperManager = new (require('./steps/index.js'))(this, {});
  casperManager.run();
});

// end of casperjs
casper.run(function(){
  this.echo('[DONE] Casperjs Scraping Process Complete').exit();
});