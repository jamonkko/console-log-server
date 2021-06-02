"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logRequest = logRequest;
exports.logDefaultBodyError = logDefaultBodyError;
exports.logResponse = logResponse;

var _prettyjson = _interopRequireDefault(require("prettyjson"));

var _chalk = _interopRequireDefault(require("chalk"));

var _fp = _interopRequireDefault(require("lodash/fp"));

var _neatJson = require("../vendor/neat-json");

var _prettyData = require("pretty-data");

var _dateformat = _interopRequireDefault(require("dateformat"));

var _parseHeaders = _interopRequireDefault(require("parse-headers"));

var _mimeTypes = _interopRequireDefault(require("mime-types"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * @param {RequestExt} req
 * @param {ResponseExt} res
 * @param {CLSOptions} opts
 */
function logRequest(req, res, opts) {
  var cnsl = opts.console;
  var now = (0, _dateformat["default"])(new Date(), opts.dateFormat);

  function divider(text) {
    var divLine = _chalk["default"].white.dim.bold(">> [req:".concat(req.locals.id, "] [").concat(now, "]"));

    return {
      begin: function begin() {
        cnsl.log(divLine);
        cnsl.log(text);
      },
      end: function end() {
        cnsl.log(text);
        cnsl.log(divLine);
      }
    };
  }

  var err = req.locals.bodyError;
  var proxyUrl = req.locals.proxyUrl || '';

  var proxyArrow = _chalk["default"].white.bold(' --> ');

  var pathLine = "".concat(req.method, " ").concat(req.originalUrl);
  var div = !err ? divider(_chalk["default"].yellow.bold(pathLine) + (proxyUrl ? proxyArrow + _chalk["default"].yellow.bold(proxyUrl) : '')) : divider(_chalk["default"].red.bold(pathLine) + (proxyUrl ? proxyArrow + _chalk["default"].red.bold(proxyUrl) : '') + _chalk["default"].red.bold('  *error*'));
  cnsl.log();
  div.begin();

  var renderParams = function renderParams(obj) {
    return _prettyjson["default"].render(obj, {
      defaultIndentation: 2
    }, 2);
  };

  var headers = req.headers;
  cnsl.log(_chalk["default"].magenta('headers' + ':'));
  cnsl.log(renderParams(headers));

  if (_fp["default"].isEmpty(req.query)) {
    cnsl.log(_chalk["default"].magenta('query: (empty)'));
  } else {
    cnsl.log(_chalk["default"].magenta('query:'));
    cnsl.log(renderParams(req.query));
  }

  switch (req.locals.bodyType) {
    case 'empty':
      cnsl.log(_chalk["default"].magenta('body: (empty)'));
      break;

    case 'raw':
      cnsl.log(_chalk["default"].magenta('body: ') + _chalk["default"].yellow("(parsed as raw string by console-log-server since content-type is '".concat(headers['content-type'], "'. Forgot to set it correctly?)")));
      cnsl.log(_chalk["default"].white(req.body.toString()));
      break;

    case 'json':
      cnsl.log(_chalk["default"].magenta('body (json): '));
      cnsl.log(_chalk["default"].green((0, _neatJson.neatJSON)(req.body, {
        wrap: 40,
        aligned: true,
        afterComma: 1,
        afterColon1: 1,
        afterColonN: 1
      })));
      break;

    case 'url':
      cnsl.log(_chalk["default"].magenta('body (url): '));
      cnsl.log(renderParams(req.body));
      break;

    case 'xml':
      cnsl.log(_chalk["default"].magenta('body (xml): '));
      cnsl.log(_chalk["default"].green(_prettyData.pd.xml(req.locals.rawBodyBuffer)));
      break;

    case 'text':
      cnsl.log(_chalk["default"].magenta('body: ') + _chalk["default"].yellow("(parsed as plain text since content-type is '".concat(headers['content-type'], "'. Forgot to set it correctly?)")));
      cnsl.log(_chalk["default"].white(req.body));
      break;

    case 'error':
      cnsl.log(_chalk["default"].red('body (error): ') + _chalk["default"].yellow('(failed to handle request. Body printed below as plain text if at all...)'));

      if (req.body) {
        cnsl.log(_chalk["default"].white(req.locals.rawBodyBuffer));
      }

      break;

    default:
      throw new Error("Internal Error! Unknown bodyType: ".concat(req.locals.bodyType));
  }

  printParseError(err, req.locals.rawBodyBuffer, 'Warning! Received request body was invalid', opts);
  div.end();
  cnsl.log();
}
/**
 * @param {RequestExt} req
 * @param {ResponseExt} res
 * @param {CLSOptions} opts
 */


function logDefaultBodyError(req, res, opts) {
  return printParseError(res.locals.defaultBodyError, opts.responseBody, "[req:".concat(req.locals.id, "] Warning! Returned responseBody is invalid. Consider fixing it unless you set it intentionally to have invalid value"), opts);
}
/**
 * @param {RequestExt} req
 * @param {ResponseExt} res
 * @param {CLSOptions} opts
 */


function logResponse(
/** @type {RequestExt} */
req, res, opts) {
  var cnsl = opts.console;
  var now = (0, _dateformat["default"])(new Date(), opts.dateFormat);

  function divider(text) {
    var divLine = _chalk["default"].white.dim.bold("<< [res:".concat(req.locals.id, "] [").concat(now, "]"));

    return {
      begin: function begin() {
        cnsl.log(divLine);
        cnsl.log(text);
      },
      end: function end() {
        cnsl.log(text);
        cnsl.log(divLine);
      }
    };
  }

  var proxyUrl = req.locals.proxyUrl || '';

  var proxyArrow = _chalk["default"].white.bold(' <-- ');

  var statusPreFix = "".concat(res.statusCode);
  var pathLine = " <- ".concat(req.method, " ").concat(req.originalUrl);
  var div = res.statusCode < 400 ? divider(_chalk["default"].green.bold(statusPreFix) + _chalk["default"].yellow.bold(pathLine) + (proxyUrl ? proxyArrow + _chalk["default"].yellow.bold(proxyUrl) : '')) : divider(_chalk["default"].red.bold(statusPreFix) + _chalk["default"].red.bold(pathLine) + (proxyUrl ? proxyArrow + _chalk["default"].red.bold(proxyUrl) : ''));
  cnsl.log();
  div.begin();

  var renderParams = function renderParams(obj) {
    return _prettyjson["default"].render(obj, {
      defaultIndentation: 2
    }, 2);
  };

  cnsl.log(_chalk["default"].magenta('headers' + ':'));
  cnsl.log(renderParams((0, _parseHeaders["default"])(res._header)));
  var contentType = res.get('content-type');
  var bodyType = res.locals.body === undefined ? 'empty' : _fp["default"].isString(contentType) ? _mimeTypes["default"].extension(contentType) : 'raw';

  try {
    switch (bodyType) {
      case 'empty':
        cnsl.log(_chalk["default"].magenta('body: (empty)'));
        break;

      case 'raw':
        cnsl.log(_chalk["default"].magenta('body: ') + _chalk["default"].yellow("(raw - could not resolve type)"));
        cnsl.log(_chalk["default"].white(res.locals.body.toString()));
        break;

      case 'json':
        {
          var json = JSON.parse(res.locals.body);
          cnsl.log(_chalk["default"].magenta("body: (".concat(bodyType, ")")));
          cnsl.log(_chalk["default"].green((0, _neatJson.neatJSON)(json, {
            wrap: 40,
            aligned: true,
            afterComma: 1,
            afterColon1: 1,
            afterColonN: 1
          })));
          break;
        }

      case 'xml':
        {
          var xml = _prettyData.pd.xml(res.locals.body);

          cnsl.log(_chalk["default"].magenta("body: (".concat(bodyType, ")")));
          cnsl.log(_chalk["default"].green(xml));
          break;
        }

      case 'text':
        cnsl.log(_chalk["default"].magenta("body: (".concat(bodyType, ")")));
        cnsl.log(_chalk["default"].white(res.locals.body));
        break;

      default:
        cnsl.log(_chalk["default"].magenta('body: ') + (bodyType ? _chalk["default"].yellow("(".concat(bodyType, " - as raw string, no formatting support yet)")) : _chalk["default"].yellow('(as raw string)')));
        cnsl.log(_chalk["default"].white(res.locals.body.toString()));
        break;
    }
  } catch (e) {
    cnsl.log(_chalk["default"].magenta('body: ') + _chalk["default"].yellow("(raw - error when trying to pretty-print as '".concat(bodyType, "')")));
    cnsl.log(_chalk["default"].white(res.locals.body.toString()));
    printParseError(e, res.locals.body, 'Warning! Response body is invalid', opts);
  }

  div.end();
  cnsl.log();
}
/**
 * @param {Error} err
 * @param {string} data
 * @param {string} message
 * @param {CLSOptions} opts
 */


function printParseError(err, data, message, opts) {
  var cnsl = opts.console;

  if (err) {
    cnsl.log();

    var logJsonParseError = function logJsonParseError() {
      var positionMatches = err.message.match(/at position\s+(\d+)/);
      if (!positionMatches) return false;

      var index = _fp["default"].toNumber(positionMatches[1]);

      var contentBeforeError = data.substring(index - 80, index);
      var contentAfterError = data.substring(index, index + 80);
      cnsl.error(_chalk["default"].yellow("Check the position near ".concat(index, " below (marked with '!'):")));
      cnsl.error(_chalk["default"].yellow('...'));
      cnsl.error("".concat(contentBeforeError).concat(_chalk["default"].red('!')).concat(contentAfterError, "\""));
      cnsl.error(_chalk["default"].yellow('...'));
      return true;
    };

    var logXmlParseError = function logXmlParseError() {
      var lineErrorMatches = err.message.match(/Line:\s+(\d+)/);
      var columnErrorMatches = err.message.match(/Column:\s+(\d+)/);
      if (!lineErrorMatches) return false;

      var line = _fp["default"].toNumber(lineErrorMatches[1]);

      var column = _fp["default"].toNumber(columnErrorMatches[1]);

      var lineWithError = data.split('\n', line + 1)[line];
      var errorTitle = "Failed to parse as XML. Parse error might be here at line:".concat(line);

      if (column) {
        errorTitle += " column:".concat(column);
      }

      errorTitle += ' (see below)';
      cnsl.error(_chalk["default"].yellow(errorTitle));
      cnsl.error(lineWithError);

      if (column) {
        cnsl.error(_fp["default"].repeat(column - 1, ' ') + _chalk["default"].bold.red('^'));
      }

      return true;
    };

    cnsl.error(_chalk["default"].red("".concat(message, ": ").concat(err.message)));
    logJsonParseError() || logXmlParseError() || cnsl.error(_chalk["default"].red(err.stack));
  }
}