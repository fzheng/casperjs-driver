'use strict';

var utils = require('utils');
var fs = require('fs');
var underscore = require('../vendor/underscore');
var _config = require('../config')["casperSettings"];

/**
 * casperjs starts
 */
var casper = require("casper").create({
  onError: function(self, m){
    casper.echo('Casperjs onError: ' + m);
    casper.exit(102);
  },
  onStepTimeout: function(self, m){
    casper.echo('Casperjs Step timeout: ' + m);
    casper.exit(103);
  },
  clientScripts: _config.options.clientScripts
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
  this.echo('Remote console log: ' + msg);
});

casper.custom = {};
casper.custom.config = _config;
casper.options.stepTimeout = _config.options.stepTimeout || 30000;
casper.options.retryTimeout = _config.options.retryTimeout || 5;
casper.options.verbose = _config.options.verbose;
casper.options.pageSettings = _config.options.pageSettings || {loadImages: false, loadPlugins: false};

casper.customCache = function(){
  if(!this.custom.token) this.custom.token = new Date().getTime();
  var path = casper.custom.config.debug.captureCache;
  if('undefined' === typeof(this.customSequence)){
    this.customSequence = 1;
  }
  var filename = this.custom.token + '-step-' + this.customSequence++ + '-' + (new Date()).toLocaleTimeString().replace(/[\/\s:]/g, '_');
  var screenshotFileName = path + '/snapshots/' + filename + '.png';
  this.capture(screenshotFileName);
  var htmlFileName = path + '/html/' + filename + '.html';
  var html = this.getHTML();
  if(html && fs){
    fs.write(htmlFileName, html, 'w');
  }
};

casper.start(function(){
  this.custom.token = new Date().getTime();
});

casper.then(function(){
  var args = this.cli.args;
  if(!args || !args.length){
    utils.dump(args);
    this.die("invalid command line argument", 107);
  }
  try {
    this.custom = underscore.extend(this.custom, JSON.parse(args[0]));
  } catch(e) {
    this.die("JSON.parse error: " + utils.dump(args[0]), 105);
  }
  this.thenOpen(this.custom.url);
});

casper.thenEvaluate(function(){
  if (!window._socket) window._socket = io.connect('http://localhost:29110');
  var socket = window._socket;
  socket.on('from_node', function(data){
    console.log("<<< webpage at [" + document.location.href + "] get the message from node = " + JSON.stringify(data));
    if(data.reply) {
      socket.emit('from_casper', {body: 'Hello node, this is casper at ' + document.location.href, reply: true});
    } else {
      console.log("roger that");
    }
  });
});

casper.then(function(){
  for(var i = 0; i <= 1; i++){
    this.wait(1000, (function(j){
      return function(){
        this.echo('Waiting ' + j);
      };
    })(i));
  }
});

casper.then(function(){
  // ready for scraping, capture first snapshot
  this.customCache();
  this.echo("web page title = " + this.getTitle());
  var casperManager = new (require('./steps/index.js'))(this, {});
  casperManager.run();
});

casper.thenEvaluate(function() {
  window._socket.emit('from_casper', {body: 'Bye node, this is casper at ' + document.location.href, reply: false});
});

casper.then(function(){
  for(var i = 0; i <= 1; i++){
    this.wait(1000, (function(j){
      return function(){
        this.echo('Waiting ' + j);
      };
    })(i));
  }
});

casper.run(function(){
  this.echo("elapsed time = " + (new Date().getTime() - this.custom.token) + " ms @ " + this.custom.url);
  this.exit();
});