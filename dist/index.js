'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = consoleLogServer;

var _application = require('./application');

var _application2 = _interopRequireDefault(_application);

var _fp = require('lodash/fp');

var _fp2 = _interopRequireDefault(_fp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*!
 * @license
 * console-log-server v0.0.2 (https://github.com/jamonkko/console-log-server#readme)
 * Copyright 2016 Jarkko Mönkkönen <jamonkko@gmail.com>
 * Licensed under MIT
 */
function consoleLogServer() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  opts = _fp2.default.defaults({ port: 3000, hostname: 'localhost' }, opts);
  var app = (0, _application2.default)(opts);
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
}

if (!module.parent) {
  consoleLogServer().start();
}