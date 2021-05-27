/*!
 * @license
 * console-log-server v0.2.1 (https://github.com/jamonkko/console-log-server#readme)
 * Copyright 2021 Jarkko Mönkkönen <jamonkko@gmail.com>
 * Licensed under MIT
 */
import router from './router'
import _ from 'lodash/fp'
import express from 'express'
import mime from 'mime-types'

/**
 * @param { CLSOptions } opts
 * @return {{
 *  app: import("express-serve-static-core").Express;
 *  start: (callback?: () => void) => import('http').Server | import('http').Server[];
 * }}
 */
export default function consoleLogServer (opts) {
  const mimeExtensions = _.flow(
    _.values,
    _.flatten,
    _.without(['json'])
  )(mime.extensions)

  opts = _.defaults(
    {
      port: 3000,
      hostname: 'localhost',
      responseCode: 200,
      responseBody: undefined,
      responseHeader: [],
      console: console,
      dateFormat: "yyyy-mm-dd'T'HH:MM:sso",
      ignoreUncaughtErrors: false,
      defaultRoute: (req, res) => {
        const negotiatedType = req.accepts(mimeExtensions)
        const defaultHandler = () =>
          opts.responseBody ? res.send(opts.responseBody) : res.end()
        const headers = _.flow(
          _.map(h => h.split(':', 2)),
          _.fromPairs
        )(opts.responseHeader)
        res
          .set(headers)
          .status(opts.responseCode)
          .format({
            json: () =>
              opts.responseBody
                ? res.jsonp(JSON.parse(opts.responseBody))
                : res.end(),
            [negotiatedType]: defaultHandler,
            default: defaultHandler
          })
      },
      addRouter: app => {
        if (opts.router) {
          app.use(opts.router)
        }
        if (_.isFunction(opts.defaultRoute)) {
          app.all('*', opts.defaultRoute)
        }
      }
    },
    opts
  )
  const cnsl = opts.console
  opts.responseHeader = opts.responseHeader && _.castArray(opts.responseHeader)
  const isMultiServer = _.isArray(opts.hostname)
  opts.hostname = opts.hostname && _.castArray(opts.hostname)
  opts.port = opts.port && _.castArray(opts.port)
  opts.proxy = opts.proxy && _.castArray(opts.proxy)

  /**
   * @type {import("express-serve-static-core").Express}
   */
  const app = opts.app || express()

  app.use(router(opts))

  if (_.isFunction(opts.addRouter)) {
    opts.addRouter(app)
  }
  return {
    app,
    start: (callback = function () {}) => {
      const servers = _.flow(
        _.zipWith(
          (host, port) => [host, port || opts.port[0]],
          /** @type {string[]} */ (opts.hostname)
        ),
        _.map(([host, port]) =>
          app.listen(port, host, () => {
            cnsl.log(`console-log-server listening on http://${host}:${port}`)
            callback()
          })
        )
      )(/** @type {number[]} */ (opts.port))

      if (opts.ignoreUncaughtErrors) {
        process.on('uncaughtException', function (err) {
          cnsl.log(
            'Unhandled error. Set ignoreUncaughtErrors to pass these through'
          )
          cnsl.log(err)
        })
      }
      if (isMultiServer) {
        return servers
      } else {
        return servers[0]
      }
    }
  }
}

if (!module.parent) {
  consoleLogServer({ ignoreUncaughtErrors: true }).start()
}
