import test from 'ava'
import cli from '../src/cli.js'
import { Console } from 'console'
import { WritableStreamBuffer } from 'stream-buffers'
import request from 'supertest'
import _ from 'lodash'

function createCLS (args = []) {
  const out = new WritableStreamBuffer()
  const err = new WritableStreamBuffer()

  const console = new Console({
    stdout: out,
    stderr: err
  })

  const cls = cli({
    meow: {
      argv: _.concat(args, [
        '--log-response=yes',
        '--mock-date=2020-03-23T02:00:00Z',
        '--no-color',
        '--silent-start',
        '--date-format=isoUtcDateTime'
      ])
    },
    cls: { console }
  })

  return cls.ready.then(([server]) => ({
    out,
    err,
    server
  }))
}

test('request and response logging works', t => {
  return createCLS().then(({ out, err, server }) => {
    return request(server)
      .get('/dog')
      .set('Host', 'localhost')
      .expect(200)
      .then(res => {
        t.snapshot(out.getContentsAsString('utf8'), 'out')
        t.is(err.size(), 0)
      })
  })
})
