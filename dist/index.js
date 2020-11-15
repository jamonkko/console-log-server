'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = consoleLogServer;

var _router = require('./router');

var _router2 = _interopRequireDefault(_router);

var _fp = require('lodash/fp');

var _fp2 = _interopRequireDefault(_fp);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _mimeTypes = require('mime-types');

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /*!
                                                                                                                                                                                                                   * @license
                                                                                                                                                                                                                   * console-log-server v0.2.1 (https://github.com/jamonkko/console-log-server#readme)
                                                                                                                                                                                                                   * Copyright 2020 Jarkko Mönkkönen <jamonkko@gmail.com>
                                                                                                                                                                                                                   * Licensed under MIT
                                                                                                                                                                                                                   */


function consoleLogServer() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var mimeExtensions = _fp2.default.flow(_fp2.default.values, _fp2.default.flatten, _fp2.default.without(['json']))(_mimeTypes2.default.extensions);

  opts = _fp2.default.defaults({
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
      var headers = _fp2.default.flow(_fp2.default.map(function (h) {
        return h.split(':', 2);
      }), _fp2.default.fromPairs)(opts.resultHeader);
      res.set(headers).status(opts.resultCode).format((_res$set$status$forma = {
        json: function json() {
          return opts.resultBody ? res.jsonp(JSON.parse(opts.resultBody)) : res.end();
        }
      }, _defineProperty(_res$set$status$forma, negotiatedType, defaultHandler), _defineProperty(_res$set$status$forma, 'default', defaultHandler), _res$set$status$forma));
    },
    addRouter: function addRouter(app) {
      if (opts.router) {
        app.use(opts.router);
      }
      if (_fp2.default.isFunction(opts.defaultRoute)) {
        app.all('*', opts.defaultRoute);
      }
    }
  }, opts);

  opts.resultHeader = opts.resultHeader && _fp2.default.castArray(opts.resultHeader);

  var app = opts.app || (0, _express2.default)();
  app.use((0, _cors2.default)());
  app.use((0, _router2.default)(opts));
  if (_fp2.default.isFunction(opts.addRouter)) {
    opts.addRouter(app);
  }
  return {
    app: app,
    start: function start() {
      var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {
        return true;
      };

      app.listen(opts.port, opts.hostname, function () {
        opts.log('console-log-server listening on http://' + opts.hostname + ':' + opts.port);
        cb(null);
      });
    }
  };
}

if (!module.parent) {
  consoleLogServer().start();
}