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
    --no-color
    --version
    --help

  Examples
    $ console-log-server -p 3000
`, {
  alias: {
    p: 'port',
    h: 'hostname'
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
