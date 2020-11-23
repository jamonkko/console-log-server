"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = consoleLogServer;

var _router = _interopRequireDefault(require("./router"));

var _fp = _interopRequireDefault(require("lodash/fp"));

var _express = _interopRequireDefault(require("express"));

var _mimeTypes = _interopRequireDefault(require("mime-types"));

var _cors = _interopRequireDefault(require("cors"));

var _expressHttpProxy = _interopRequireDefault(require("express-http-proxy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function consoleLogServer() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var mimeExtensions = _fp["default"].flow(_fp["default"].values, _fp["default"].flatten, _fp["default"].without(['json']))(_mimeTypes["default"].extensions);

  opts = _fp["default"].defaults({
    port: 3000,
    hostname: 'localhost',
    resultCode: 200,
    resultBody: null,
    resultHeader: [],
    log: function log() {
      var _console;

      (_console = console).log.apply(_console, arguments);
    },
    defaultRoute: function defaultRoute(req, res) {
      var _res$set$status$forma;

      var negotiatedType = req.accepts(mimeExtensions);

      var defaultHandler = function defaultHandler() {
        return opts.resultBody ? res.send(opts.resultBody) : res.end();
      };

      var headers = _fp["default"].flow(_fp["default"].map(function (h) {
        return h.split(':', 2);
      }), _fp["default"].fromPairs)(opts.resultHeader);

      res.set(headers).status(opts.resultCode).format((_res$set$status$forma = {
        json: function json() {
          return opts.resultBody ? res.jsonp(JSON.parse(opts.resultBody)) : res.end();
        }
      }, _defineProperty(_res$set$status$forma, negotiatedType, defaultHandler), _defineProperty(_res$set$status$forma, "default", defaultHandler), _res$set$status$forma));
    },
    addRouter: function addRouter(app) {
      if (opts.router) {
        app.use(opts.router);
      }

      if (_fp["default"].isFunction(opts.defaultRoute)) {
        app.all('*', opts.defaultRoute);
      }
    }
  }, opts);
  opts.resultHeader = opts.resultHeader && _fp["default"].castArray(opts.resultHeader);
  var app = opts.app || (0, _express["default"])();
  app.use((0, _cors["default"])());
  app.use((0, _router["default"])(opts));

  if (opts.proxy) {
    opts.log('Using proxies:');

    _fp["default"].flow(_fp["default"].trim, _fp["default"].split(' '), _fp["default"].each(function (proxyArg) {
      var _$split = _fp["default"].split('>', proxyArg),
          _$split2 = _slicedToArray(_$split, 2),
          pathPart = _$split2[0],
          proxyPart = _$split2[1];

      var proxyHost = proxyPart !== null && proxyPart !== void 0 ? proxyPart : pathPart;
      var path = proxyPart === undefined ? '/' : _fp["default"].startsWith(pathPart, '/') ? pathPart : "/".concat(pathPart || '');

      if (proxyHost) {
        opts.log("  '".concat(path, "' -> ").concat(proxyHost));
        app.use(path, (0, _expressHttpProxy["default"])(proxyHost, {
          parseReqBody: true,
          reqAsBuffer: true,
          proxyReqOptDecorator: function proxyReqOptDecorator(proxyReqOpts, srcReq) {
            srcReq.__CLS_PROXY_URL__ = "".concat(proxyHost).concat(srcReq.originalUrl);
            return proxyReqOpts;
          }
        }));
      } else {
        throw Error("Invalid proxy arguments: ".concat(proxyArg));
      }
    }))(opts.proxy);
  }

  if (_fp["default"].isFunction(opts.addRouter)) {
    opts.addRouter(app);
  }

  return {
    app: app,
    start: function start() {
      var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {
        return true;
      };
      app.listen(opts.port, opts.hostname, function () {
        opts.log("console-log-server listening on http://".concat(opts.hostname, ":").concat(opts.port));
        cb(null);
      });
    }
  };
}

if (!module.parent) {
  consoleLogServer().start();
}