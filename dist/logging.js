'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _prettyjson = require('prettyjson');

var _prettyjson2 = _interopRequireDefault(_prettyjson);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _fp = require('lodash/fp');

var _fp2 = _interopRequireDefault(_fp);

var _neatJson = require('../vendor/neat-json');

var _prettyData = require('pretty-data');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (err, req, res, log) {
  function divider(text) {
    var color = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _chalk2.default.cyan.dim;

    var divLine = color('*'.repeat(text.length));
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

  var pathLine = req.method + ' ' + req.originalUrl;
  var div = !err ? divider(_chalk2.default.yellow.bold(pathLine)) : divider(_chalk2.default.red.bold(pathLine + ' (error!)'), _chalk2.default.red.dim);
  log();
  div.begin();
  var renderParams = function renderParams(obj) {
    return _prettyjson2.default.render(obj, { defaultIndentation: 2 }, 2);
  };
  var headers = req.headers;

  log(_chalk2.default.magenta('headers' + ':'));
  log(renderParams(headers));

  if (_fp2.default.isEmpty(req.query)) {
    log(_chalk2.default.magenta('query: (empty)'));
  } else {
    log(_chalk2.default.magenta('query:'));
    log(renderParams(req.query));
  }

  switch (req.bodyType) {
    case 'empty':
      log(_chalk2.default.magenta('body: (empty)'));
      break;
    case 'raw':
      log(_chalk2.default.magenta('body: ') + _chalk2.default.yellow('(parsed as raw string by console-log-server since content-type is \'' + headers['content-type'] + '\'. Forgot to set it correctly?)'));
      log(_chalk2.default.white(req.body.toString()));
      break;
    case 'json':
      log(_chalk2.default.magenta('body (json): '));
      log(_chalk2.default.green((0, _neatJson.neatJSON)(req.body, {
        wrap: 40,
        aligned: true,
        afterComma: 1,
        afterColon1: 1,
        afterColonN: 1
      })));
      break;
    case 'url':
      log(_chalk2.default.magenta('body (url): '));
      log(renderParams(req.body));
      break;
    case 'xml':
      log(_chalk2.default.magenta('body (xml): '));
      log(_chalk2.default.green(_prettyData.pd.xml(req.rawBody)));
      break;
    case 'text':
      log(_chalk2.default.magenta('body: ') + _chalk2.default.yellow('(parsed as plain text since content-type is \'' + headers['content-type'] + '\'. Forgot to set it correctly?)'));
      log(_chalk2.default.white(req.body));
      break;
    case 'error':
      log(_chalk2.default.red('body (error): ') + _chalk2.default.yellow('(failed to handle request. Body printed below as plain text if at all...)'));
      if (req.body) {
        log(_chalk2.default.white(req.rawBody));
      }
      break;
    default:
      throw new Error('Internal Error! Unknown bodyType: ' + req.bodyType);
  }

  if (err) {
    log();
    var logJsonParseError = function logJsonParseError() {
      var positionMatches = err.message.match(/at position\s+(\d+)/);
      if (!positionMatches) return false;
      var index = _fp2.default.toNumber(positionMatches[1]);
      var contentBeforeError = req.rawBody.substring(index - 80, index);
      var contentAfterError = req.rawBody.substring(index, index + 80);
      console.error(_chalk2.default.yellow('Check the request body position near ' + index + ' below (marked with \'!\'):'));
      console.error(_chalk2.default.yellow('...'));
      console.error('' + contentBeforeError + _chalk2.default.red('!') + contentAfterError + '"');
      console.error(_chalk2.default.yellow('...'));
    };
    var logXmlParseError = function logXmlParseError() {
      var lineErrorMatches = err.message.match(/Line:\s+(\d+)/);
      var columnErrorMatches = err.message.match(/Column:\s+(\d+)/);
      if (!lineErrorMatches) return false;
      var line = _fp2.default.toNumber(lineErrorMatches[1]);
      var column = _fp2.default.toNumber(columnErrorMatches[1]);
      var lineWithError = req.rawBody.split('\n', line + 1)[line];
      var errorTitle = 'Actual error might be earlier, but here is the line:' + line;
      if (column) {
        errorTitle += ' column:' + column;
      }
      console.error(_chalk2.default.yellow(errorTitle));
      console.error(lineWithError);
      if (column) {
        console.error(' '.repeat(column - 1) + _chalk2.default.bold.red('^'));
      }
    };

    console.error(_chalk2.default.red(err.stack));
    logJsonParseError() || logXmlParseError();
  }

  div.end();
  log();
};