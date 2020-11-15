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

var _logging = require('./logging');

var _logging2 = _interopRequireDefault(_logging);

var _fp = require('lodash/fp');

var _fp2 = _interopRequireDefault(_fp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (opts) {
  var router = _express2.default.Router();
  router.use(function saveRawBody(req, res, next) {
    req.rawBody = '';
    req.on('data', function (chunk) {
      req.rawBody += chunk;
    });
    next();
  });
  router.use(_bodyParser2.default.json({
    verify: function verify(req) {
      req.bodyType = 'json';
    }
  }));
  router.use(_bodyParser2.default.urlencoded({
    extended: true,
    verify: function verify(req) {
      req.bodyType = 'url';
    }
  }));
  router.use((0, _expressXmlBodyparser2.default)());
  router.use(function markBodyAsXml(req, res, next) {
    if (!req.bodyType && !_fp2.default.isEmpty(req.body)) {
      req.bodyType = 'xml';
    }
    next();
  });
  router.use(_bodyParser2.default.text({ verify: function verify(req) {
      req.bodyType = 'text';
    } }));
  router.use(_bodyParser2.default.raw({ type: function type() {
      return true;
    }, verify: function verify(req) {
      req.bodyType = 'raw';
    } }));
  router.use(function detectEmptyBody(req, res, next) {
    if (req.rawBody.length === 0) {
      req.bodyType = 'empty';
    }
    next();
  });
  router.use(function logInvalidRequest(err, req, res, next) {
    if (!req.bodyType) {
      req.bodyType = 'error';
    }
    (0, _logging2.default)(err, req, res, opts);
    res.status(400).end();
  });
  router.use(function logOkRequest(req, res, next) {
    res.on('finish', function () {
      (0, _logging2.default)(null, req, res, opts);
    });
    next();
  });
  return router;
};