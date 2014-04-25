'use strict';

var config = require('../config');
var logger = require('../log/logger');
var util = require('util');
var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;
var io = require('socket.io').listen(29110, {log: false});

/**
 * construct respond object
 * @param {Integer} code
 * @param {string=} message
 * @returns {Error}
 * @private
 */
var _respond = function(code, message){
  'use strict';
  var error = new Error();
  error.code = code || 101;
  error.message = "";
  if(config && config._errors && (config._errors).hasOwnProperty(code)) error.message += config._errors[code];
  if(message) error.message += "-" + util.inspect(message);
  logger.error('[CasperDriver.respond] ' + error.message);
  return error;
};

/**
 * Object to drive casperjs
 * @returns {CasperDriver}
 * @constructor
 */
function CasperDriver(){
  'use strict';
  logger.info("CasperDriver initialized");
  this.config = config || {};
  return this;
}

/**
 * CasperDriver run
 * @param {Object} req
 * @param cb
 * @returns {*=}
 */
CasperDriver.prototype.run = function(req, cb){
  'use strict';
  if(!req || "object" !== typeof(req)){
    logger.error('Invalid request object');
    return cb(_respond(107, req), null);
  }
  var N;
  if(req instanceof Array){
    N = req.length;
    if(!N) return cb(null, 'Nothing to do');
    this.reqArray = req;
  } else {
    N = 1;
    this.reqArray = [req];
  }
  this.children = new Array(N);
  this.response = new Array(N);
  this.TOTALCHILDREN = N;
  this.REMAINING = N;
  this.spawn_child(0, cb);

  var _me = this;

  /**
   * detect and report if parent exited
   **/
  process.on("exit", function(){
    logger.info("Parent process exiting");
    _me.teardown(cb);
  });

  /**
   * detect and report if parent was killed
   **/
  process.on("SIGTERM", function(){
    logger.info("Parent SIGTERM detected");
    _me.exit();
  });

  var counter = _me.TOTALCHILDREN;
  io.sockets.on('connection', function(socket){
    _me.socket = socket;
    socket.emit('from_node', {rlo: true, body: "Hello from node", needReply: true});
    socket.on('from_casper', function(data){
      logger.info(">>> node driver.js received msg: " + JSON.stringify(data));
      if(data.needReply){
        if(data.body && data.body.indexOf('macys.com') >= 0){
          socket.emit('from_node', {rlo: true, body: 'do search', needReply: false});
        }
        if(data.body && data.body.indexOf('bestbuy.com') >= 0) {
          setTimeout(function() {
            socket.emit('from_node', {rlo: true, body: 'do search', needReply: false});
          }, 10000);
        }
      } else {
        logger.info('roger that');
      }
    });
    socket.on('disconnect', function(){
      logger.info("socket in child process disconnected, " + --counter + " left");
      if(counter <= 0){
//        _me.exit();
      }
    });
  });
};

/**
 * CasperDriver to spawn children
 * @param {Integer} i
 * @param cb
 */
CasperDriver.prototype.spawn_child = function(i, cb){
  'use strict';
  logger.info('Spawning child, sequence number: ' + i);
  /**
   * spawn every child
   */
  if(i < this.TOTALCHILDREN - 1 && this.children[i + 1] === undefined) this.spawn_child(i + 1, cb);
  try {
    var reqStr = JSON.stringify(this.reqArray[i]);
  } catch(e) {
    return cb(_respond(104, this.reqArray[i]), null);
  }
  /**
   * spawn the child
   */
  this.children[i] = spawn('casperjs', ["--web-security=no", "--ignore-ssl-errors=yes", path.join(__dirname, '../app/index.js'), reqStr]);
  this.children[i].stdout.setEncoding('utf8');

  /**
   * if we get any data from the child, simply output it
   */
  this.children[i].stdout.on('data', function(data){
    logger.info('Child [' + i + ']: ' + data);
  });

  /**
   * output any errors
   */
  this.children[i].stderr.on('data', function(data){
    logger.error('Child [' + i + '] Error: ' + data);
  });

  var _me = this;
  /**
   * if we detect the child has quit, we want ensure we have cleaned everything we need to up
   */
  this.children[i].on('exit', function(code){
    logger.info('Child [' + i + '] exits: ' + code);
    _me.REMAINING--;
    _me.response[i] = {};
    if(code){
      _me.response[i].error = _respond(code, '');
      _me.response[i].data = null;
    } else {
      _me.response[i].error = null;
      _me.response[i].data = {
        timeStamp: Date.now()
      };
    }
    if(!_me.REMAINING){
      var error = new Error();
      error.message = [];
      var data = [];
      for(var t = 0; t < _me.TOTALCHILDREN; ++t){
        if(_me.response[t].error){
          error.code = _me.response[t].error.code || 101;
          error.message.push(_me.response[t].error);
        } else {
          data.push(_me.response[t].data);
        }
      }
      if(error.code){
        return cb(error, null);
      } else {
        return cb(null, data);
      }
    }
  });
};

/**
 * CasperDriver teardown the whole process
 * @param cb
 * @returns {*}
 */
CasperDriver.prototype.teardown = function(cb){
  'use strict';
  /**
   * kill all children!
   */
  for(var i = 0; i < this.TOTALCHILDREN; ++i){
    if(this.children[i] !== undefined){
      logger.info("Kill child [" + i + "], pid = [" + this.children[i].pid + "]");
      this.children[i].kill();
    }
  }
  return cb(null, "All processes have been cleaned up. now exit.");
};

/**
 * exit
 */
CasperDriver.prototype.exit = function(){
  'use strict';
  var _me = this;
  setTimeout(function(){
    logger.info("server socket is about to close");
    if(_me.socket){
      _me.socket.disconnect();
      delete _me.socket;
    }
    process.exit();
  }, 100);
};

/**
 * Module Exports
 * @type {CasperDriver}
 */
module.exports = CasperDriver;