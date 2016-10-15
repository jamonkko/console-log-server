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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function consoleLogServer() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  opts = _fp2.default.defaults({
    port: 3000,
    hostname: 'localhost',
    defaultRoute: function defaultRoute(req, res) {
      return res.status(200).end();
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
  var app = opts.app || (0, _express2.default)();
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
        console.log('console-log-server listening on http://' + opts.hostname + ':' + opts.port);
        cb(null);
      });
    }
  };
} /*!
   * @license
   * console-log-server v0.0.2 (https://github.com/jamonkko/console-log-server#readme)
   * Copyright 2016 Jarkko Mönkkönen <jamonkko@gmail.com>
   * Licensed under MIT
   */


if (!module.parent) {
  consoleLogServer().start();
}