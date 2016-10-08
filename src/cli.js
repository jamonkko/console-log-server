#!/usr/bin/env node
import meow from 'meow'
import server from './'

let unknownParameters = false

const cli = meow(`
  Usage
    $ console-log-server

  Options
    --port, -p  Port Number
    --hostname, -h Host name
    --version
    --help
  Examples
    $ console-log-server -p 3000
`, {
  alias: {
    p: 'port',
    h: 'hostname'
  },
  unknown: () => { unknownParameters = true }
})

if (unknownParameters) {
  cli.showHelp()
} else {
  server.create()
  server.start(cli.flags)
}
