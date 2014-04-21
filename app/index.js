'use strict';
var utils = require('utils');
var fs = require('fs');
var underscore = require('../vendor/underscore');
var machina = require('../vendor/machina')();
var _config = require('../config')["casperSettings"];

var baseFsm = new machina.Fsm({});
var turnoff = false;
var casperManager = {};
console.log(JSON.stringify(baseFsm));

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
  try {
    var data = JSON.parse(msg);
    casperManager = new (require('./steps/manager.js'))(casper, {});
    if(data && data.rlo && "function" === typeof(casperManager.run)){
      if(data.body === "do search"){
        turnoff = true;
        casperManager.run(function(){
          // do something if needed
        });
      }
    }
  } catch(e) {
    this.echo('Remote console log: ' + msg);
  }
});

casper.custom = {};
casper.custom.config = _config;
casper.options.stepTimeout = _config.options.stepTimeout || 30000;
casper.options.retryTimeout = _config.options.retryTimeout || 5;
casper.options.verbose = _config.options.verbose;
casper.options.pageSettings = _config.options.pageSettings || {loadImages: false, loadPlugins: false};

casper.customCache = function(){
  if(!this.custom.token) this.custom.token = new Date().getTime();
  if(!this.custom.config.debug.mode) return;
  var path = this.custom.config.debug.captureCache;
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

casper.dumpSteps = function dumpSteps(showSource){
  this.echo("=========================== Dump Navigation Steps ==============================", "RED_BAR");
  if(this.current){ this.echo("Current step No. = " + (this.current + 1), "INFO"); }
  this.echo("Next    step No. = " + (this.step + 1), "INFO");
  this.echo("steps.length = " + this.steps.length, "INFO");
  this.echo("================================================================================", "WARNING");
  for(var i = 0; i < this.steps.length; i++){
    var step = this.steps[i];
    var msg = "Step: " + (i + 1) + "/" + this.steps.length + "     level: " + step.level
    if(step.executed){ msg = msg + "     executed: " + step.executed }
    var color = "PARAMETER";
    if(step.label){
      color = "INFO";
      msg = msg + "     label: " + step.label
    }
    if(i == this.current){
      this.echo(msg + "     <====== Current Navigation Step.", "COMMENT");
    } else {
      this.echo(msg, color);
    }
    if(showSource){
      this.echo("--------------------------------------------------------------------------------");
      this.echo(this.steps[i]);
      this.echo("================================================================================", "WARNING");
    }
  }
};

/**
 * init setup
 */
casper.start(function(){
  this.custom.token = new Date().getTime();
}).then(function(){
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
    var _me = this;
    this.thenOpen(this.custom.url, function() {
      _me.customCache();
      _me.echo("web page title = " + _me.getTitle());
    });
  });

/**
 * socket.io client side setup
 */
casper.thenEvaluate(function(){
  if(!window._socket) window._socket = io.connect('http://localhost:29110');
  var socket = window._socket;
  socket.on('from_node', function(data){
    console.log(JSON.stringify(data));
    if(data.needReply){
      socket.emit('from_casper', {rlo: true, body: document.location.href, needReply: true});
    }
  });
});

/**
 * hangup, timeout 30 min
 */
casper.waitFor(function check() {
  return turnoff;
}, function then() {
  this.echo("move on to turn off");
}, function timeout() {
  this.echo("the casper process has been idle as long as 30 minutes, hang up now");
}, 1800000);

/**
 * clean up
 */
casper.run(function(){
  this.echo("elapsed time = " + (new Date().getTime() - this.custom.token) + " ms @ " + this.custom.url);
  this.exit();
});