/*!
 * @license
 * console-log-server v0.4.0 (https://github.com/jamonkko/console-log-server#readme)
 * Copyright 2024 Jarkko Mönkkönen <jamonkko@gmail.com>
 * Licensed under MIT
 */
import router from './router'
import _ from 'lodash/fp'
import express from 'express'
import mime from 'mime-types'
import MockDate from 'mockdate'

/**
 * @param { CLSOptions } opts
 * @return {{
 *  app: import("express-serve-static-core").Express,
 *  startAll: (callback?: (err: Error, server: import('http').Server) => void) => {
 *    server: import('http').Server[],
 *    ready: Promise<import("http").Server[]>
 *  },
 *  start: (callback?: (err: Error) => void) => {
 *    server: import('http').Server,
 *    ready: Promise<import("http").Server>
 *  }
 * }}
 */
export default function consoleLogServer (opts) {
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
      defaultRoute: (
        /** @type {RequestExt} */ req,
        /** @type {ResponseExt} */ res
      ) => {
        const headers = _.flow(
          _.map(h => h.split(':', 2)),
          _.fromPairs
        )(opts.responseHeader)

        res.set(headers).status(res.locals.responseCode || opts.responseCode)

        let contentType = res.get('content-type')
        if (!contentType) {
          res.format({
            text: () => {},
            json: () => {},
            xml: () => {},
            html: () => {},
            js: () => {},
            css: () => {},
            default: () => {}
          })
        }
        contentType = res.get('content-type')
        const ext = mime.extension(contentType)
        // Prevent express automatically converting sent response content to status code if it's a number
        const ensureNonNumeric = value =>
          _.isNumber(value) ? `${value}` : value
        switch (ext) {
          case 'json': {
            if (opts.responseBody) {
              try {
                res.jsonp(JSON.parse(opts.responseBody))
              } catch (e) {
                res.send(ensureNonNumeric(opts.responseBody))
                res.locals.defaultBodyError = e
              }
            } else {
              res.end()
            }
            break
          }
          default:
            opts.responseBody
              ? res.send(ensureNonNumeric(opts.responseBody))
              : res.end()
            break
        }
      },
      addRouter: app => {
        if (opts.router) {
          app.use(opts.router)
        }
        if (_.isFunction(opts.defaultRoute)) {
          const delayedRoute = (...args) =>
            setTimeout(opts.defaultRoute, opts.responseDelay, ...args)
          app.all('*', !opts.responseDelay ? opts.defaultRoute : delayedRoute)
        }
      }
    },
    opts
  )
  if (opts.mockDate !== undefined) {
    MockDate.set(opts.mockDate)
  } else {
    MockDate.reset()
  }
  const cnsl = opts.console
  opts.responseHeader = opts.responseHeader && _.castArray(opts.responseHeader)
  const isMultiServer = _.isArray(opts.hostname) && opts.hostname.length > 1
  opts.hostname = opts.hostname && _.castArray(opts.hostname)
  opts.port = opts.port && _.castArray(opts.port)
  opts.proxy = opts.proxy && _.castArray(opts.proxy)

  opts.proxy = _.map(proxy => {
    const { path, hostPath } = proxy
    return {
      ...proxy,
      hostPath: _.startsWith('/', hostPath)
        ? hostPath
        : hostPath === undefined
          ? '/'
          : '/' + hostPath,
      path: (path === undefined
        ? '/'
        : _.startsWith('/', path)
          ? path
          : `/${path || ''}`
      ).trim()
    }
  }, /** @type {CLSProxy[]} */ (opts.proxy))

  const duplicates = _.flow(
    _.groupBy('path'),
    _.pickBy(v => v.length > 1),
    _.mapValues(
      _.flow(
        _.map(({ path, host }) => `'${path}' -> ${host}`),
        _.join(' vs. ')
      )
    ),
    _.values,
    _.join(', ')
  )(/** @type {CLSProxy[]} */ (opts.proxy))

  if (duplicates) {
    throw Error(`Multiple proxies for same path(s): ${duplicates}`)
  }

  /**
   * @type {import("express-serve-static-core").Express}
   */
  const app = opts.app || express()

  app.use(router(opts))

  if (_.isFunction(opts.addRouter)) {
    opts.addRouter(app)
  }

  function startAll (
    /** @type {(err: Error, server: import('http').Server) => void} */ callback = () => {}
  ) {
    const servers = _.flow(
      _.zipWith(
        (host, port) => [host, port || opts.port[0]],
        /** @type {string[]} */ (opts.hostname)
      ),
      _.map(([host, port]) => {
        let resolvePromise, rejectPromise
        function onReady (err) {
          if (!err) {
            if (!opts.silentStart) {
              cnsl.log(
                `console-log-server listening on http://${host}:${
                  this.address().port
                }`
              )
            }
            resolvePromise(server)
          } else {
            err.server = server
            rejectPromise(err)
          }
          callback(err, server)
        }

        const ready = new Promise((resolve, reject) => {
          resolvePromise = resolve
          rejectPromise = reject
        })
        const server = app.listen(port, host, onReady)
        return {
          server,
          ready
        }
      })
    )(/** @type {number[]} */ (opts.port))

    if (opts.ignoreUncaughtErrors) {
      process.on('uncaughtException', function (err) {
        cnsl.log(
          'Unhandled error. Set ignoreUncaughtErrors to pass these through'
        )
        cnsl.log(err)
      })
    }
    return {
      server: _.map(s => s.server, servers),
      ready: Promise.all(_.map(s => s.ready, servers))
    }
  }

  return {
    app,
    startAll,
    start: (callback = () => {}) => {
      if (isMultiServer) {
        throw new Error(
          'Call startAll instead of start when providing multiple hostnames to listen'
        )
      }
      const res = startAll(callback)
      return {
        server: res.server[0],
        ready: res.ready.then(servers => servers[0])
      }
    }
  }
}

if (!module.parent) {
  require('core-js')
  consoleLogServer({ ignoreUncaughtErrors: true })
    .start()
    .ready.then(() => {})
}
