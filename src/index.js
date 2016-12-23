/*!
 * @license
 * console-log-server v0.1.3 (https://github.com/jamonkko/console-log-server#readme)
 * Copyright 2016 Jarkko Mönkkönen <jamonkko@gmail.com>
 * Licensed under MIT
 */
import router from './router'
import _ from 'lodash/fp'
import express from 'express'
import mime from 'mime-types'

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
    requestHandler: (req, res) => {
      const negotiatedType = req.accepts(mimeExtensions)
      const defaultRespond = () => opts.resultBody ? res.send(opts.resultBody) : res.end()
      const headers = _.flow(
        _.map((h) => h.split(':', 2)),
        _.fromPairs
      )(opts.resultHeader)
      res.set(headers)
        .status(opts.resultCode)
        .format({
          json: () => opts.resultBody ? res.jsonp(JSON.parse(opts.resultBody)) : res.end(),
          [negotiatedType]: defaultRespond,
          default: defaultRespond
        })
    },
    addRouter: (app) => {
      if (opts.router) {
        app.use(opts.router)
      }
      if (_.isFunction(opts.requestHandler)) {
        app.all('*', opts.requestHandler)
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
