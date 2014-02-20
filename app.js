/**
 shop/bed-bath/bed-in-a-bag?id=26795&edge=hybrid&cm_sp=us_hdr-_-homepage-_-26795_Comforter-Sets
 */

var express = require('express');
var app = express();
var http = require('http');
var httpProxy = require('http-proxy');

app.configure(function(){
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
});

var proxyOptions = {
  router: {
    "www.macys.com" : "localhost:3000"
  }
};

var proxy = new httpProxy.createProxyServer(proxyOptions);

app.all('*', function(req, res) {
  proxy.web(req, res, {
    target: 'http://www.macys.com' + req.path
  });
});

app.listen(3000);