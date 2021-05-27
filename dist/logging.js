"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logRequest = logRequest;
exports.logResponse = logResponse;

var _prettyjson = _interopRequireDefault(require("prettyjson"));

var _chalk = _interopRequireDefault(require("chalk"));

var _fp = _interopRequireDefault(require("lodash/fp"));

var _neatJson = require("../vendor/neat-json");

var _prettyData = require("pretty-data");

var _dateformat = _interopRequireDefault(require("dateformat"));

var _parseHeaders = _interopRequireDefault(require("parse-headers"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * @param {Error} err
 * @param {RequestExt} req
 * @param {ResponseExt} res
 * @param {CLSOptions} opts
 */
function logRequest(err, req, res, opts) {
  var cnsl = opts.console;
  var now = (0, _dateformat["default"])(new Date(), opts.dateFormat);

  function divider(text) {
    var color = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _chalk["default"].white.dim;
    var divLine = color.bold(">> [req:".concat(req.locals.id, "] [").concat(now, "]"));
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

  var proxyArrow = _chalk["default"].white.bold(' --> ');

  var pathLine = "".concat(req.method, " ").concat(req.originalUrl);
  var div = !err ? divider(_chalk["default"].yellow.bold(pathLine) + (proxyUrl ? proxyArrow + _chalk["default"].yellow.bold(proxyUrl) : '')) : divider(_chalk["default"].red.bold(pathLine) + (proxyUrl ? proxyArrow + _chalk["default"].red.bold(proxyUrl) : '') + _chalk["default"].red.bold('  *error*'), _chalk["default"].red.dim);
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

  if (err) {
    cnsl.log();

    var logJsonParseError = function logJsonParseError() {
      var positionMatches = err.message.match(/at position\s+(\d+)/);
      if (!positionMatches) return false;

      var index = _fp["default"].toNumber(positionMatches[1]);

      var contentBeforeError = req.locals.rawBodyBuffer.substring(index - 80, index);
      var contentAfterError = req.locals.rawBodyBuffer.substring(index, index + 80);
      cnsl.error(_chalk["default"].yellow("Check the request body position near ".concat(index, " below (marked with '!'):")));
      cnsl.error(_chalk["default"].yellow('...'));
      cnsl.error("".concat(contentBeforeError).concat(_chalk["default"].red('!')).concat(contentAfterError, "\""));
      cnsl.error(_chalk["default"].yellow('...'));
    };

    var logXmlParseError = function logXmlParseError() {
      var lineErrorMatches = err.message.match(/Line:\s+(\d+)/);
      var columnErrorMatches = err.message.match(/Column:\s+(\d+)/);
      if (!lineErrorMatches) return false;

      var line = _fp["default"].toNumber(lineErrorMatches[1]);

      var column = _fp["default"].toNumber(columnErrorMatches[1]);

      var lineWithError = req.locals.rawBodyBuffer.split('\n', line + 1)[line];
      var errorTitle = "Failed to parse body as XML according to Content-Type. Parse error in body might be here at line:".concat(line);

      if (column) {
        errorTitle += " column:".concat(column);
      }

      errorTitle += ' (see below)';
      cnsl.error(_chalk["default"].yellow(errorTitle));
      cnsl.error(lineWithError);

      if (column) {
        cnsl.error(_fp["default"].repeat(column - 1, ' ') + _chalk["default"].bold.red('^'));
      }
    };

    cnsl.error(_chalk["default"].red(err.stack));
    logJsonParseError() || logXmlParseError();
  }

  div.end();
  cnsl.log();
}
/**
 * @param {Error} err
 * @param {RequestExt} req
 * @param {ResponseExt} res
 * @param {CLSOptions} opts
 */


function logResponse(err,
/** @type {RequestExt} */
req, res, opts) {
  var cnsl = opts.console;
  var now = (0, _dateformat["default"])(new Date(), opts.dateFormat);

  function divider(text) {
    var color = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _chalk["default"].white.dim;
    var divLine = color.bold("<< [res:".concat(req.locals.id, "] [").concat(now, "]"));
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
  var div = !err && res.statusCode < 400 ? divider(_chalk["default"].green.bold(statusPreFix) + _chalk["default"].yellow.bold(pathLine) + (proxyUrl ? proxyArrow + _chalk["default"].yellow.bold(proxyUrl) : '')) : divider(_chalk["default"].red.bold(statusPreFix) + _chalk["default"].red.bold(pathLine) + (proxyUrl ? proxyArrow + _chalk["default"].red.bold(proxyUrl) : '') + (err ? _chalk["default"].red.bold('  *error*') : ''), _chalk["default"].red.dim);
  cnsl.log();
  div.begin();

  var renderParams = function renderParams(obj) {
    return _prettyjson["default"].render(obj, {
      defaultIndentation: 2
    }, 2);
  }; // const headers = res.getHeaders()


  cnsl.log(_chalk["default"].magenta('headers' + ':'));
  cnsl.log(renderParams((0, _parseHeaders["default"])(res._header)));
  cnsl.log(_chalk["default"].magenta('body: '));
  cnsl.log(res.locals.body); // switch (req.bodyType) {
  //   case 'empty':
  //     log(chalk.magenta('body: (empty)'))
  //     break
  //   case 'raw':
  //     log(chalk.magenta('body: ') + chalk.yellow(`(parsed as raw string by console-log-server since content-type is '${headers['content-type']}'. Forgot to set it correctly?)`))
  //     log(chalk.white(req.body.toString()))
  //     break
  //   case 'json':
  //     log(chalk.magenta('body (json): '))
  //     log(chalk.green(neatJSON(req.body, {
  //       wrap: 40,
  //       aligned: true,
  //       afterComma: 1,
  //       afterColon1: 1,
  //       afterColonN: 1
  //     })))
  //     break
  //   case 'xml':
  //     log(chalk.magenta('body (xml): '))
  //     log(chalk.green(pd.xml(req.locals.rawBodyBuffer)))
  //     break
  //   case 'text':
  //     log(chalk.magenta('body: ') + chalk.yellow(`(parsed as plain text since content-type is '${headers['content-type']}'. Forgot to set it correctly?)`))
  //     log(chalk.white(req.body))
  //     break
  //   case 'error':
  //     log(chalk.red('body (error): ') + chalk.yellow('(failed to handle request. Body printed below as plain text if at all...)'))
  //     if (req.body) {
  //       log(chalk.white(req.locals.rawBodyBuffer))
  //     }
  //     break
  //   default:
  //     throw new Error(`Internal Error! Unknown bodyType: ${req.bodyType}`)
  // }
  // if (err) {
  //   log()
  //   const logJsonParseError = () => {
  //     const positionMatches = err.message.match(/at position\s+(\d+)/)
  //     if (!positionMatches) return false
  //     const index = _.toNumber(positionMatches[1])
  //     const contentBeforeError = req.locals.rawBodyBuffer.substring(index - 80, index)
  //     const contentAfterError = req.locals.rawBodyBuffer.substring(index, index + 80)
  //     console.error(chalk.yellow(`Check the request body position near ${index} below (marked with '!'):`))
  //     console.error(chalk.yellow('...'))
  //     console.error(`${contentBeforeError}${chalk.red('!')}${contentAfterError}"`)
  //     console.error(chalk.yellow('...'))
  //   }
  //   const logXmlParseError = () => {
  //     const lineErrorMatches = err.message.match(/Line:\s+(\d+)/)
  //     const columnErrorMatches = err.message.match(/Column:\s+(\d+)/)
  //     if (!lineErrorMatches) return false
  //     const line = _.toNumber(lineErrorMatches[1])
  //     const column = _.toNumber(columnErrorMatches[1])
  //     const lineWithError = req.locals.rawBodyBuffer.split('\n', line + 1)[line]
  //     let errorTitle = `Failed to parse body as XML according to Content-Type. Parse error in body might be here at line:${line}`
  //     if (column) {
  //       errorTitle += ` column:${column}`
  //     }
  //     errorTitle += ' (see below)'
  //     console.error(chalk.yellow(errorTitle))
  //     console.error(lineWithError)
  //     if (column) {
  //       console.error(_.repeat(column - 1, ' ') + chalk.bold.red('^'))
  //     }
  //   }
  //   console.error(chalk.red(err.stack))
  //   logJsonParseError() || logXmlParseError()
  // }

  div.end();
  cnsl.log();
}