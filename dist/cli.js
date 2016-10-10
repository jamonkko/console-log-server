#!/usr/bin/env node
'use strict';

var _meow = require('meow');

var _meow2 = _interopRequireDefault(_meow);

var _ = require('./');

var _2 = _interopRequireDefault(_);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var unknownParameters = false;

var cli = (0, _meow2.default)('\n  Usage\n    $ console-log-server\n\n  Options\n    --port, -p  Port Number\n    --hostname, -h Host name\n    --version\n    --help\n  Examples\n    $ console-log-server -p 3000\n', {
  alias: {
    p: 'port',
    h: 'hostname'
  },
  unknown: function unknown() {
    unknownParameters = true;
  }
});

if (unknownParameters) {
  cli.showHelp();
} else {
  (0, _2.default)(cli.flags).start();
}