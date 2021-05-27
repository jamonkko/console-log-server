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

var _default = function _default(opts) {
  var cnsl = opts.console;

  var router = _express["default"].Router();

  var reqCounter = 0;
  router.use(function addLocals(
  /** @type {RequestExt} */
  req, res, next) {
    req.locals || (req.locals = {});
    var requestId = req.header('X-Request-ID') || req.header('X-Correlation-ID');
    req.locals.id = "".concat(++reqCounter) + (requestId ? ":".concat(requestId) : '');
    next();
  });
  router.use(function saveRawBody(
  /** @type {RequestExt} */
  req, res, next) {
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
    verify: function verify(
    /** @type {RequestExt} */
    req) {
      req.locals.bodyType = 'json';
    }
  }));
  router.use(_bodyParser["default"].urlencoded({
    extended: true,
    verify: function verify(
    /** @type {RequestExt} */
    req) {
      req.locals.bodyType = 'url';
    }
  }));
  router.use((0, _expressXmlBodyparser["default"])());
  router.use(function markBodyAsXml(
  /** @type {RequestExt} */
  req, res, next) {
    if (!req.locals.bodyType && !_fp["default"].isEmpty(req.body)) {
      req.locals.bodyType = 'xml';
    }

    next();
  });
  router.use(_bodyParser["default"].text({
    verify: function verify(
    /** @type {RequestExt} */
    req) {
      req.locals.bodyType = 'text';
    }
  }));
  router.use(_bodyParser["default"].raw({
    type: function type() {
      return true;
    },
    verify: function verify(
    /** @type {RequestExt} */
    req) {
      req.locals.bodyType = 'raw';
    }
  }));
  router.use(function logInvalidRequest(err,
  /** @type {RequestExt} */
  req, res, next) {
    if (!req.locals.bodyType) {
      req.locals.bodyType = 'error';
    }

    (0, _logging.logRequest)(err, req, res, opts);
    res.status(400).end();
  });
  router.use(function logOkRequest(
  /** @type {RequestExt} */
  req, res, next) {
    res.on('finish', function () {
      var _req$locals2;

      if (req.locals.rawBodyBuffer === undefined || req.locals.rawBodyBuffer.length === 0) {
        var _req$locals;

        (_req$locals = req.locals).bodyType || (_req$locals.bodyType = 'empty');
      }

      (0, _logging.logRequest)(null, req, res, opts);

      if (opts.logResponse === true || !!((_req$locals2 = req.locals) !== null && _req$locals2 !== void 0 && _req$locals2.proxyUrl) && opts.logResponse !== false) {
        if (_fp["default"].isFunction(cnsl.group)) {
          cnsl.group();
        }

        (0, _logging.logResponse)(null, req, res, opts);

        if (_fp["default"].isFunction(cnsl.groupEnd)) {
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
    cnsl.log('Using proxies:');

    _fp["default"].each(function (_ref) {
      var path = _ref.path,
          host = _ref.host,
          hostPath = _ref.hostPath,
          protocol = _ref.protocol;
      hostPath = _fp["default"].startsWith('/', hostPath) ? hostPath : hostPath === undefined ? '/' : '/' + hostPath;
      var https = protocol === 'https' ? true : protocol === 'http' ? false : undefined;
      var protocolPrefix = protocol ? "".concat(protocol, "://") : '';
      cnsl.log("  '".concat(path, "' -> ").concat(protocolPrefix).concat(host).concat(hostPath || ''));
      router.use(path, (0, _expressHttpProxy["default"])(host, {
        https: https,
        parseReqBody: false,
        proxyReqPathResolver: function proxyReqPathResolver(
        /** @type {RequestExt} */
        req) {
          var resolvedPath = hostPath === '/' ? req.url : hostPath + req.url;
          req.locals.proxyUrl = "".concat(protocolPrefix).concat(host).concat(resolvedPath);
          return resolvedPath;
        },
        proxyReqBodyDecorator: function proxyReqBodyDecorator(bodyContent,
        /** @type {RequestExt} */
        srcReq) {
          return srcReq.locals.rawBody;
        },
        userResDecorator: opts.logResponse !== false ? function (proxyRes, proxyResData, userReq, userRes) {
          userRes.locals.body = proxyResData.toString('utf8');
          return proxyResData;
        } : undefined,
        proxyErrorHandler: function proxyErrorHandler(err, res, next) {
          res.status(500).json({
            message: err.toString()
          });
          res.locals.body = {
            message: err.toString()
          };
        }
      }));
    }, opts.proxy);
  }

  if (opts.defaultCors === undefined) {
    router.use((0, _cors["default"])());
  }

  if (opts.logResponse === true || !_fp["default"].isEmpty(opts.proxy) && opts.logResponse !== false) {
    router.use(function captureResponse(
    /** @type {RequestExt} */
    req, res, next) {
      if (opts.logResponse === true) {
        var oldWrite = res.write;
        var oldEnd = res.end;
        var chunks = [];

        res.write = function () {
          for (var _len = arguments.length, restArgs = new Array(_len), _key = 0; _key < _len; _key++) {
            restArgs[_key] = arguments[_key];
          }

          chunks.push(Buffer.from(restArgs[0]));
          return oldWrite.apply(res, restArgs);
        };

        res.end = function () {
          for (var _len2 = arguments.length, restArgs = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            restArgs[_key2] = arguments[_key2];
          }

          if (restArgs[0]) {
            chunks.push(Buffer.from(restArgs[0]));
          }

          var body = Buffer.concat(chunks).toString('utf8');
          res.locals.body = body;
          return oldEnd.apply(res, restArgs);
        };
      }

      next();
    });
  }

  return router;
};

exports["default"] = _default;