'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _expressXmlBodyparser = require('express-xml-bodyparser');

var _expressXmlBodyparser2 = _interopRequireDefault(_expressXmlBodyparser);

var _middleware = require('./middleware');

var _fp = require('lodash/fp');

var _fp2 = _interopRequireDefault(_fp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultRoute = function defaultRoute(req, res) {
  res.status(200).end();
};

exports.default = function (opts) {
  var app = (0, _express2.default)();
  app.use(function saveRawBody(req, res, next) {
    req.rawBody = '';
    req.on('data', function (chunk) {
      req.rawBody += chunk;
    });
    next();
  });
  app.use(_bodyParser2.default.json({
    verify: function verify(req) {
      req.bodyType = 'json';
    }
  }));
  app.use(_bodyParser2.default.urlencoded({
    extended: false,
    verify: function verify(req) {
      req.bodyType = 'url';
    }
  }));
  app.use((0, _expressXmlBodyparser2.default)());
  app.use(function markBodyAsXml(req, res, next) {
    if (!_fp2.default.isEmpty(req.body) && !req.bodyType) {
      req.bodyType = 'xml';
    }
    next();
  });
  app.use(_bodyParser2.default.text({ verify: function verify(req) {
      req.bodyType = 'text';
    } }));
  app.use(_bodyParser2.default.raw({ type: function type() {
      return true;
    }, verify: function verify(req) {
      req.bodyType = 'raw';
    } }));
  app.use(function detectEmptyBody(req, res, next) {
    if (req.rawBody.length === 0) {
      req.bodyType = 'empty';
    }
    next();
  });
  app.use(_middleware.handleMiddlewareErrors);
  app.all('*', defaultRoute);
  app.use(_middleware.logRequest);
  return app;
};