import express from 'express'
import bodyParser from 'body-parser'
import xmlParser from 'express-xml-bodyparser'
import { logDefaultBodyError, logRequest, logResponse } from './logging'
import proxy from 'express-http-proxy'
import _ from 'lodash/fp'
import cors from 'cors'
import { Promise } from 'es6-promise'

/**
 * @param {CLSOptions} opts
 */
export default opts => {
  const cnsl = opts.console
  const router = express.Router()

  let reqCounter = 0
  router.use(function addLocals (/** @type {RequestExt} */ req, res, next) {
    req.locals || (req.locals = {})
    const requestId =
      req.header('X-Request-ID') || req.header('X-Correlation-ID')
    req.locals.id = `${++reqCounter}` + (requestId ? `:${requestId}` : '')
    next()
  })

  if (opts.mockDate) {
    // For some reason Date cannot be mocked in Node 15/16, so just override the date header when using static date
    router.use(function mockDate (/** @type {RequestExt} */ req, res, next) {
      res.set('date', new Date().toUTCString())
      next()
    })
  }

  router.use(function saveRawBody (/** @type {RequestExt} */ req, res, next) {
    req.locals.rawBody = new Promise(resolve => {
      req.once('end', () => {
        resolve(req.locals.rawBodyBuffer)
      })
    })
    req.on('data', chunk => {
      if (req.locals.rawBodyBuffer === undefined) {
        req.locals.rawBodyBuffer = ''
      }
      req.locals.rawBodyBuffer += chunk
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

  router.use(function handleInvalidRequest (
    err,
    /** @type {RequestExt} */ req,
    /** @type {ResponseExt} */ res,
    next
  ) {
    if (
      req.locals.rawBodyBuffer?.length > 0 &&
      _.isEmpty(req.body) &&
      (req.locals.bodyType !== 'json' ||
        req.locals.rawBodyBuffer.replace(/\s/g, '') !== '{}')
    ) {
      req.locals.bodyType = 'error'
    }
    req.locals.bodyError = err
    res.locals.responseCode = 400
    next()
  })

  router.use(function logRequestAndResponse (
    /** @type {RequestExt} */ req,
    res,
    next
  ) {
    res.on('finish', () => {
      if (
        req.locals.rawBodyBuffer === undefined ||
        req.locals.rawBodyBuffer.length === 0
      ) {
        req.locals.bodyType || (req.locals.bodyType = 'empty')
      }
      logRequest(req, res, opts)

      if (opts.logResponse !== true && !req.locals?.proxyUrl) {
        logDefaultBodyError(req, res, opts)
      }

      if (
        opts.logResponse === true ||
        (!!req.locals?.proxyUrl && opts.logResponse !== false)
      ) {
        if (opts.indentResponse !== false && _.isFunction(cnsl.group)) {
          cnsl.group()
        }
        logResponse(req, res, opts)
        if (opts.indentResponse !== false && _.isFunction(cnsl.groupEnd)) {
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
    if (!opts.silentStart) {
      cnsl.log('Using proxies:')
    }
    _.each(({ path, host, hostPath, protocol }) => {
      const https =
        protocol === 'https' ? true : protocol === 'http' ? false : undefined
      const protocolPrefix = protocol ? `${protocol}://` : ''
      if (!opts.silentStart) {
        cnsl.log(`  '${path}' -> ${protocolPrefix}${host}${hostPath || ''}`)
      }
      router.use(
        path,
        proxy(host, {
          https,
          parseReqBody: false,
          proxyReqPathResolver: function (/** @type {RequestExt} */ req) {
            const resolvedPath = hostPath === '/' ? req.url : hostPath + req.url
            req.locals.proxyUrl = `${protocolPrefix}${host}${resolvedPath}`
            return resolvedPath
          },
          proxyReqBodyDecorator: function (
            bodyContent,
            /** @type {RequestExt} */ srcReq
          ) {
            return srcReq.locals.rawBody
          },
          userResDecorator:
            opts.logResponse !== false
              ? function (proxyRes, proxyResData, userReq, userRes) {
                  userRes.locals.body = proxyResData.toString('utf8')
                  return proxyResData
                }
              : undefined,
          proxyErrorHandler: function (err, res, next) {
            const msg = { message: err.toString() }
            res.locals.body = JSON.stringify(msg)
            res.status(500).json(msg)
          }
        })
      )
    }, /** @type {CLSProxy[]} */ (opts.proxy))
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

        let chunks

        const appendBody = chunk => {
          if (chunks === undefined) {
            chunks = []
          }
          if (_.isFunction(Buffer.from)) {
            chunks.push(Buffer.from(chunk))
          } else {
            chunks.push(new Buffer(chunk)) // eslint-disable-line node/no-deprecated-api
          }
        }

        res.write = (...restArgs) => {
          appendBody(restArgs[0])
          return oldWrite.apply(res, restArgs)
        }

        res.end = (...restArgs) => {
          if (restArgs[0] && !_.isFunction(restArgs[0])) {
            appendBody(restArgs[0])
          }
          if (chunks !== undefined) {
            const body = Buffer.concat(chunks).toString('utf8')
            res.locals.body = body
          }
          return oldEnd.apply(res, restArgs)
        }
      }
      next()
    })
  }

  return router
}
