import express from 'express'
import bodyParser from 'body-parser'
import xmlParser from 'express-xml-bodyparser'
import { logRequest, logResponse } from './logging'
import proxy from 'express-http-proxy'
import _ from 'lodash/fp'
import cors from 'cors'

export default opts => {
  const cnsl = opts.console
  const router = express.Router()

  let reqCounter = 0
  router.use(function addLocals (/** @type {RequestExt} */ req, res, next) {
    req.locals ||= {}
    const requestId =
      req.header('X-Request-ID') || req.header('X-Correlation-ID')
    req.locals.id = `${++reqCounter}` + (requestId ? `:${requestId}` : '')
    next()
  })

  router.use(function saveRawBody (/** @type {RequestExt} */ req, res, next) {
    req.locals.rawBody = ''
    req.on('data', chunk => {
      req.locals.rawBody += chunk
    })
    next()
  })
  router.use(
    bodyParser.json({
      verify: (/** @type {RequestExt} */ req) => {
        req.locals.bodyType = 'json'
      }
    })
  )
  router.use(
    bodyParser.urlencoded({
      extended: true,
      verify: (/** @type {RequestExt} */ req) => {
        req.locals.bodyType = 'url'
      }
    })
  )
  router.use(xmlParser())
  router.use(function markBodyAsXml (/** @type {RequestExt} */ req, res, next) {
    if (!req.locals.bodyType && !_.isEmpty(req.body)) {
      req.locals.bodyType = 'xml'
    }
    next()
  })
  router.use(
    bodyParser.text({
      verify: (/** @type {RequestExt} */ req) => {
        req.locals.bodyType = 'text'
      }
    })
  )
  router.use(
    bodyParser.raw({
      type: () => true,
      verify: (/** @type {RequestExt} */ req) => {
        req.locals.bodyType = 'raw'
      }
    })
  )
  router.use(
    /** @param {RequestExt} req */ function detectEmptyBody (req, res, next) {
      if (req.locals.rawBody.length === 0) {
        req.locals.bodyType = 'empty'
      }
      next()
    }
  )
  router.use(function logInvalidRequest (
    err,
    /** @type {RequestExt} */ req,
    res,
    next
  ) {
    if (!req.locals.bodyType) {
      req.locals.bodyType = 'error'
    }
    logRequest(err, req, res, opts)
    res.status(400).end()
  })

  router.use(function logOkRequest (/** @type {RequestExt} */ req, res, next) {
    res.on('finish', () => {
      logRequest(null, req, res, opts)
      if (
        opts.logResponse === true ||
        (!!req.locals?.proxyUrl && opts.logResponse !== false)
      ) {
        if (_.isFunction(cnsl.group)) {
          cnsl.group()
        }
        logResponse(null, req, res, opts)
        if (_.isFunction(cnsl.groupEnd)) {
          cnsl.groupEnd()
        }
      }
    })
    next()
  })

  if (opts.defaultCors === true) {
    router.use(cors())
  }

  if (!_.isEmpty(opts.proxy)) {
    cnsl.log('Using proxies:')
    _.each(({ path, host, hostPath, protocol }) => {
      hostPath = _.startsWith('/', hostPath)
        ? hostPath
        : hostPath === undefined
        ? '/'
        : '/' + hostPath
      const https =
        protocol === 'https' ? true : protocol === 'http' ? false : undefined
      const protocolPrefix = protocol ? `${protocol}://` : ''
      cnsl.log(`  '${path}' -> ${protocolPrefix}${host}${hostPath || ''}`)
      router.use(
        path,
        proxy(host, {
          https,
          proxyReqPathResolver: function (/** @type {RequestExt} */ req) {
            const resolvedPath = hostPath === '/' ? req.url : hostPath + req.url
            req.locals.proxyUrl = `${protocolPrefix}${host}${resolvedPath}`
            return resolvedPath
          },
          userResDecorator:
            opts.logResponse !== false
              ? function (proxyRes, proxyResData, userReq, userRes) {
                  userRes.locals.body = proxyResData.toString('utf8')
                  return proxyResData
                }
              : undefined,
          proxyErrorHandler: function (err, res, next) {
            res.status(500).json({ message: err.toString() })
            res.locals.body = { message: err.toString() }
          }
        })
      )
    }, opts.proxy)
  }

  if (opts.defaultCors === undefined) {
    router.use(cors())
  }

  if (
    opts.logResponse === true ||
    (!_.isEmpty(opts.proxy) && opts.logResponse !== false)
  ) {
    router.use(function captureResponse (
      /** @type {RequestExt} */ req,
      res,
      next
    ) {
      if (opts.logResponse === true) {
        const oldWrite = res.write
        const oldEnd = res.end

        const chunks = []

        res.write = (...restArgs) => {
          chunks.push(Buffer.from(restArgs[0]))
          return oldWrite.apply(res, restArgs)
        }

        res.end = (...restArgs) => {
          if (restArgs[0]) {
            chunks.push(Buffer.from(restArgs[0]))
          }
          const body = Buffer.concat(chunks).toString('utf8')
          res.locals.body = body
          return oldEnd.apply(res, restArgs)
        }
      }
      next()
    })
  }

  return router
}
