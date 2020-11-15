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
    --result-code, -c Response result code
    --result-body, -b Response content
    --result-header, -H Response header
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
`, {
  alias: {
    p: 'port',
    h: 'hostname',
    c: 'result-code',
    b: 'result-body',
    H: 'result-header',
    d: 'date-format'
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
