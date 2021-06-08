#!/usr/bin/env node
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = run;

var _meow = _interopRequireDefault(require("meow"));

var _2 = _interopRequireDefault(require("./"));

var _fp = _interopRequireDefault(require("lodash/fp"));

var _prependHttp = _interopRequireDefault(require("prepend-http"));

var _url = _interopRequireDefault(require("url"));

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

function run() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var unknownArgs = false;
  var cli = (0, _meow["default"])(_objectSpread({
    help: "\n    Usage\n      $ console-log-server\n\n    Options\n      --port, -p Port Number\n      --hostname, -h Host name. You can provide multiple hostname flags (with optional matching port flags) to listen many hostnames. \n      --proxy, -P Host(s) to proxy the request to using https://www.npmjs.com/package/express-http-proxy. Syntax: [<path>>]<url>. You can provide different proxies for separate paths.\n      --response-code, -c Response response code (ignored if proxied)\n      --response-body, -b Response content (ignored if proxied)\n      --response-header, -H Response header (ignored if proxied)\n      --log-response, -r Log also the response. Enabled by default only for proxied requests. Logged response is fully read to a buffer which might change your api behaviour since response is not streamed directly to client, consider turning off if that is a problem.\n      --no-color\n      --version\n      --date-format, -d Date format supported by https://www.npmjs.com/package/dateformat (default \"yyyy-mm-dd'T'HH:MM:sso\")\n      --help\n      --default-cors, -C Add \"default\" cors using https://www.npmjs.com/package/cors default values. By default only enabled for non-proxied responses. Turn on to enable also for proxy responses, turn off to disable completely.\n      --silent-start, Do not log \"listening\", proxy mapping or any other status on start. Only requests and responses.\n      --mock-date, Use mocked date value for value of \"now\". https://www.npmjs.com/package/mockdate\n      --indent-response, On by default. Indents response with console.group() when using node >= v8.5.0\n      --sort-fields, Off by default. Pretty print headers, query parameters and url-form body fields in sorted order. Does not apply to json bodies.\n    Examples\n\n      # basic usage\n      $ console-log-server -p 3000\n\n      # customized response\n      $ console-log-server -p 3000 -c 201 -b \"cool type content\" --response-header='Content-Type:application/cool' --response-header='key:value'\n\n      # Log date with UTC date format instead of local with offset\n      $ console-log-server -d \"isoUtcDateTime\"\n\n      # Proxy the request to other host. Response will be the actual response from the proxy. \n      $ console-log-server -P http://api.example.com\n\n      # Proxy the requests to multiple hosts based on paths.\n      $ console-log-server --proxy=\"/api/1>http://api-1.example.com\" --proxy=\"/api/2>http://api-2.example.com\"\n\n      # Proxy the request to path under other host. Response will be the actual response (with cors headers injected) from the proxy.\n      $ console-log-server -P http://api.example.com/v1/cats -C yes\n\n      # Turn off response logging\n      $ console-log-server -r no\n\n      # Turn on response logging for all requests\n      $ console-log-server -r yes\n\n      # Don't add default (allow all) cors headers at all\n      $ console-log-server -C no\n\n      # Start server to your local IP and localhost. Might be useful when debugging devices connected to your own machine. Ports can be given for each hostname with --port flag(s).\n      $ console-log-server -h localhost -h 192.168.0.2 \n  "
  }, opts.meow || {}), {
    alias: {
      p: 'port',
      h: 'hostname',
      c: 'response-code',
      b: 'response-body',
      H: 'response-header',
      d: 'date-format',
      P: 'proxy',
      r: 'log-response',
      C: 'default-cors',
      S: 'silent-start',
      D: 'mock-date',
      i: 'indent-response',
      s: 'sort-fields'
    },
    unknown: function unknown(arg) {
      unknownArgs = !_fp["default"].includes(arg, ['--no-color', '--version']);
      return true;
    }
  });

  function parseProxies(proxiesArg) {
    if (!proxiesArg) return undefined;

    var proxies = _fp["default"].flow(_fp["default"].castArray, _fp["default"].map(_fp["default"].trim), _fp["default"].compact, _fp["default"].map(function (proxyArg) {
      var _$split = _fp["default"].split('>', proxyArg),
          _$split2 = _slicedToArray(_$split, 2),
          pathPart = _$split2[0],
          proxyPart = _$split2[1];

      var proxyHost = proxyPart !== null && proxyPart !== void 0 ? proxyPart : pathPart;

      if (!proxyHost) {
        throw Error("Invalid proxy arguments: ".concat(proxyArg));
      }

      var parsedHost = _url["default"].URL ? new URL((0, _prependHttp["default"])(proxyHost)) : _url["default"].parse((0, _prependHttp["default"])(proxyHost)); // eslint-disable-line node/no-deprecated-api

      var protocol = _fp["default"].startsWith('https', proxyHost) ? 'https' : _fp["default"].startsWith('http', proxyHost) ? 'http' : undefined;
      return {
        path: proxyPart === undefined ? undefined : pathPart,
        host: parsedHost.host,
        protocol: protocol,
        hostPath: parsedHost.pathname
      };
    }))(proxiesArg);

    return proxies;
  }

  function showMessageAndExit(message) {
    console.log(message);
    cli.showHelp(1);
    return undefined;
  }

  var parseOnOff = function parseOnOff(value, flagName) {
    return value === undefined ? undefined : /^(?:y|yes|true|1|on)$/i.test(value) ? true : /^(?:n|no|false|0|off)$/i.test(value) ? false : showMessageAndExit("Invalid value '".concat(value, "' for ").concat(flagName));
  };

  if (unknownArgs) {
    cli.showHelp(1);
  } else {
    return (0, _2["default"])(_objectSpread(_objectSpread({}, cli.flags), {}, {
      proxy: parseProxies(cli.flags.proxy),
      logResponse: parseOnOff(cli.flags.logResponse, '--log-response'),
      defaultCors: parseOnOff(cli.flags.defaultCors, '--default-cors'),
      silentStart: parseOnOff(cli.flags.silentStart, '--silent-start'),
      indentResponse: parseOnOff(cli.flags.indentResponse, '--indent-response'),
      sortFields: parseOnOff(cli.flags.sortFields, '--sort-fields'),
      responseHeader: cli.flags.responseHeader,
      hostname: cli.flags.hostname,
      ignoreUncaughtErrors: true
    }, opts.cls || {})).startAll();
  }
}

if (!module.parent) {
  require('core-js');

  run().ready.then(function () {});
}