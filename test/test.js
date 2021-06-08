import test from 'ava'
import cli from '../src/cli.js'
import { Console } from 'console'
import { WritableStreamBuffer } from 'stream-buffers'
import request from 'supertest'
import _ from 'lodash'
import minimist from 'minimist'

function createCLS (opts) {
  const out = new WritableStreamBuffer()
  const err = new WritableStreamBuffer()

  out.getCLSOuput = ({ normalizeHeaders }) => {
    const str = out.getContentsAsString('utf8')
    // Using stream Transformer did not work for some reason so just regex the suppressed headers away
    return normalizeHeaders
      ? str
          .replace(/\n(\s+content-length:\s+0)/g, '')
          .replace(/\n(\s+transfer-encoding:\s+chunked)/g, '')
      : str
  }

  const testArgs = minimist(process.argv.slice(2))

  const argv = [
    '--log-response',
    'yes',
    '--mock-date',
    '2020-03-23T02:00:00Z',
    '--no-color',
    '--date-format',
    'isoUtcDateTime',
    '--port',
    '0',
    '--indent-response',
    'off',
    '--sort-fields',
    'on'
  ]
  if (!testArgs.distpath) {
    const console = new Console({
      stdout: out,
      stderr: err
    })

    const cls = cli({
      meow: {
        argv: _.concat(argv, ['--silent-start'])
      },
      cls: { console }
    })

    return cls.ready.then(([server]) => ({
      out,
      err,
      server
    }))
  } else {
    let resTagCount = 0
    let reqTagCount = 0
    let lastStrChunk

    const { spawn } = require('child_process')
    const child = spawn(
      './test/run_dist.sh',
      _.concat([testArgs.distpath, testArgs.nodeversion], argv)
    )
    child.stdout.setEncoding('utf8')

    process.on('exit', function () {
      if (!child.killed) {
        child.kill()
      }
    })

    const re = /console-log-server listening on (.*)/i
    const count = (str, re) => ((str || '').match(re) || []).length

    let resolveFinished
    const finished = new Promise(resolve => (resolveFinished = resolve))

    return new Promise(resolve => {
      child.stdout.on('data', chunk => {
        const str = chunk.toString()
        const listening = str.match(re)
        reqTagCount += count(str, />> \[req:\d+\]/g)
        resTagCount += count(str, /<< \[res:\d+\]/g)

        if (
          (!opts.expectResCount || resTagCount / 2 >= opts.expectResCount) &&
          (!opts.expectReqCount || reqTagCount / 2 >= opts.expectReqCount)
        ) {
          if (/\n\n$/.test(lastStrChunk + str)) {
            resolveFinished()
          }
        }

        lastStrChunk = str

        if (listening) {
          child.stderr.pipe(err)
          child.stdout.pipe(out)

          resolve({
            err,
            out,
            server: listening[1],
            child,
            finished
          })
        }
      })
    })
  }
}

test('request and response logging works', t => {
  return createCLS({ expectResCount: 1 }).then(
    ({ out, err, server, child, finished }) => {
      return request(server)
        .get('/dog')
        .set('Host', 'localhost')
        .expect(200)
        .then(() => finished)
        .then(() => {
          if (child) {
            child.kill(9)
            return new Promise(resolve => child.on('exit', () => resolve()))
          }
        })
        .then(res => {
          t.snapshot(out.getCLSOuput({ normalizeHeaders: true }), 'out')
          t.is(err.size(), 0)
        })
    }
  )
})
