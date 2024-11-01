#!/usr/bin/env node
import meow from 'meow'
import consoleLogServer from './'
import _ from 'lodash/fp'
import prependHttp from 'prepend-http'
import url from 'url'

export default function run (opts = {}) {
  let unknownArgs = false

  const cli = meow(
    {
      help: `
    Usage
      $ console-log-server

    Options
      --port, -p Port Number
      --hostname, -h Host name. You can provide multiple hostname flags (with optional matching port flags) to listen many hostnames. 
      --proxy, -P Host(s) to proxy the request to using https://www.npmjs.com/package/express-http-proxy. Syntax: [<path>>]<url>. You can provide different proxies for separate paths.
      --response-code, -c Response response code (ignored if proxied)
      --response-body, -b Response content (ignored if proxied)
      --response-header, -H Response header (ignored if proxied)
      --log-response, -r Log also the response. Enabled by default only for proxied requests. Logged response is fully read to a buffer which might change your api behaviour since response is not streamed directly to client, consider turning off if that is a problem.
      --no-color
      --version
      --date-format, -d Date format supported by https://www.npmjs.com/package/dateformat (default "yyyy-mm-dd'T'HH:MM:sso")
      --help
      --default-cors, -C Add "default" cors using https://www.npmjs.com/package/cors default values. By default only enabled for non-proxied responses. Turn on to enable also for proxy responses, turn off to disable completely.
      --silent-start, Do not log "listening", proxy mapping or any other status on start. Only requests and responses.
      --mock-date, Use mocked date value for value of "now". https://www.npmjs.com/package/mockdate
      --raw-body-limit, Max size of raw body supported. Number of bytes or string parseable by bytes library. Default is '5Mb'.
      --indent-response, On by default. Indents response with console.group() when using node >= v8.5.0
      --sort-fields, Off by default. Pretty print headers, query parameters and url-form body fields in sorted order. Does not apply to json bodies.
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
      $ console-log-server --proxy="/api/1>http://api-1.example.com" --proxy="/api/2>http://api-2.example.com"

      # Proxy the request to path under other host. Response will be the actual response (with cors headers injected) from the proxy.
      $ console-log-server -P http://api.example.com/v1/cats -C yes

      # Turn off response logging
      $ console-log-server -r no

      # Receive and log raw bodies up to 10Mb
      $ console-log-server -l "10Mb"

      # Turn on response logging for all requests
      $ console-log-server -r yes

      # Don't add default (allow all) cors headers at all
      $ console-log-server -C no

      # Start server to your local IP and localhost. Might be useful when debugging devices connected to your own machine. Ports can be given for each hostname with --port flag(s).
      $ console-log-server -h localhost -h 192.168.0.2 
  `,
      ...(opts.meow || {})
    },
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
        C: 'default-cors',
        S: 'silent-start',
        D: 'mock-date',
        l: 'raw-body-limit',
        i: 'indent-response',
        s: 'sort-fields'
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
      _.castArray,
      _.map(_.trim),
      _.compact,
      _.map(proxyArg => {
        const [pathPart, proxyPart] = _.split('>', proxyArg)
        const proxyHost = proxyPart ?? pathPart
        if (!proxyHost) {
          throw Error(`Invalid proxy arguments: ${proxyArg}`)
        }

        const parsedHost = url.URL
          ? new URL(prependHttp(proxyHost))
          : url.parse(prependHttp(proxyHost)) // eslint-disable-line
        const protocol = _.startsWith('https', proxyHost)
          ? 'https'
          : _.startsWith('http', proxyHost)
          ? 'http'
          : undefined
        return {
          path: proxyPart === undefined ? undefined : pathPart,
          host: parsedHost.host,
          protocol,
          hostPath: parsedHost.pathname
        }
      })
    )(proxiesArg)

    return proxies
  }

  function showMessageAndExit (message) {
    console.log(message)
    cli.showHelp(1)
    return undefined
  }

  const parseOnOff = (value, flagName) =>
    value === undefined
      ? undefined
      : /^(?:y|yes|true|1|on)$/i.test(value)
      ? true
      : /^(?:n|no|false|0|off)$/i.test(value)
      ? false
      : showMessageAndExit(`Invalid value '${value}' for ${flagName}`)

  if (unknownArgs) {
    cli.showHelp(1)
  } else {
    return consoleLogServer({
      ...cli.flags,
      proxy: parseProxies(cli.flags.proxy),
      logResponse: parseOnOff(cli.flags.logResponse, '--log-response'),
      defaultCors: parseOnOff(cli.flags.defaultCors, '--default-cors'),
      silentStart: parseOnOff(cli.flags.silentStart, '--silent-start'),
      indentResponse: parseOnOff(cli.flags.indentResponse, '--indent-response'),
      sortFields: parseOnOff(cli.flags.sortFields, '--sort-fields'),
      responseHeader: cli.flags.responseHeader,
      hostname: cli.flags.hostname,
      ignoreUncaughtErrors: true,
      ...(opts.cls || {})
    }).startAll()
  }
}

if (!module.parent) {
  require('core-js')
  run().ready.then(() => {})
}
