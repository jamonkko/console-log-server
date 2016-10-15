import express from 'express'
import bodyParser from 'body-parser'
import xmlParser from 'express-xml-bodyparser'
import { logRequest, handleMiddlewareErrors } from './log-request'
import _ from 'lodash/fp'

export default (opts) => {
  const app = express()
  app.use(function saveRawBody (req, res, next) {
    req.rawBody = ''
    req.on('data', (chunk) => { req.rawBody += chunk })
    next()
  })
  app.use(bodyParser.json({
    verify: (req) => { req.bodyType = 'json' }
  }))
  app.use(bodyParser.urlencoded({
    extended: false,
    verify: (req) => { req.bodyType = 'url' }
  }))
  app.use(xmlParser())
  app.use(function markBodyAsXml (req, res, next) {
    if (!req.bodyType && !_.isEmpty(req.body)) {
      req.bodyType = 'xml'
    }
    next()
  })
  app.use(bodyParser.text({verify: (req) => { req.bodyType = 'text' }}))
  app.use(bodyParser.raw({type: () => true, verify: (req) => { req.bodyType = 'raw' }}))
  app.use(function detectEmptyBody (req, res, next) {
    if (req.rawBody.length === 0) {
      req.bodyType = 'empty'
    }
    next()
  })
  app.use(handleMiddlewareErrors)
  app.use(logRequest)
  app.all('*', function defaultRoute (req, res) {
    res.status(200).end()
  })
  return app
}
