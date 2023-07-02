"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = _interopRequireDefault(require("express"));
var _bodyParser = _interopRequireDefault(require("body-parser"));
var _expressXmlBodyparser = _interopRequireDefault(require("express-xml-bodyparser"));
var _logging = require("./logging");
var _expressHttpProxy = _interopRequireDefault(require("express-http-proxy"));
var _fp = _interopRequireDefault(require("lodash/fp"));
var _cors = _interopRequireDefault(require("cors"));
var _es6Promise = require("es6-promise");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
/**
 * @param {CLSOptions} opts
 */
var _default = function _default(opts) {
  var cnsl = opts.console;
  var router = _express["default"].Router();
  var reqCounter = 0;
  router.use(function addLocals( /** @type {RequestExt} */req, res, next) {
    req.locals || (req.locals = {});
    var requestId = req.header('X-Request-ID') || req.header('X-Correlation-ID');
    req.locals.id = "".concat(++reqCounter) + (requestId ? ":".concat(requestId) : '');
    next();
  });
  if (opts.mockDate) {
    // For some reason Date cannot be mocked in Node 15/16, so just override the date header when using static date
    router.use(function mockDate( /** @type {RequestExt} */req, res, next) {
      res.set('date', new Date().toUTCString());
      next();
    });
  }
  router.use(function saveRawBody( /** @type {RequestExt} */req, res, next) {
    req.locals.rawBody = new _es6Promise.Promise(function (resolve) {
      req.once('end', function () {
        resolve(req.locals.rawBodyBuffer);
      });
    });
    req.on('data', function (chunk) {
      if (req.locals.rawBodyBuffer === undefined) {
        req.locals.rawBodyBuffer = '';
      }
      req.locals.rawBodyBuffer += chunk;
    });
    next();
  });
  router.use(_bodyParser["default"].json({
    verify: function verify( /** @type {RequestExt} */req) {
      req.locals.bodyType = 'json';
    }
  }));
  router.use(_bodyParser["default"].urlencoded({
    extended: true,
    verify: function verify( /** @type {RequestExt} */req) {
      req.locals.bodyType = 'url';
    }
  }));
  router.use((0, _expressXmlBodyparser["default"])());
  router.use(function markBodyAsXml( /** @type {RequestExt} */req, res, next) {
    if (!req.locals.bodyType && !_fp["default"].isEmpty(req.body)) {
      req.locals.bodyType = 'xml';
    }
    next();
  });
  router.use(_bodyParser["default"].text({
    verify: function verify( /** @type {RequestExt} */req) {
      req.locals.bodyType = 'text';
    }
  }));
  router.use(_bodyParser["default"].raw({
    limit: opts.rawBodyLimit === undefined ? '5Mb' : opts.rawBodyLimit,
    type: function type() {
      return true;
    },
    verify: function verify( /** @type {RequestExt} */req) {
      req.locals.bodyType = 'raw';
    }
  }));
  router.use(function handleInvalidRequest(err, /** @type {RequestExt} */req, /** @type {ResponseExt} */res, next) {
    var _req$locals$rawBodyBu;
    if (((_req$locals$rawBodyBu = req.locals.rawBodyBuffer) === null || _req$locals$rawBodyBu === void 0 ? void 0 : _req$locals$rawBodyBu.length) > 0 && _fp["default"].isEmpty(req.body) && (req.locals.bodyType !== 'json' || req.locals.rawBodyBuffer.replace(/\s/g, '') !== '{}')) {
      req.locals.bodyType = 'error';
    }
    req.locals.bodyError = err;
    res.locals.responseCode = 400;
    next();
  });
  router.use(function logRequestAndResponse( /** @type {RequestExt} */req, res, next) {
    req.locals.rawBody["finally"](function () {
      if (req.locals.rawBodyBuffer === undefined || req.locals.rawBodyBuffer.length === 0) {
        req.locals.bodyType || (req.locals.bodyType = 'empty');
      }
      (0, _logging.logRequest)(req, res, opts);
    });
    res.on('finish', function () {
      var _req$locals, _req$locals2;
      if (opts.logResponse !== true && !((_req$locals = req.locals) !== null && _req$locals !== void 0 && _req$locals.proxyUrl)) {
        (0, _logging.logDefaultBodyError)(req, res, opts);
      }
      if (opts.logResponse === true || !!((_req$locals2 = req.locals) !== null && _req$locals2 !== void 0 && _req$locals2.proxyUrl) && opts.logResponse !== false) {
        if (opts.indentResponse !== false && _fp["default"].isFunction(cnsl.group)) {
          cnsl.group();
        }
        (0, _logging.logResponse)(req, res, opts);
        if (opts.indentResponse !== false && _fp["default"].isFunction(cnsl.groupEnd)) {
          cnsl.groupEnd();
        }
      }
    });
    next();
  });
  if (opts.defaultCors === true) {
    router.use((0, _cors["default"])());
  }
  if (!_fp["default"].isEmpty(opts.proxy)) {
    if (!opts.silentStart) {
      cnsl.log('Using proxies:');
    }
    _fp["default"].each(function (_ref) {
      var path = _ref.path,
        host = _ref.host,
        hostPath = _ref.hostPath,
        protocol = _ref.protocol;
      var https = protocol === 'https' ? true : protocol === 'http' ? false : undefined;
      var protocolPrefix = protocol ? "".concat(protocol, "://") : '';
      if (!opts.silentStart) {
        cnsl.log("  '".concat(path, "' -> ").concat(protocolPrefix).concat(host).concat(hostPath || ''));
      }
      router.use(path, (0, _expressHttpProxy["default"])(host, {
        https: https,
        parseReqBody: false,
        proxyReqPathResolver: function proxyReqPathResolver( /** @type {RequestExt} */req) {
          var resolvedPath = hostPath === '/' ? req.url : hostPath + req.url;
          req.locals.proxyUrl = "".concat(protocolPrefix).concat(host).concat(resolvedPath);
          return resolvedPath;
        },
        proxyReqBodyDecorator: function proxyReqBodyDecorator(bodyContent, /** @type {RequestExt} */srcReq) {
          return srcReq.locals.rawBody;
        },
        userResDecorator: opts.logResponse !== false ? function (proxyRes, proxyResData, userReq, userRes) {
          userRes.locals.body = proxyResData.toString('utf8');
          return proxyResData;
        } : undefined,
        proxyErrorHandler: function proxyErrorHandler(err, res, next) {
          var msg = {
            message: err.toString()
          };
          res.locals.body = JSON.stringify(msg);
          res.status(500).json(msg);
        }
      }));
    }, /** @type {CLSProxy[]} */opts.proxy);
  }
  if (opts.defaultCors === undefined) {
    router.use((0, _cors["default"])());
  }
  if (opts.logResponse === true || !_fp["default"].isEmpty(opts.proxy) && opts.logResponse !== false) {
    router.use(function captureResponse( /** @type {RequestExt} */req, res, next) {
      if (opts.logResponse === true) {
        var oldWrite = res.write;
        var oldEnd = res.end;
        var chunks;
        var appendBody = function appendBody(chunk) {
          if (chunks === undefined) {
            chunks = [];
          }
          if (_fp["default"].isFunction(Buffer.from)) {
            chunks.push(Buffer.from(chunk));
          } else {
            chunks.push(new Buffer(chunk)); // eslint-disable-line node/no-deprecated-api
          }
        };

        res.write = function () {
          for (var _len = arguments.length, restArgs = new Array(_len), _key = 0; _key < _len; _key++) {
            restArgs[_key] = arguments[_key];
          }
          appendBody(restArgs[0]);
          return oldWrite.apply(res, restArgs);
        };
        res.end = function () {
          for (var _len2 = arguments.length, restArgs = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            restArgs[_key2] = arguments[_key2];
          }
          if (restArgs[0] && !_fp["default"].isFunction(restArgs[0])) {
            appendBody(restArgs[0]);
          }
          if (chunks !== undefined) {
            var body = Buffer.concat(chunks).toString('utf8');
            res.locals.body = body;
          }
          return oldEnd.apply(res, restArgs);
        };
      }
      next();
    });
  }
  return router;
};
exports["default"] = _default;