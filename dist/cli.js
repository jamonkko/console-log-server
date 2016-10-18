#!/usr/bin/env node
'use strict';

var _meow = require('meow');

var _meow2 = _interopRequireDefault(_meow);

var _ = require('./');

var _2 = _interopRequireDefault(_);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var unknownArgs = false;

var cli = (0, _meow2.default)('\n  Usage\n    $ console-log-server\n\n  Options\n    --port, -p Port Number\n    --hostname, -h Host name\n    --result-code, -c Response result code\n    --result-body, -b Response content\n    --result-header, -H Response header\n    --no-color\n    --version\n    --help\n\n  Examples\n\n    # basic usage\n    $ console-log-server -p 3000\n\n    # customized response\n    $ console-log-server -p 3000 -c 201 -b "cool type content" --result-header=\'Content-Type:application/cool\' --result-header=\'key:value\'\n', {
  alias: {
    p: 'port',
    h: 'hostname',
    c: 'result-code',
    b: 'result-body',
    H: 'result-header'
  },
  unknown: function unknown(arg) {
    unknownArgs = arg !== '--no-color';
    return false;
  }
});

if (unknownArgs) {
  cli.showHelp();
} else {
  (0, _2.default)(cli.flags).start();
}