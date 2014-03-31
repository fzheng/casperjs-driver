'use strict';

module.exports = {
  "casperSettings": {
    "options": {
      "stepTimeout": 30000,
      "retryTimeout": 1,
      "verbose": true,
      "pageSettings": {
        "loadImages": true,
        "loadPlugins": false
      },
      "clientScripts": [
      ]
    },
    "debug": {
      "captureCache": "./out/captures"
    }
  },
  "loopSleepTime": 1000,
  "_errors": {
    "101": "Uncaught exception",
    "102": "Runtime error in casper process",
    "103": "Timeout exception in casper process",
    "104": "JSON stringify exception",
    "105": "JSON parse exception",
    "106": "",
    "107": "IllegalArgumentException",
    "108": "",
    "109": "",
    "110": "",
    "111": "",
    "112": "",
    "113": "",
    "114": "",
    "115": "",
    "116": "",
    "117": "",
    "118": "",
    "119": "",
    "120": ""
  }
};