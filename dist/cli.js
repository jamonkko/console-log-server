#!/usr/bin/env node
"use strict";

var _meow = _interopRequireDefault(require("meow"));

var _2 = _interopRequireDefault(require("./"));

var _fp = _interopRequireDefault(require("lodash/fp"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

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

function parseProxies(proxiesArg) {
  var proxies = _fp["default"].flow(_fp["default"].trim, _fp["default"].split(/\s+/), _fp["default"].map(function (proxyArg) {
    var _$split = _fp["default"].split('>', proxyArg),
        _$split2 = _slicedToArray(_$split, 2),
        pathPart = _$split2[0],
        proxyPart = _$split2[1];

    var proxyHost = proxyPart !== null && proxyPart !== void 0 ? proxyPart : pathPart;

    if (!proxyHost) {
      throw Error("Invalid proxy arguments: ".concat(proxyArg));
    }

    var path = proxyPart === undefined ? '/' : _fp["default"].startsWith(pathPart, '/') ? pathPart : "/".concat(pathPart || '');
    return {
      path: path,
      host: proxyHost
    };
  }))(proxiesArg);

  var duplicates = _fp["default"].flow(_fp["default"].groupBy('path'), _fp["default"].pickBy(function (v) {
    return v.length > 1;
  }), _fp["default"].mapValues(_fp["default"].flow(_fp["default"].map(function (_ref) {
    var path = _ref.path,
        host = _ref.host;
    return "'".concat(path, "' -> ").concat(host);
  }), _fp["default"].join(' vs. '))), _fp["default"].values, _fp["default"].join(', '))(proxies);

  if (duplicates) {
    throw Error("Multiple proxies for same path(s): ".concat(duplicates));
  }

  return proxies;
}

if (unknownArgs) {
  cli.showHelp();
} else {
  cli.flags.proxy = parseProxies(cli.flags.proxy);
  (0, _2["default"])(cli.flags).start();
}