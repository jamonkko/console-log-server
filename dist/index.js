'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _neatJson = require('../vendor/neat-json');

var _prettyjson = require('prettyjson');

var _prettyjson2 = _interopRequireDefault(_prettyjson);

var _prettyData = require('pretty-data');

var _fp = require('lodash/fp');

var _fp2 = _interopRequireDefault(_fp);

var _expressXmlBodyparser = require('express-xml-bodyparser');

var _expressXmlBodyparser2 = _interopRequireDefault(_expressXmlBodyparser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*!
 * @license
 * console-log-server v0.0.1 (https://github.com/jamonkko/console-log-server#readme)
 * Copyright 2016 Jarkko Mönkkönen <jamonkko@gmail.com>
 * Licensed under MIT
 */
var saveRawBody = function saveRawBody(req, res, next) {
  req.rawBody = '';
  req.on('data', function (chunk) {
    req.rawBody += chunk;
  });
  next();
};

var logRequestStartAndEnd = function logRequestStartAndEnd(req, res, next) {
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
};

var handleMiddlewareErrors = function handleMiddlewareErrors(err, req, res, next) {
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
    if (!lineErrorMatches) return false;
    var line = _fp2.default.toNumber(lineErrorMatches[1]);
    var lineWithError = _fp2.default.last(req.rawBody.split('\n', line));
    console.error(_chalk2.default.yellow('Line ' + line + ' in request body (error is probably near it):'));
    console.error(lineWithError);
  };
  console.error(_chalk2.default.red('Error receiving request: ' + req.method + ' ' + req.originalUrl));
  console.error(_chalk2.default.red(err.stack));
  logJsonParseError() || logXmlParseError();
  res.status(500).send('Internal error!');
};

var unknownContentType = function unknownContentType(req) {
  return Buffer.isBuffer(req.body);
};

var create = function create() {
  var app = (0, _express2.default)();

  app.use(logRequestStartAndEnd);
  app.use(saveRawBody);
  app.use(_bodyParser2.default.json());
  app.use(_bodyParser2.default.urlencoded({ extended: false }));
  app.use((0, _expressXmlBodyparser2.default)());
  app.use(_bodyParser2.default.text());
  app.use(_bodyParser2.default.raw({ type: function type() {
      return true;
    } }));
  app.use(handleMiddlewareErrors);

  app.all('*', function (req, res) {
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

    if (_fp2.default.isEmpty(req.body)) {
      console.log(_chalk2.default.magenta('body: (empty)'));
    } else if (unknownContentType(req)) {
      console.log(_chalk2.default.magenta('body: ') + _chalk2.default.yellow('(parsed as raw string since content-type \'' + headers['content-type'] + '\' is not supported. Forgot to set it correctly?)'));
      console.log(_chalk2.default.white(req.body.toString()));
    } else if (headers['content-type'] && headers['content-type'].indexOf('json') !== -1) {
      console.log(_chalk2.default.magenta('body (json): '));
      console.log(_chalk2.default.green((0, _neatJson.neatJSON)(req.body, {
        wrap: 40,
        aligned: true,
        afterComma: 1,
        afterColon1: 1,
        afterColonN: 1
      })));
    } else if (headers['content-type'] && headers['content-type'].indexOf('xml') !== -1) {
      console.log(_chalk2.default.magenta('body (xml): '));
      console.log(_chalk2.default.green(_prettyData.pd.xml(req.rawBody)));
    } else {
      console.log(_chalk2.default.magenta('body: ') + _chalk2.default.yellow('(parsed as plain text since content-type is \'' + headers['content-type'] + '\'. Forgot to set it correctly?)'));
      console.log(_chalk2.default.white(req.body));
    }
    res.status(200).end();
  });
  server.app = app;
};

var start = function start() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var cb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {
    return true;
  };

  opts = _fp2.default.defaults({ port: 3000, hostname: 'localhost' }, opts);
  server.app.listen(opts.port, opts.hostname, function () {
    console.log('console-log-server listening on http://' + opts.hostname + ':' + opts.port);
    cb(null);
  });
};

var server = {
  app: null,
  create: create,
  start: start
};

if (!module.parent) {
  create();
  start();
}

exports.default = server;