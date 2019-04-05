'use strict';

module.exports = {
  casperSettings: {
    options: {
      stepTimeout: 30000,
      retryTimeout: 1,
      verbose: true,
      pageSettings: {
        loadImages: true,
        loadPlugins: false
      },
      clientScripts: [
        '../node_modules/socket.io-client/dist/socket.io.js'
      ]
    },
    debug: {
      captureCache: './out/captures'
    }
  },
  loopSleepTime: 1000,
  errors: {
    101: 'Uncaught exception',
    102: 'Runtime error in casper process',
    103: 'Timeout exception in casper process',
    104: 'JSON stringify exception',
    105: 'JSON parse exception',
    107: 'IllegalArgumentException'
  }
};
