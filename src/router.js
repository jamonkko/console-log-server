import express from 'express'
import bodyParser from 'body-parser'
import xmlParser from 'express-xml-bodyparser'
import log from './logging'
import _ from 'lodash/fp'
import multer from 'multer'
import {is, hasBody} from 'type-is'

export default (opts) => {
  const router = express.Router()
  router.use(function logOkRequest (req, res, next) {
    res.on('finish', () => {
      log(null, req, res, opts.log)
    })
    next()
  })
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
    if (!req.bodyType && hasBody(req)) {
      req.bodyType = 'xml'
    }
    next()
  })
  router.use(function parseFormData (req, res, next) {
    if (is(req, ['multipart']) && _.isFunction(opts.requestHandler)) {
      multer({storage: multer.memoryStorage()}).any()(req, res, function (err) {
        req.bodyType = 'multi'
        if (err) return next(err)
        opts.requestHandler(req, res)
      })
    } else {
      next()
    }
  })
  router.use(bodyParser.text({verify: (req) => { req.bodyType = 'text' }}))
  router.use(bodyParser.raw({type: () => true, verify: (req) => { req.bodyType = 'raw' }}))
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
    log(err, req, res, opts.log)
    res.status(400).end()
  })
  return router
}
