/*!
 * @license
 * console-log-server v0.2.1 (https://github.com/jamonkko/console-log-server#readme)
 * Copyright 2020 Jarkko Mönkkönen <jamonkko@gmail.com>
 * Licensed under MIT
 */
import router from './router'
import _ from 'lodash/fp'
import express from 'express'
import mime from 'mime-types'
import cors from 'cors'
import proxy from 'express-http-proxy'

export default function consoleLogServer (opts = {}) {
  const mimeExtensions = _.flow(
    _.values,
    _.flatten,
    _.without(['json'])
  )(mime.extensions)

  opts = _.defaults({
    port: 3000,
    hostname: 'localhost',
    resultCode: 200,
    resultBody: null,
    resultHeader: [],
    log: (...args) => {
      console.log(...args)
    },
    defaultRoute: (req, res) => {
      const negotiatedType = req.accepts(mimeExtensions)
      const defaultHandler = () => opts.resultBody ? res.send(opts.resultBody) : res.end()
      const headers = _.flow(
        _.map((h) => h.split(':', 2)),
        _.fromPairs
      )(opts.resultHeader)
      res.set(headers)
        .status(opts.resultCode)
        .format({
          json: () => opts.resultBody ? res.jsonp(JSON.parse(opts.resultBody)) : res.end(),
          [negotiatedType]: defaultHandler,
          default: defaultHandler
        })
    },
    addRouter: (app) => {
      if (opts.router) {
        app.use(opts.router)
      }
      if (_.isFunction(opts.defaultRoute)) {
        app.all('*', opts.defaultRoute)
      }
    }
  }, opts)

  opts.resultHeader = opts.resultHeader && _.castArray(opts.resultHeader)

  const app = opts.app || express()
  app.use(cors())
  app.use(router(opts))
  if (opts.proxy) {
    opts.log('Using proxies:')
    _.flow(
      _.trim,
      _.split(' '),
      _.each((proxyArg) => {
        const [pathPart, proxyPart] = _.split('>', proxyArg)
        const proxyHost = proxyPart ?? pathPart
        const path = proxyPart === undefined ? '/' : (_.startsWith(pathPart, '/') ? pathPart : `/${pathPart || ''}`)
        if (proxyHost) {
          opts.log(`  '${path}' -> ${proxyHost}`)
          app.use(path, proxy(proxyHost, {
            parseReqBody: true,
            reqAsBuffer: true,
            proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
              srcReq.__CLS_PROXY_URL__ = `${proxyHost}${srcReq.originalUrl}`
              return proxyReqOpts
            }
          }))
        } else {
          throw Error(`Invalid proxy arguments: ${proxyArg}`)
        }
      })
    )(opts.proxy)
  }

  if (_.isFunction(opts.addRouter)) {
    opts.addRouter(app)
  }
  return {
    app,
    start: (cb = () => true) => {
      app.listen(opts.port, opts.hostname, () => {
        opts.log(`console-log-server listening on http://${opts.hostname}:${opts.port}`)
        cb(null)
      })
    }
  }
}

if (!module.parent) {
  consoleLogServer().start()
}
