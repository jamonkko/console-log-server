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
 *  start: (callback?: () => void) => import('http').Server;
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
      const server = app.listen(opts.port, opts.hostname, () => {
        cnsl.log(
          `console-log-server listening on http://${opts.hostname}:${opts.port}`
        )
        callback()
      })
      if (opts.ignoreUncaughtErrors) {
        process.on('uncaughtException', function (err) {
          cnsl.log(
            'Unhandled error. Set ignoreUncaughtErrors to pass these through'
          )
          cnsl.log(err)
        })
      }
      return server
    }
  }
}

if (!module.parent) {
  consoleLogServer({ ignoreUncaughtErrors: true }).start()
}
