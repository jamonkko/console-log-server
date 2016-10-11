'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.saveRawBody = saveRawBody;
exports.logRequestStartAndEnd = logRequestStartAndEnd;
exports.detectEmptyBody = detectEmptyBody;
exports.markBodyAsXml = markBodyAsXml;
exports.handleMiddlewareErrors = handleMiddlewareErrors;

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _fp = require('lodash/fp');

var _fp2 = _interopRequireDefault(_fp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function saveRawBody(req, res, next) {
  req.rawBody = '';
  req.on('data', function (chunk) {
    req.rawBody += chunk;
  });
  next();
}

function logRequestStartAndEnd(req, res, next) {
  var pathLine = req.method + ' ' + req.originalUrl;
  var divLine = '*'.repeat(pathLine.length);
  console.log(_chalk2.default.cyan.dim(divLine));
  console.log(_chalk2.default.yellow.bold(pathLine));
  res.on('finish', function () {
    console.log(_chalk2.default.yellow(pathLine));
    console.log(_chalk2.default.cyan.dim(divLine));
    console.log();
  });
  next();
}

function detectEmptyBody(req, res, next) {
  if (req.rawBody.length === 0) {
    req.bodyType = 'empty';
  }
  next();
}

function markBodyAsXml(req, res, next) {
  if (!_fp2.default.isEmpty(req.body) && !req.bodyType) {
    req.bodyType = 'xml';
  }
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