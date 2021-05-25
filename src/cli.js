#!/usr/bin/env node
import meow from 'meow'
import consoleLogServer from './'
import _ from 'lodash/fp'
import prependHttp from 'prepend-http'
import url from 'url'

let unknownArgs = false

const cli = meow(
  `
  Usage
    $ console-log-server

  Options
    --port, -p Port Number
    --hostname, -h Host name
    --proxy, -P Host(s) to proxy the request to using https://www.npmjs.com/package/express-http-proxy. You can provide one or more proxies using format: [<path>>]<url> [<path>>]<url>...
    --response-code, -c Response response code (ignored if proxied)
    --response-body, -b Response content (ignored if proxied)
    --response-header, -H Response header (ignored if proxied)
    --log-response, -r Log also the response. Enabled by default only for proxied requests. Logged response is fully read to a buffer which might change your api behaviour since response is not streamed directly to client, consider turning off if that is a problem.
    --no-color
    --version
    --date-format, -d Date format supported by https://www.npmjs.com/package/dateformat (default "yyyy-mm-dd'T'HH:MM:sso")
    --help
    --default-cors, -C Add "default" cors using https://www.npmjs.com/package/cors default values. By default only enabled for non-proxied responses. Turn on to enable also for proxy responses, turn off to disable completely.

  Examples

    # basic usage
    $ console-log-server -p 3000

    # customized response
    $ console-log-server -p 3000 -c 201 -b "cool type content" --response-header='Content-Type:application/cool' --response-header='key:value'

    # Log date with UTC date format instead of local with offset
    $ console-log-server -d "isoUtcDateTime"

    # Proxy the request to other host. Response will be the actual response from the proxy. 
    $ console-log-server -P http://api.example.com

    # Proxy the requests to multiple hosts based on paths.
    $ console-log-server -P "/api/1>http://api-1.example.com /api/2>http://api-2.example.com"

    # Proxy the request to path under other host. Response will be the actual response (with cors headers injected) from the proxy.
    $ console-log-server -P http://api.example.com/v1/cats -C yes

    # Turn off response logging
    $ console-log-server -r no

    # Turn on response logging for all requests
    $ console-log-server -r yes

    # Don't add default (allow all) cors headers at all
    $ console-log-server -C no
`,
  {
    alias: {
      p: 'port',
      h: 'hostname',
      c: 'response-code',
      b: 'response-body',
      H: 'response-header',
      d: 'date-format',
      P: 'proxy',
      r: 'log-response',
      C: 'default-cors'
    },
    unknown: arg => {
      unknownArgs = !_.includes(arg, ['--no-color', '--version'])
      return true
    }
  }
)

function parseProxies (proxiesArg) {
  if (!proxiesArg) return undefined

  const proxies = _.flow(
    _.trim,
    _.split(/\s+/),
    _.compact,
    _.map(proxyArg => {
      const [pathPart, proxyPart] = _.split('>', proxyArg)
      const proxyHost = proxyPart ?? pathPart
      if (!proxyHost) {
        throw Error(`Invalid proxy arguments: ${proxyArg}`)
      }
      const path =
        proxyPart === undefined
          ? '/'
          : _.startsWith('/', pathPart)
          ? pathPart
          : `/${pathPart || ''}`
      const parsedHost = url.URL
        ? new URL(prependHttp(proxyHost))
        : url.parse(prependHttp(proxyHost)) // eslint-disable-line node/no-deprecated-api
      const protocol = proxyHost.startsWith('https')
        ? 'https'
        : proxyHost.startsWith('http')
        ? 'http'
        : undefined
      return {
        path,
        host: parsedHost.host,
        protocol,
        hostPath: parsedHost.pathname
      }
    })
  )(proxiesArg)

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
  )(proxies)

  if (duplicates) {
    throw Error(`Multiple proxies for same path(s): ${duplicates}`)
  }

  return proxies
}

const parseOnOff = (value, flagName) =>
  value === undefined
    ? undefined
    : /^(?:y|yes|true|1|on)$/i.test(value)
    ? true
    : /^(?:n|no|false|0|off)$/i.test(value)
    ? false
    : console.log(`Invalid value '${value}' for ${flagName}`) || cli.showHelp(1)

if (unknownArgs) {
  cli.showHelp()
} else {
  consoleLogServer({
    ...cli.flags,
    proxy: parseProxies(cli.flags.proxy),
    logResponse: parseOnOff(cli.flags.logResponse, '--log-response'),
    defaultCors: parseOnOff(cli.flags.defaultCors, '--default-cors'),
    ignoreUncaughtErrors: true
  }).start()
}
