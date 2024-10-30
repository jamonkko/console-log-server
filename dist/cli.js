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
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function run() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var unknownArgs = false;
  var cli = (0, _meow["default"])(_objectSpread({
    help: "\n    Usage\n      $ console-log-server\n\n    Options\n      --port, -p Port Number\n      --hostname, -h Host name. You can provide multiple hostname flags (with optional matching port flags) to listen many hostnames. \n      --proxy, -P Host(s) to proxy the request to using https://www.npmjs.com/package/express-http-proxy. Syntax: [<path>>]<url>. You can provide different proxies for separate paths.\n      --response-code, -c Response response code (ignored if proxied)\n      --response-body, -b Response content (ignored if proxied)\n      --response-header, -H Response header (ignored if proxied)\n      --log-response, -r Log also the response. Enabled by default only for proxied requests. Logged response is fully read to a buffer which might change your api behaviour since response is not streamed directly to client, consider turning off if that is a problem.\n      --no-color\n      --version\n      --date-format, -d Date format supported by https://www.npmjs.com/package/dateformat (default \"yyyy-mm-dd'T'HH:MM:sso\")\n      --help\n      --default-cors, -C Add \"default\" cors using https://www.npmjs.com/package/cors default values. By default only enabled for non-proxied responses. Turn on to enable also for proxy responses, turn off to disable completely.\n      --silent-start, Do not log \"listening\", proxy mapping or any other status on start. Only requests and responses.\n      --mock-date, Use mocked date value for value of \"now\". https://www.npmjs.com/package/mockdate\n      --raw-body-limit, Max size of raw body supported. Number of bytes or string parseable by bytes library. Default is '5Mb'.\n      --indent-response, On by default. Indents response with console.group() when using node >= v8.5.0\n      --sort-fields, Off by default. Pretty print headers, query parameters and url-form body fields in sorted order. Does not apply to json bodies.\n    Examples\n\n      # basic usage\n      $ console-log-server -p 3000\n\n      # customized response\n      $ console-log-server -p 3000 -c 201 -b \"cool type content\" --response-header='Content-Type:application/cool' --response-header='key:value'\n\n      # Log date with UTC date format instead of local with offset\n      $ console-log-server -d \"isoUtcDateTime\"\n\n      # Proxy the request to other host. Response will be the actual response from the proxy. \n      $ console-log-server -P http://api.example.com\n\n      # Proxy the requests to multiple hosts based on paths.\n      $ console-log-server --proxy=\"/api/1>http://api-1.example.com\" --proxy=\"/api/2>http://api-2.example.com\"\n\n      # Proxy the request to path under other host. Response will be the actual response (with cors headers injected) from the proxy.\n      $ console-log-server -P http://api.example.com/v1/cats -C yes\n\n      # Turn off response logging\n      $ console-log-server -r no\n\n      # Receive and log raw bodies up to 10Mb\n      $ console-log-server -l \"10Mb\"\n\n      # Turn on response logging for all requests\n      $ console-log-server -r yes\n\n      # Don't add default (allow all) cors headers at all\n      $ console-log-server -C no\n\n      # Start server to your local IP and localhost. Might be useful when debugging devices connected to your own machine. Ports can be given for each hostname with --port flag(s).\n      $ console-log-server -h localhost -h 192.168.0.2 \n  "
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
      l: 'raw-body-limit',
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
      var parsedHost = _url["default"].URL ? new URL((0, _prependHttp["default"])(proxyHost)) : _url["default"].parse((0, _prependHttp["default"])(proxyHost)); // eslint-disable-line
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