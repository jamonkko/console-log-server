#!/usr/bin/env node
"use strict";

var _meow = _interopRequireDefault(require("meow"));

var _2 = _interopRequireDefault(require("./"));

var _fp = _interopRequireDefault(require("lodash/fp"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var unknownArgs = false;
var cli = (0, _meow["default"])("\n  Usage\n    $ console-log-server\n\n  Options\n    --port, -p Port Number\n    --hostname, -h Host name\n    --proxy, -P Host(s) to proxy the request to using https://www.npmjs.com/package/express-http-proxy. You can provide one or more proxies using format: [<path>>]<url> [<path>>]<url>...\n    --result-code, -c Response result code (ignored if proxied)\n    --result-body, -b Response content (ignored if proxied)\n    --result-header, -H Response header (ignored if proxied)\n    --no-color\n    --version\n    --date-format, -d Date format supported by https://www.npmjs.com/package/dateformat\n    --help\n\n  Examples\n\n    # basic usage\n    $ console-log-server -p 3000\n\n    # customized response\n    $ console-log-server -p 3000 -c 201 -b \"cool type content\" --result-header='Content-Type:application/cool' --result-header='key:value'\n\n    # Log date with UTC date format instead of local with offset\n    $ console-log-server -d \"isoUtcDateTime\"\n\n    # Proxy the request to other host. Result will be the actual result from the proxy.\n    $ console-log-server -P http://api.example.com\n\n    # Proxy the requests to multiple hosts based on paths.\n    $ console-log-server -P \"/api/1>http://api-1.example.com /api/2>http://api-2.example.com\"\n", {
  alias: {
    p: 'port',
    h: 'hostname',
    c: 'result-code',
    b: 'result-body',
    H: 'result-header',
    d: 'date-format',
    P: 'proxy'
  },
  unknown: function unknown(arg) {
    unknownArgs = !_fp["default"].includes(arg, ['--no-color', '--version']);
    return true;
  }
});

if (unknownArgs) {
  cli.showHelp();
} else {
  (0, _2["default"])(cli.flags).start();
}