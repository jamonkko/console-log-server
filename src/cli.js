#!/usr/bin/env node
import meow from 'meow'
import consoleLogServer from './'
import _ from 'lodash/fp'

let unknownArgs = false

const cli = meow(`
  Usage
    $ console-log-server

  Options
    --port, -p Port Number
    --hostname, -h Host name
    --proxy, -P Host(s) to proxy the request to using https://www.npmjs.com/package/express-http-proxy. You can provide one or more proxies using format: [<path>>]<url> [<path>>]<url>...
    --result-code, -c Response result code (ignored if proxied)
    --result-body, -b Response content (ignored if proxied)
    --result-header, -H Response header (ignored if proxied)
    --no-color
    --version
    --date-format, -d Date format supported by https://www.npmjs.com/package/dateformat
    --help

  Examples

    # basic usage
    $ console-log-server -p 3000

    # customized response
    $ console-log-server -p 3000 -c 201 -b "cool type content" --result-header='Content-Type:application/cool' --result-header='key:value'

    # Log date with UTC date format instead of local with offset
    $ console-log-server -d "isoUtcDateTime"

    # Proxy the request to other host. Result will be the actual result from the proxy.
    $ console-log-server -P http://api.example.com

    # Proxy the requests to multiple hosts based on paths.
    $ console-log-server -P "/api/1>http://api-1.example.com /api/2>http://api-2.example.com"
`, {
  alias: {
    p: 'port',
    h: 'hostname',
    c: 'result-code',
    b: 'result-body',
    H: 'result-header',
    d: 'date-format',
    P: 'proxy'
  },
  unknown: (arg) => {
    unknownArgs = !_.includes(arg, ['--no-color', '--version'])
    return true
  }
})

if (unknownArgs) {
  cli.showHelp()
} else {
  consoleLogServer(cli.flags).start()
}
