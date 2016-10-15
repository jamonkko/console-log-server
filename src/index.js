/*!
 * @license
 * console-log-server v0.0.2 (https://github.com/jamonkko/console-log-server#readme)
 * Copyright 2016 Jarkko Mönkkönen <jamonkko@gmail.com>
 * Licensed under MIT
 */
import application from './application'
import _ from 'lodash/fp'

export default function consoleLogServer (opts = {}) {
  opts = _.defaults({
    port: 3000,
    hostname: 'localhost',
    defaultRoute: (req, res) => res.status(200).end(),
    useRoutes: (app) => {
      if (opts.router) {
        app.use(opts.router)
      }
      if (_.isFunction(opts.defaultRoute)) {
        app.all('*', opts.defaultRoute)
      }
    }
  }, opts)
  const app = application(opts)
  if (_.isFunction(opts.useRoutes)) {
    opts.useRoutes(app)
  }
  return {
    app,
    start: (cb = () => true) => {
      app.listen(opts.port, opts.hostname, () => {
        console.log(`console-log-server listening on http://${opts.hostname}:${opts.port}`)
        cb(null)
      })
    }
  }
}

if (!module.parent) {
  consoleLogServer().start()
}
