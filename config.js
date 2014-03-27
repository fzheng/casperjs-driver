'use strict';

module.exports = {
  "casperSettings" : {
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
  "loopSleepTime" : 1000,
  "_errors" : {
    "101" : "Unknown error occurred",
    "102" : "Request method not supported yet",
    "103" : "Invalid getData request",
    "104" : "Exception in fs.readFile",
    "105" : "Exception in JSON.parse",
    "106" : "Exception in JSON.stringify",
    "107" : "Missing request in run request",
    "108" : "Missing userId in request",
    "109" : "Missing type in request",
    "110" : "Missing merchant in run request",
    "111" : "Promo code or coupon you entered is invalid",
    "112" : "Element not exist in remote website",
    "113" : "Unknown error in Casperjs",
    "114" : "Step error in Casperjs",
    "115" : "Invalid command line arguments or options in Casperjs",
    "116" : "Unable to retrieve user and rlo data in Casperjs",
    "117" : "Timeout on page in Casperjs",
    "118" : "Unable to get merchant url to checkout in Casperjs",
    "119" : "Nothing to checkout",
    "120" : "Parent process exit"
  }
};