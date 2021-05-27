"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = consoleLogServer;

var _router = _interopRequireDefault(require("./router"));

var _fp = _interopRequireDefault(require("lodash/fp"));

var _express = _interopRequireDefault(require("express"));

var _mimeTypes = _interopRequireDefault(require("mime-types"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @param { CLSOptions } opts
 * @return {{
 *  app: import("express-serve-static-core").Express;
 *  start: (callback?: () => void) => import('http').Server | import('http').Server[];
 * }}
 */
function consoleLogServer(opts) {
  var mimeExtensions = _fp["default"].flow(_fp["default"].values, _fp["default"].flatten, _fp["default"].without(['json']))(_mimeTypes["default"].extensions);

  opts = _fp["default"].defaults({
    port: 3000,
    hostname: 'localhost',
    responseCode: 200,
    responseBody: undefined,
    responseHeader: [],
    console: console,
    dateFormat: "yyyy-mm-dd'T'HH:MM:sso",
    ignoreUncaughtErrors: false,
    defaultRoute: function defaultRoute(req, res) {
      var _res$set$status$forma;

      var negotiatedType = req.accepts(mimeExtensions);

      var defaultHandler = function defaultHandler() {
        return opts.responseBody ? res.send(opts.responseBody) : res.end();
      };

      var headers = _fp["default"].flow(_fp["default"].map(function (h) {
        return h.split(':', 2);
      }), _fp["default"].fromPairs)(opts.responseHeader);

      res.set(headers).status(opts.responseCode).format((_res$set$status$forma = {
        json: function json() {
          return opts.responseBody ? res.jsonp(JSON.parse(opts.responseBody)) : res.end();
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
  var cnsl = opts.console;
  opts.responseHeader = opts.responseHeader && _fp["default"].castArray(opts.responseHeader);

  var isMultiServer = _fp["default"].isArray(opts.hostname);

  opts.hostname = opts.hostname && _fp["default"].castArray(opts.hostname);
  opts.port = opts.port && _fp["default"].castArray(opts.port);
  opts.proxy = opts.proxy && _fp["default"].castArray(opts.proxy);
  opts.proxy = _fp["default"].map(function (proxy) {
    var path = proxy.path,
        hostPath = proxy.hostPath;
    return _objectSpread(_objectSpread({}, proxy), {}, {
      hostPath: _fp["default"].startsWith('/', hostPath) ? hostPath : hostPath === undefined ? '/' : '/' + hostPath,
      path: (path === undefined ? '/' : _fp["default"].startsWith('/', path) ? path : "/".concat(path || '')).trim()
    });
  },
  /** @type {CLSProxy[]} */
  opts.proxy);

  var duplicates = _fp["default"].flow(_fp["default"].groupBy('path'), _fp["default"].pickBy(function (v) {
    return v.length > 1;
  }), _fp["default"].mapValues(_fp["default"].flow(_fp["default"].map(function (_ref) {
    var path = _ref.path,
        host = _ref.host;
    return "'".concat(path, "' -> ").concat(host);
  }), _fp["default"].join(' vs. '))), _fp["default"].values, _fp["default"].join(', '))(
  /** @type {CLSProxy[]} */
  opts.proxy);

  if (duplicates) {
    throw Error("Multiple proxies for same path(s): ".concat(duplicates));
  }
  /**
   * @type {import("express-serve-static-core").Express}
   */


  var app = opts.app || (0, _express["default"])();
  app.use((0, _router["default"])(opts));

  if (_fp["default"].isFunction(opts.addRouter)) {
    opts.addRouter(app);
  }

  return {
    app: app,
    start: function start() {
      var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};

      var servers = _fp["default"].flow(_fp["default"].zipWith(function (host, port) {
        return [host, port || opts.port[0]];
      },
      /** @type {string[]} */
      opts.hostname), _fp["default"].map(function (_ref2) {
        var _ref3 = _slicedToArray(_ref2, 2),
            host = _ref3[0],
            port = _ref3[1];

        return app.listen(port, host, function () {
          cnsl.log("console-log-server listening on http://".concat(host, ":").concat(port));
          callback();
        });
      }))(
      /** @type {number[]} */
      opts.port);

      if (opts.ignoreUncaughtErrors) {
        process.on('uncaughtException', function (err) {
          cnsl.log('Unhandled error. Set ignoreUncaughtErrors to pass these through');
          cnsl.log(err);
        });
      }

      if (isMultiServer) {
        return servers;
      } else {
        return servers[0];
      }
    }
  };
}

if (!module.parent) {
  consoleLogServer({
    ignoreUncaughtErrors: true
  }).start();
}