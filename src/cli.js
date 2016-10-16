#!/usr/bin/env node
import meow from 'meow'
import consoleLogServer from './'

let unknownArgs = false

const cli = meow(`
  Usage
    $ console-log-server

  Options
    --port, -p Port Number
    --hostname, -h Host name
    --result-code, -c Response result code
    --no-color
    --version
    --help

  Examples
    $ console-log-server -p 3000
`, {
  alias: {
    p: 'port',
    h: 'hostname',
    c: 'result-code',
  },
  unknown: (arg) => {
    unknownArgs = (arg !== '--no-color')
    return false
  }
})

if (unknownArgs) {
  cli.showHelp()
} else {
  consoleLogServer(cli.flags).start()
}
