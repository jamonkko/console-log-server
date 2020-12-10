"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _prettyjson = _interopRequireDefault(require("prettyjson"));

var _chalk = _interopRequireDefault(require("chalk"));

var _fp = _interopRequireDefault(require("lodash/fp"));

var _neatJson = require("../vendor/neat-json");

var _prettyData = require("pretty-data");

var _dateformat = _interopRequireDefault(require("dateformat"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _default = function _default(err, req, res, opts) {
  var log = opts.log;
  var now = new Date();

  function divider(text) {
    var color = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _chalk["default"].cyan.dim;
    var divLine = color(_fp["default"].repeat(_chalk["default"].stripColor(text).length, '*'));
    return {
      begin: function begin() {
        log(divLine);
        log(text);
      },
      end: function end() {
        log(text);
        log(divLine);
      }
    };
  }

  var proxyUrl = req.__CLS_PROXY_URL__ || '';

  var proxyArrow = _chalk["default"].white.bold(' --> ');

  var pathLine = "".concat(req.method, " ").concat(req.originalUrl);
  var div = !err ? divider(_chalk["default"].yellow.bold(pathLine) + (proxyUrl ? proxyArrow + _chalk["default"].yellow.bold(proxyUrl) : '')) : divider(_chalk["default"].red.bold(pathLine) + (proxyUrl ? proxyArrow + _chalk["default"].red.bold(proxyUrl) : '') + _chalk["default"].red.bold('  *error*'), _chalk["default"].red.dim);
  log();
  div.begin();

  var renderParams = function renderParams(obj) {
    return _prettyjson["default"].render(obj, {
      defaultIndentation: 2
    }, 2);
  };

  var headers = req.headers;
  log(_chalk["default"].magenta('meta' + ':'));
  log(renderParams({
    date: (0, _dateformat["default"])(now, opts.dateFormat || "yyyy-mm-dd'T'HH:MM:sso")
  }));
  log(_chalk["default"].magenta('headers' + ':'));
  log(renderParams(headers));

  if (_fp["default"].isEmpty(req.query)) {
    log(_chalk["default"].magenta('query: (empty)'));
  } else {
    log(_chalk["default"].magenta('query:'));
    log(renderParams(req.query));
  }

  switch (req.bodyType) {
    case 'empty':
      log(_chalk["default"].magenta('body: (empty)'));
      break;

    case 'raw':
      log(_chalk["default"].magenta('body: ') + _chalk["default"].yellow("(parsed as raw string by console-log-server since content-type is '".concat(headers['content-type'], "'. Forgot to set it correctly?)")));
      log(_chalk["default"].white(req.body.toString()));
      break;

    case 'json':
      log(_chalk["default"].magenta('body (json): '));
      log(_chalk["default"].green((0, _neatJson.neatJSON)(req.body, {
        wrap: 40,
        aligned: true,
        afterComma: 1,
        afterColon1: 1,
        afterColonN: 1
      })));
      break;

    case 'url':
      log(_chalk["default"].magenta('body (url): '));
      log(renderParams(req.body));
      break;

    case 'xml':
      log(_chalk["default"].magenta('body (xml): '));
      log(_chalk["default"].green(_prettyData.pd.xml(req.rawBody)));
      break;

    case 'text':
      log(_chalk["default"].magenta('body: ') + _chalk["default"].yellow("(parsed as plain text since content-type is '".concat(headers['content-type'], "'. Forgot to set it correctly?)")));
      log(_chalk["default"].white(req.body));
      break;

    case 'error':
      log(_chalk["default"].red('body (error): ') + _chalk["default"].yellow('(failed to handle request. Body printed below as plain text if at all...)'));

      if (req.body) {
        log(_chalk["default"].white(req.rawBody));
      }

      break;

    default:
      throw new Error("Internal Error! Unknown bodyType: ".concat(req.bodyType));
  }

  if (err) {
    log();

    var logJsonParseError = function logJsonParseError() {
      var positionMatches = err.message.match(/at position\s+(\d+)/);
      if (!positionMatches) return false;

      var index = _fp["default"].toNumber(positionMatches[1]);

      var contentBeforeError = req.rawBody.substring(index - 80, index);
      var contentAfterError = req.rawBody.substring(index, index + 80);
      console.error(_chalk["default"].yellow("Check the request body position near ".concat(index, " below (marked with '!'):")));
      console.error(_chalk["default"].yellow('...'));
      console.error("".concat(contentBeforeError).concat(_chalk["default"].red('!')).concat(contentAfterError, "\""));
      console.error(_chalk["default"].yellow('...'));
    };

    var logXmlParseError = function logXmlParseError() {
      var lineErrorMatches = err.message.match(/Line:\s+(\d+)/);
      var columnErrorMatches = err.message.match(/Column:\s+(\d+)/);
      if (!lineErrorMatches) return false;

      var line = _fp["default"].toNumber(lineErrorMatches[1]);

      var column = _fp["default"].toNumber(columnErrorMatches[1]);

      var lineWithError = req.rawBody.split('\n', line + 1)[line];
      var errorTitle = "Failed to parse body as XML according to Content-Type. Parse error in body might be here at line:".concat(line);

      if (column) {
        errorTitle += " column:".concat(column);
      }

      errorTitle += ' (see below)';
      console.error(_chalk["default"].yellow(errorTitle));
      console.error(lineWithError);

      if (column) {
        console.error(_fp["default"].repeat(column - 1, ' ') + _chalk["default"].bold.red('^'));
      }
    };

    console.error(_chalk["default"].red(err.stack));
    logJsonParseError() || logXmlParseError();
  }

  div.end();
  log();
};

exports["default"] = _default;