/*!
 * @license
 * console-log-server v0.0.2 (https://github.com/jamonkko/console-log-server#readme)
 * Copyright 2016 Jarkko Mönkkönen <jamonkko@gmail.com>
 * Licensed under MIT
 */
import router from './router'
import _ from 'lodash/fp'
import express from 'express'

export default function consoleLogServer (opts = {}) {
  opts = _.defaults({
    port: 3000,
    hostname: 'localhost',
    resultCode: 200,
    log: (...args) => {
      console.log(...args)
    },
    defaultRoute: (req, res) => res.status(opts.resultCode).end(),
    addRouter: (app) => {
      if (opts.router) {
        app.use(opts.router)
      }
      if (_.isFunction(opts.defaultRoute)) {
        app.all('*', opts.defaultRoute)
      }
    }
  }, opts)
  const app = opts.app || express()
  app.use(router(opts))
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
