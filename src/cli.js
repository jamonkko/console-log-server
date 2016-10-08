#!/usr/bin/env node
import meow from 'meow'
import server from './'

const cli = meow(`
  Usage
    $ console-log-server

  Options
    --port, -p  Port Number
    --hostname, -H Host name

  Examples
    $ console-log-server -p 3000
`, {
  alias: {
    p: 'port',
    h: 'hostname'
  }
})
/*
{
    input: ['unicorns'],
    flags: {rainbow: true},
    ...
}
*/

server.create()
server.start(cli.flags)
