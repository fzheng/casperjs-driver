"use strict";

var config = require('./config');

var casper = require('casper').create({
  verbose: true,
  logLevel: 'debug',
  pageSettings: {
    loadImages: false,         // The WebPage instance used by Casper will
    loadPlugins: false         // use these settings
  },
  clientScripts: [
    '../../vendor/jquery-2.1.0.min.js',
    '../../vendor/socket.io.min.js'
  ]
});

// print out all the messages in the headless browser context
casper.on('remote.message', function(msg){
  this.echo('remote message caught: ' + msg);
});

// print out all the messages in the headless browser context
casper.on("page.error", function(msg, trace){
  this.echo("Page Error: " + msg, "ERROR");
});

var url = 'http://www.facebook.com/';

casper.start(url, function(){
  this.startTime = new Date().getTime();
//  this.test.assertExists('form#login_form', 'form is found');
  this.fill('form#login_form', {
    email: config.email,
    pass: config.pwd
  }, true);
});

casper.thenEvaluate(function(){
  console.log("Page Title " + document.title);
  console.log("Your name is " + document.querySelector(".fbxWelcomeBoxName").innerHTML);
});

casper.run(function(){
  this.echo("elapsed time = " + (new Date().getTime() - this.startTime) + " ms");
  this.exit();
});