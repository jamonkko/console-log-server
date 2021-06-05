import test from 'ava'
import cli from '../src/cli.js'
import { Console } from 'console'
import { WritableStreamBuffer } from 'stream-buffers'
import request from 'supertest'

test('request and response logging works', t => {
  const out = new WritableStreamBuffer()
  const err = new WritableStreamBuffer()

  const console = new Console({
    stdout: out,
    stderr: err
  })

  return cli({
    meow: {
      argv: [
        '--log-response=yes',
        '--mock-date=2020-03-23T02:00:00Z',
        '--no-color',
        '--silent-start',
        '--date-format=isoUtcDateTime'
      ]
    },
    cls: { console }
  }).ready.then(([server]) => {
    return request(server)
      .get('/dog')
      .set('Host', 'localhost')
      .expect(200)
      .then(res => {
        t.snapshot(out.getContentsAsString('utf8'), 'prettyprint')
      })
  })
})
