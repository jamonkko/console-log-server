"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = consoleLogServer;
var _router = _interopRequireDefault(require("./router"));
var _fp = _interopRequireDefault(require("lodash/fp"));
var _express = _interopRequireDefault(require("express"));
var _mimeTypes = _interopRequireDefault(require("mime-types"));
var _mockdate = _interopRequireDefault(require("mockdate"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /*!
 * @license
 * console-log-server v0.4.0 (https://github.com/jamonkko/console-log-server#readme)
 * Copyright 2024 Jarkko Mönkkönen <jamonkko@gmail.com>
 * Licensed under MIT
 */
/**
 * @param { CLSOptions } opts
 * @return {{
 *  app: import("express-serve-static-core").Express,
 *  startAll: (callback?: (err: Error, server: import('http').Server) => void) => {
 *    server: import('http').Server[],
 *    ready: Promise<import("http").Server[]>
 *  },
 *  start: (callback?: (err: Error) => void) => {
 *    server: import('http').Server,
 *    ready: Promise<import("http").Server>
 *  }
 * }}
 */
function consoleLogServer(opts) {
  opts = _fp["default"].defaults({
    port: 3000,
    hostname: 'localhost',
    responseCode: 200,
    responseBody: undefined,
    responseHeader: [],
    console: console,
    dateFormat: "yyyy-mm-dd'T'HH:MM:sso",
    ignoreUncaughtErrors: false,
    defaultRoute: function defaultRoute(/** @type {RequestExt} */req, /** @type {ResponseExt} */res) {
      var headers = _fp["default"].flow(_fp["default"].map(function (h) {
        return h.split(':', 2);
      }), _fp["default"].fromPairs)(opts.responseHeader);
      res.set(headers).status(res.locals.responseCode || opts.responseCode);
      var contentType = res.get('content-type');
      if (!contentType) {
        res.format({
          text: function text() {},
          json: function json() {},
          xml: function xml() {},
          html: function html() {},
          js: function js() {},
          css: function css() {},
          "default": function _default() {}
        });
      }
      contentType = res.get('content-type');
      var ext = _mimeTypes["default"].extension(contentType);
      // Prevent express automatically converting sent response content to status code if it's a number
      var ensureNonNumeric = function ensureNonNumeric(value) {
        return _fp["default"].isNumber(value) ? "".concat(value) : value;
      };
      switch (ext) {
        case 'json':
          {
            if (opts.responseBody) {
              try {
                res.jsonp(JSON.parse(opts.responseBody));
              } catch (e) {
                res.send(ensureNonNumeric(opts.responseBody));
                res.locals.defaultBodyError = e;
              }
            } else {
              res.end();
            }
            break;
          }
        default:
          opts.responseBody ? res.send(ensureNonNumeric(opts.responseBody)) : res.end();
          break;
      }
    },
    addRouter: function addRouter(app) {
      if (opts.router) {
        app.use(opts.router);
      }
      if (_fp["default"].isFunction(opts.defaultRoute)) {
        var delayedRoute = function delayedRoute() {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          return setTimeout.apply(void 0, [opts.defaultRoute, opts.responseDelay].concat(args));
        };
        app.all('*', !opts.responseDelay ? opts.defaultRoute : delayedRoute);
      }
    }
  }, opts);
  if (opts.mockDate !== undefined) {
    _mockdate["default"].set(opts.mockDate);
  } else {
    _mockdate["default"].reset();
  }
  var cnsl = opts.console;
  opts.responseHeader = opts.responseHeader && _fp["default"].castArray(opts.responseHeader);
  var isMultiServer = _fp["default"].isArray(opts.hostname) && opts.hostname.length > 1;
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
  }, /** @type {CLSProxy[]} */opts.proxy);
  var duplicates = _fp["default"].flow(_fp["default"].groupBy('path'), _fp["default"].pickBy(function (v) {
    return v.length > 1;
  }), _fp["default"].mapValues(_fp["default"].flow(_fp["default"].map(function (_ref) {
    var path = _ref.path,
      host = _ref.host;
    return "'".concat(path, "' -> ").concat(host);
  }), _fp["default"].join(' vs. '))), _fp["default"].values, _fp["default"].join(', '))(/** @type {CLSProxy[]} */opts.proxy);
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
  function startAll() {
    var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};
    var servers = _fp["default"].flow(_fp["default"].zipWith(function (host, port) {
      return [host, port || opts.port[0]];
    }, /** @type {string[]} */opts.hostname), _fp["default"].map(function (_ref2) {
      var _ref3 = _slicedToArray(_ref2, 2),
        host = _ref3[0],
        port = _ref3[1];
      var resolvePromise, rejectPromise;
      function onReady(err) {
        if (!err) {
          if (!opts.silentStart) {
            cnsl.log("console-log-server listening on http://".concat(host, ":").concat(this.address().port));
          }
          resolvePromise(server);
        } else {
          err.server = server;
          rejectPromise(err);
        }
        callback(err, server);
      }
      var ready = new Promise(function (resolve, reject) {
        resolvePromise = resolve;
        rejectPromise = reject;
      });
      var server = app.listen(port, host, onReady);
      return {
        server: server,
        ready: ready
      };
    }))(/** @type {number[]} */opts.port);
    if (opts.ignoreUncaughtErrors) {
      process.on('uncaughtException', function (err) {
        cnsl.log('Unhandled error. Set ignoreUncaughtErrors to pass these through');
        cnsl.log(err);
      });
    }
    return {
      server: _fp["default"].map(function (s) {
        return s.server;
      }, servers),
      ready: Promise.all(_fp["default"].map(function (s) {
        return s.ready;
      }, servers))
    };
  }
  return {
    app: app,
    startAll: startAll,
    start: function start() {
      var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};
      if (isMultiServer) {
        throw new Error('Call startAll instead of start when providing multiple hostnames to listen');
      }
      var res = startAll(callback);
      return {
        server: res.server[0],
        ready: res.ready.then(function (servers) {
          return servers[0];
        })
      };
    }
  };
}
if (!module.parent) {
  require('core-js');
  consoleLogServer({
    ignoreUncaughtErrors: true
  }).start().ready.then(function () {});
}