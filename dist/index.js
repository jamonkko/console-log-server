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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function consoleLogServer() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var mimeExtensions = _fp["default"].flow(_fp["default"].values, _fp["default"].flatten, _fp["default"].without(['json']))(_mimeTypes["default"].extensions);

  opts = _fp["default"].defaults({
    port: 3000,
    hostname: 'localhost',
    responseCode: 200,
    responseBody: null,
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
  opts.responseHeader = opts.responseHeader && _fp["default"].castArray(opts.responseHeader);
  var app = opts.app || (0, _express["default"])();
  app.use((0, _router["default"])(opts));

  if (_fp["default"].isFunction(opts.addRouter)) {
    opts.addRouter(app);
  }

  return {
    app: app,
    start: function start() {
      var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {
        return true;
      };
      var server = app.listen(opts.port, opts.hostname, function () {
        opts.console.log("console-log-server listening on http://".concat(opts.hostname, ":").concat(opts.port));
        cb(null);
      });

      if (opts.ignoreUncaughtErrors) {
        process.on('uncaughtException', function (err) {
          opts.console.log('Unhandled error. Set ignoreUncaughtErrors to pass these through');
          opts.console.log(err);
        });
      }

      return server;
    }
  };
}

if (!module.parent) {
  consoleLogServer().start({
    ignoreUncaughtErrors: true
  });
}