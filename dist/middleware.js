'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logRequest = logRequest;
exports.handleMiddlewareErrors = handleMiddlewareErrors;

var _prettyjson = require('prettyjson');

var _prettyjson2 = _interopRequireDefault(_prettyjson);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _fp = require('lodash/fp');

var _fp2 = _interopRequireDefault(_fp);

var _neatJson = require('../vendor/neat-json');

var _prettyData = require('pretty-data');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function logRequest(req, res, next) {
  res.on('finish', function () {
    var pathLine = req.method + ' ' + req.originalUrl;
    var divLine = '*'.repeat(pathLine.length);
    console.log(_chalk2.default.cyan.dim(divLine));
    console.log(_chalk2.default.yellow.bold(pathLine));
    console.log(req.bodyType);
    var renderParams = function renderParams(obj) {
      return _prettyjson2.default.render(obj, { defaultIndentation: 2 }, 2);
    };
    var headers = req.headers;

    console.log(_chalk2.default.magenta('headers' + ':'));
    console.log(renderParams(headers));

    if (_fp2.default.isEmpty(req.query)) {
      console.log(_chalk2.default.magenta('query: (empty)'));
    } else {
      console.log(_chalk2.default.magenta('query:'));
      console.log(renderParams(req.query));
    }

    switch (req.bodyType) {
      case 'empty':
        console.log(_chalk2.default.magenta('body: (empty)'));
        break;
      case 'raw':
        console.log(_chalk2.default.magenta('body: ') + _chalk2.default.yellow('(parsed as raw string by console-log-server since content-type is \'' + headers['content-type'] + '\'. Forgot to set it correctly?)'));
        console.log(_chalk2.default.white(req.body.toString()));
        break;
      case 'json':
        console.log(_chalk2.default.magenta('body (json): '));
        console.log(_chalk2.default.green((0, _neatJson.neatJSON)(req.body, {
          wrap: 40,
          aligned: true,
          afterComma: 1,
          afterColon1: 1,
          afterColonN: 1
        })));
        break;
      case 'xml':
        console.log(_chalk2.default.magenta('body (xml): '));
        console.log(_chalk2.default.green(_prettyData.pd.xml(req.rawBody)));
        break;
      case 'text':
        console.log(_chalk2.default.magenta('body: ') + _chalk2.default.yellow('(parsed as plain text since content-type is \'' + headers['content-type'] + '\'. Forgot to set it correctly?)'));
        console.log(_chalk2.default.white(req.body));
        break;
      default:
        throw new Error('Internal Error! bodyType not set!');
    }
    console.log(_chalk2.default.yellow(pathLine));
    console.log(_chalk2.default.cyan.dim(divLine));
    console.log();
  });
  next();
}

function handleMiddlewareErrors(err, req, res, next) {
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
  console.error(_chalk2.default.red('Error receiving request: ' + req.method + ' ' + req.originalUrl));
  console.error(_chalk2.default.red(err.stack));
  logJsonParseError() || logXmlParseError();
  res.status(400).end();
}