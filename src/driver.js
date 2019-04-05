'use strict';

const util = require('util');
const path = require('path');
const { spawn } = require('child_process');
const io = require('socket.io').listen(29110, { log: false });

const config = require('../config');
const logger = require('../log/');

/**
 * Casper Driver
 * @constructor
 */
function CasperDriver() {
  const self = this;

  let reqQueue = [];
  let resQueue = [];

  let children = [];
  let childrenCount = 0;
  let childrenActive = 0;

  let socket;

  const respond = (code, message) => {
    const error = new Error();
    error.code = code || 101;
    error.message = '';
    if (config && config.errors) {
      error.message += config.errors[code];
    }
    if (message) {
      error.message += `-${util.inspect(message)}`;
    }
    logger.error(`[CasperDriver.respond] ${error.message}`);
    return error;
  };

  /**
   * Exit
   */
  const exit = () => {
    logger.info('server socket is about to close');
    if (socket) {
      socket.disconnect();
      socket = undefined;
    }
    process.exit();
  };

  /**
   * spawn children
   * @param childIndex {number} - index of casper child
   * @param cb {function} - callback function
   */
  const spawnChild = (childIndex, cb) => {
    logger.info(`Spawning child, sequence number: ${childIndex}`);

    if (childIndex < childrenCount - 1 && children[childIndex + 1] === undefined) {
      spawnChild(childIndex + 1, cb);
    }

    let reqStr;
    try {
      reqStr = JSON.stringify(reqQueue[childIndex]);
    } catch (e) {
      return cb(respond(104, reqQueue[childIndex]), null);
    }

    // spawn the child
    children[childIndex] = spawn('casperjs', [
      '--web-security=no',
      '--ignore-ssl-errors=yes',
      path.join(__dirname, './casper.client.js'),
      reqStr
    ]);

    // children[childIndex].stdout.setEncoding('utf8');

    // if we get any data from the child, simply output it
    children[childIndex].stdout.on('data', (data) => {
      logger.info(`Child [${childIndex}]: ${data}`);
    });

    // output any errors
    children[childIndex].stderr.on('data', (data) => {
      logger.error(`Child [${childIndex}] Error: ${data}`);
    });

    // if we detect the child has quit, we want ensure we have cleaned everything we need to up
    return children[childIndex].on('exit', (code) => {
      logger.info(`Child [${childIndex}] exits: ${code}`);
      childrenActive--;
      resQueue[childIndex] = {};
      if (code) {
        resQueue[childIndex].error = respond(code, '');
        resQueue[childIndex].data = null;
      } else {
        resQueue[childIndex].error = null;
        resQueue[childIndex].data = {
          timeStamp: Date.now()
        };
      }
      if (childrenActive === 0) {
        const error = new Error();
        error.message = [];
        const data = [];
        for (let t = 0; t < childrenCount; ++t) {
          if (resQueue[t].error) {
            error.code = resQueue[t].error.code || 101;
            error.message.push(resQueue[t].error);
          } else {
            data.push(resQueue[t].data);
          }
        }
        if (error.code) {
          cb(error, null);
        } else {
          cb(null, data);
        }
        exit();
      }
    });
  };

  /**
   * Tears down all spawned children processes
   * @param cb {function} - callback function
   */
  const tearDown = (cb) => {
    for (let i = 0; i < childrenCount; ++i) {
      if (children[i] !== undefined) {
        logger.info(`Kill child [${i}], pid = [${children[i].pid}]`);
        children[i].kill();
      }
    }
    cb(null, 'All processes have been cleaned up. now exit.');
  };

  /**
   * Run the driver
   * @param req {object} - request object
   * @param cb {function} - callback function
   */
  self.execute = (req, cb) => {
    if (!req || typeof (req) !== 'object') {
      logger.error('Invalid request object');
      return cb(respond(107, req), null);
    }
    let requestCount;
    if (req instanceof Array) {
      requestCount = req.length;
      if (!requestCount) {
        return cb(null, 'Nothing to do');
      }
      reqQueue = req;
    } else {
      requestCount = 1;
      reqQueue = [req];
    }
    children = new Array(requestCount);
    resQueue = new Array(requestCount);
    childrenCount = requestCount;
    childrenActive = requestCount;
    spawnChild(0, cb);

    // detect and report if parent exited
    process.on('exit', () => {
      logger.info('Parent process exiting');
      tearDown(cb);
    });

    // detect and report if parent was killed
    process.on('SIGTERM', () => {
      logger.info('Parent SIGTERM detected');
      exit();
    });

    let counter = childrenCount;
    return io.sockets.on('connection', (s) => {
      socket = s;
      socket.emit('from_node', {
        body: 'Hello from node',
        reply: true
      });
      socket.on('from_casper', (data) => {
        logger.info(`node driver.js received msg: ${JSON.stringify(data)}`);
        if (data.reply) {
          socket.emit('from_node', {
            body: 'Nice to meet you',
            reply: false
          });
        } else {
          logger.info('roger that');
        }
      });
      socket.on('disconnect', () => {
        logger.info(`socket in child process disconnected, ${--counter} left`);
        if (counter <= 0) {
          exit();
        }
      });
    });
  };
}

module.exports = CasperDriver;
