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

  if (!testArgs.distpath) {
    const console = new Console({
      stdout: out,
      stderr: err
    })

    const cls = cli({
      meow: {
        argv: _.concat(opts.argv, ['--silent-start'])
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
      _.concat([testArgs.distpath, testArgs.nodeversion], opts.argv)
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

test.serial('request and response logging works', t => {
  const argv = [
    '--log-response',
    'yes',
    '--mock-date',
    '2020-03-23T02:00:00Z',
    '--no-color',
    '--date-format',
    'isoUtcDateTime',
    '--hostname',
    '127.0.0.1',
    '--port',
    '0',
    '--indent-response',
    'off',
    '--sort-fields',
    'on'
  ]
  return createCLS({ expectResCount: 1, argv }).then(
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

test.serial('Response delay works', t => {
  const argv = [
    '--log-response',
    'yes',
    '--date-format',
    "yyyy-mm-dd HH:MM:ss.l'Z'",
    '--hostname',
    '127.0.0.1',
    '--port',
    '0',
    '--response-delay',
    '501ms'
  ]
  return createCLS({ expectResCount: 1, argv }).then(
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
          const output = out.getCLSOuput({ normalizeHeaders: true })
          const reReqTimestamp = /\[req.*\] \[(.*)\]/i
          const reqMatch = output.match(reReqTimestamp)
          console.log(reqMatch[1])
          t.truthy(reqMatch)
          const reqStamp = reqMatch[1]
          t.truthy(reqStamp)
          const received = Date.parse(reqStamp)
          t.truthy(received)
          const reResTimestamp = /\[res.*\] \[(.*)\]/i
          const resMatch = output.match(reResTimestamp)
          t.truthy(resMatch)
          const resStamp = resMatch[1]
          t.truthy(resStamp)
          const responded = Date.parse(resStamp)
          t.truthy(responded)
          t.assert(
            responded - received > 500,
            `Expected response timestamp: '${resStamp}' to be over 500ms older than req timestamp: '${reqStamp}'}`
          )
        })
    }
  )
})
