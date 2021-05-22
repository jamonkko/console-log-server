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
import cors from 'cors'

export default function consoleLogServer (opts = {}) {
  const mimeExtensions = _.flow(
    _.values,
    _.flatten,
    _.without(['json'])
  )(mime.extensions)

  opts = _.defaults({
    port: 3000,
    hostname: 'localhost',
    responseCode: 200,
    responseBody: null,
    responseHeader: [],
    console: console,
    dateFormat: "yyyy-mm-dd'T'HH:MM:sso",
    defaultRoute: (req, res) => {
      const negotiatedType = req.accepts(mimeExtensions)
      const defaultHandler = () => opts.responseBody ? res.send(opts.responseBody) : res.end()
      const headers = _.flow(
        _.map((h) => h.split(':', 2)),
        _.fromPairs
      )(opts.responseHeader)
      res.set(headers)
        .status(opts.responseCode)
        .format({
          json: () => opts.responseBody ? res.jsonp(JSON.parse(opts.responseBody)) : res.end(),
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

  opts.responseHeader = opts.responseHeader && _.castArray(opts.responseHeader)

  const app = opts.app || express()
  let reqCounter = 0
  app.use(function addLocals (req, res, next) {
    req.locals ||= {}
    req.locals.id = ++reqCounter
    next()
  })
  app.use(cors())
  app.use(router(opts))

  if (_.isFunction(opts.addRouter)) {
    opts.addRouter(app)
  }
  return {
    app,
    start: (cb = () => true) => {
      app.listen(opts.port, opts.hostname, () => {
        opts.console.log(`console-log-server listening on http://${opts.hostname}:${opts.port}`)
        cb(null)
      })
    }
  }
}

if (!module.parent) {
  consoleLogServer().start()
}
