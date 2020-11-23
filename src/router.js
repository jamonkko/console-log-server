import express from 'express'
import bodyParser from 'body-parser'
import xmlParser from 'express-xml-bodyparser'
import logRequest from './logging'
import _ from 'lodash/fp'

export default (opts) => {
  const router = express.Router()
  router.use(function saveRawBody (req, res, next) {
    req.rawBody = ''
    req.on('data', (chunk) => { req.rawBody += chunk })
    next()
  })
  router.use(bodyParser.json({
    verify: (req) => { req.bodyType = 'json' }
  }))
  router.use(bodyParser.urlencoded({
    extended: true,
    verify: (req) => { req.bodyType = 'url' }
  }))
  router.use(xmlParser())
  router.use(function markBodyAsXml (req, res, next) {
    if (!req.bodyType && !_.isEmpty(req.body)) {
      req.bodyType = 'xml'
    }
    next()
  })
  router.use(bodyParser.text({ verify: (req) => { req.bodyType = 'text' } }))
  router.use(bodyParser.raw({ type: () => true, verify: (req) => { req.bodyType = 'raw' } }))
  router.use(function detectEmptyBody (req, res, next) {
    if (req.rawBody.length === 0) {
      req.bodyType = 'empty'
    }
    next()
  })
  router.use(function logInvalidRequest (err, req, res, next) {
    if (!req.bodyType) {
      req.bodyType = 'error'
    }
    logRequest(err, req, res, opts)
    res.status(400).end()
  })
  router.use(function logOkRequest (req, res, next) {
    res.on('finish', () => {
      logRequest(null, req, res, opts)
    })
    next()
  })
  return router
}
