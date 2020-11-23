"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = _interopRequireDefault(require("express"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _expressXmlBodyparser = _interopRequireDefault(require("express-xml-bodyparser"));

var _logging = _interopRequireDefault(require("./logging"));

var _fp = _interopRequireDefault(require("lodash/fp"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _default = function _default(opts) {
  var router = _express["default"].Router();

  router.use(function saveRawBody(req, res, next) {
    req.rawBody = '';
    req.on('data', function (chunk) {
      req.rawBody += chunk;
    });
    next();
  });
  router.use(_bodyParser["default"].json({
    verify: function verify(req) {
      req.bodyType = 'json';
    }
  }));
  router.use(_bodyParser["default"].urlencoded({
    extended: true,
    verify: function verify(req) {
      req.bodyType = 'url';
    }
  }));
  router.use((0, _expressXmlBodyparser["default"])());
  router.use(function markBodyAsXml(req, res, next) {
    if (!req.bodyType && !_fp["default"].isEmpty(req.body)) {
      req.bodyType = 'xml';
    }

    next();
  });
  router.use(_bodyParser["default"].text({
    verify: function verify(req) {
      req.bodyType = 'text';
    }
  }));
  router.use(_bodyParser["default"].raw({
    type: function type() {
      return true;
    },
    verify: function verify(req) {
      req.bodyType = 'raw';
    }
  }));
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

    (0, _logging["default"])(err, req, res, opts);
    res.status(400).end();
  });
  router.use(function logOkRequest(req, res, next) {
    res.on('finish', function () {
      (0, _logging["default"])(null, req, res, opts);
    });
    next();
  });
  return router;
};

exports["default"] = _default;