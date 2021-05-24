import express from 'express'
import bodyParser from 'body-parser'
import xmlParser from 'express-xml-bodyparser'
import { logRequest, logResponse } from './logging'
import proxy from 'express-http-proxy'
import _ from 'lodash/fp'
import cors from 'cors'

export default opts => {
  const router = express.Router()

  let reqCounter = 0
  router.use(function addLocals (req, res, next) {
    req.locals ||= {}
    req.locals.id = ++reqCounter
    next()
  })

  router.use(cors())

  router.use(function saveRawBody (req, res, next) {
    req.rawBody = ''
    req.on('data', chunk => {
      req.rawBody += chunk
    })
    next()
  })
  router.use(
    bodyParser.json({
      verify: req => {
        req.bodyType = 'json'
      }
    })
  )
  router.use(
    bodyParser.urlencoded({
      extended: true,
      verify: req => {
        req.bodyType = 'url'
      }
    })
  )
  router.use(xmlParser())
  router.use(function markBodyAsXml (req, res, next) {
    if (!req.bodyType && !_.isEmpty(req.body)) {
      req.bodyType = 'xml'
    }
    next()
  })
  router.use(
    bodyParser.text({
      verify: req => {
        req.bodyType = 'text'
      }
    })
  )
  router.use(
    bodyParser.raw({
      type: () => true,
      verify: req => {
        req.bodyType = 'raw'
      }
    })
  )
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
      if (
        opts.logResponse === true ||
        (!!req.locals?.proxyUrl && opts.logResponse !== false)
      ) {
        opts.console.group()
        logResponse(null, req, res, opts)
        console.groupEnd()
      }
    })
    next()
  })

  if (!_.isEmpty(opts.proxy)) {
    opts.console.log('Using proxies:')
    _.each(({ path, host, hostPath, protocol }) => {
      hostPath = _.startsWith('/', hostPath)
        ? hostPath
        : hostPath === undefined
        ? '/'
        : '/' + hostPath
      const https =
        protocol === 'https' ? true : protocol === 'http' ? false : undefined
      const protocolPrefix = protocol ? `${protocol}://` : ''
      opts.console.log(
        `  '${path}' -> ${protocolPrefix}${host}${hostPath || ''}`
      )
      router.use(
        path,
        proxy(host, {
          // parseReqBody: true,
          // reqAsBuffer: true,
          https,
          // filter: function addProxyUrl (req) {
          //   const resolvedPath = hostPath === '/' ? req.url : hostPath + req.url
          //   console.log('set proxy url filter')
          //   req.locals.proxyUrl = `${protocolPrefix}${host}${resolvedPath}`
          //   return true
          // },
          proxyReqPathResolver: function (req) {
            const resolvedPath = hostPath === '/' ? req.url : hostPath + req.url
            req.locals.proxyUrl = `${protocolPrefix}${host}${resolvedPath}`
            return resolvedPath
          },
          userResDecorator: function (
            proxyRes,
            proxyResData,
            userReq,
            userRes
          ) {
            userRes.locals.body = proxyResData.toString('utf8')
            return proxyResData
          },
          proxyErrorHandler: function (err, res, next) {
            res.status(500).json({ message: err.toString() })
            res.locals.body = { message: err.toString() }
          }
          // proxyReqOptDecorator: function (proxyReqOpts, req) {
          //   const resolvedPath = hostPath === '/' ? req.url : hostPath + req.url
          //   console.log('set proxy url resolver decorator')
          //   req.locals.proxyUrl = `${protocolPrefix}${host}${resolvedPath}`
          //   return proxyReqOpts
          // }
        })
      )
    }, opts.proxy)
  }

  if (
    opts.logResponse === true ||
    (!_.isEmpty(opts.proxy) && opts.logResponse !== false)
  ) {
    router.use(function captureResponse (req, res, next) {
      if (opts.logResponse === true) {
        const oldWrite = res.write
        const oldEnd = res.end

        const chunks = []

        res.write = (...restArgs) => {
          chunks.push(Buffer.from(restArgs[0]))
          oldWrite.apply(res, restArgs)
        }

        res.end = (...restArgs) => {
          if (restArgs[0]) {
            chunks.push(Buffer.from(restArgs[0]))
          }
          const body = Buffer.concat(chunks).toString('utf8')
          res.locals.body = body
          oldEnd.apply(res, restArgs)
        }
      }
      next()
    })
  }

  return router
}
