'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _expressXmlBodyparser = require('express-xml-bodyparser');

var _expressXmlBodyparser2 = _interopRequireDefault(_expressXmlBodyparser);

var _prettyjson = require('prettyjson');

var _prettyjson2 = _interopRequireDefault(_prettyjson);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _fp = require('lodash/fp');

var _fp2 = _interopRequireDefault(_fp);

var _neatJson = require('../vendor/neat-json');

var _prettyData = require('pretty-data');

var _middleware = require('./middleware');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultRoute = function defaultRoute(req, res) {
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
  res.status(200).end();
};

exports.default = function (opts) {
  var app = (0, _express2.default)();
  app.use(_middleware.logRequestStartAndEnd);
  app.use(_middleware.saveRawBody);
  app.use(_bodyParser2.default.json({ verify: function verify(req) {
      req.bodyType = 'json';
    } }));
  app.use(_bodyParser2.default.urlencoded({ extended: false }));
  app.use((0, _expressXmlBodyparser2.default)());
  app.use(_middleware.markBodyAsXml);
  app.use(_bodyParser2.default.text({ verify: function verify(req) {
      req.bodyType = 'text';
    } }));
  app.use(_bodyParser2.default.raw({ type: function type() {
      return true;
    }, verify: function verify(req) {
      req.bodyType = 'raw';
    } }));
  app.use(_middleware.detectEmptyBody);
  app.use(_middleware.handleMiddlewareErrors);
  app.all('*', defaultRoute);
  return app;
};