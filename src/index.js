/*!
 * @license
 * console-log-server v0.0.2 (https://github.com/jamonkko/console-log-server#readme)
 * Copyright 2016 Jarkko Mönkkönen <jamonkko@gmail.com>
 * Licensed under MIT
 */
import express from 'express'
import bodyParser from 'body-parser'
import chalk from 'chalk'
import { neatJSON } from '../vendor/neat-json'
import prettyjson from 'prettyjson'
import { pd } from 'pretty-data'
import _ from 'lodash/fp'
import xmlParser from 'express-xml-bodyparser'

const saveRawBody = (req, res, next) => {
  req.rawBody = ''
  req.on('data', (chunk) => { req.rawBody += chunk })
  next()
}

const logRequestStartAndEnd = (req, res, next) => {
  const pathLine = req.method + ' ' + req.originalUrl
  const divLine = '*'.repeat(pathLine.length)
  console.log(chalk.cyan.dim(divLine))
  console.log(chalk.yellow.bold(pathLine))
  res.on('finish', () => {
    console.log(chalk.yellow(pathLine))
    console.log(chalk.cyan.dim(divLine))
    console.log()
  })
  next()
}

const detectEmptyBody = (req, res, next) => {
  if (req.rawBody.length === 0) {
    req.bodyType = 'empty'
  }
  next()
}

const markBodyAsXml = (req, res, next) => {
  if (!_.isEmpty(req.body) && !req.bodyType) {
    req.bodyType = 'xml'
  }
  next()
}

const handleMiddlewareErrors = (err, req, res, next) => {
  const logJsonParseError = () => {
    const positionMatches = err.message.match(/at position\s+(\d+)/)
    if (!positionMatches) return false
    const index = _.toNumber(positionMatches[1])
    const contentBeforeError = req.rawBody.substring(index - 80, index)
    const contentAfterError = req.rawBody.substring(index, index + 80)
    console.error(chalk.yellow(`Check the request body position near ${index} below (marked with '!'):`))
    console.error(chalk.yellow('...'))
    console.error(`${contentBeforeError}${chalk.red('!')}${contentAfterError}"`)
    console.error(chalk.yellow('...'))
  }
  const logXmlParseError = () => {
    const lineErrorMatches = err.message.match(/Line:\s+(\d+)/)
    const columnErrorMatches = err.message.match(/Column:\s+(\d+)/)
    if (!lineErrorMatches) return false
    const line = _.toNumber(lineErrorMatches[1])
    const column = _.toNumber(columnErrorMatches[1])
    const lineWithError = req.rawBody.split('\n', line + 1)[line]
    let errorTitle = `Actual error might be earlier, but here is the line:${line}`
    if (column) {
      errorTitle += ` column:${column}`
    }
    console.error(chalk.yellow(errorTitle))
    console.error(lineWithError)
    if (column) {
      console.error(' '.repeat(column - 1) + chalk.bold.red('^'))
    }
  }
  console.error(chalk.red('Error receiving request: ' + req.method + ' ' + req.originalUrl))
  console.error(chalk.red(err.stack))
  logJsonParseError() || logXmlParseError()
  res.status(400).end()
}

const create = () => {
  const app = express()

  app.use(logRequestStartAndEnd)
  app.use(saveRawBody)
  app.use(bodyParser.json({verify: (req) => { req.bodyType = 'json' }}))
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(xmlParser())
  app.use(markBodyAsXml)
  app.use(bodyParser.text({verify: (req) => { req.bodyType = 'text' }}))
  app.use(bodyParser.raw({type: () => true, verify: (req) => { req.bodyType = 'raw' }}))
  app.use(detectEmptyBody)
  app.use(handleMiddlewareErrors)

  app.all('*', (req, res) => {
    console.log(req.bodyType)
    const renderParams = (obj) => prettyjson.render(obj, {defaultIndentation: 2}, 2)
    const headers = req.headers

    console.log(chalk.magenta('headers' + ':'))
    console.log(renderParams(headers))

    if (_.isEmpty(req.query)) {
      console.log(chalk.magenta('query: (empty)'))
    } else {
      console.log(chalk.magenta('query:'))
      console.log(renderParams(req.query))
    }

    switch (req.bodyType) {
      case 'empty':
        console.log(chalk.magenta('body: (empty)'))
        break
      case 'raw':
        console.log(chalk.magenta('body: ') + chalk.yellow(`(parsed as raw string by console-log-server since content-type is '${headers['content-type']}'. Forgot to set it correctly?)`))
        console.log(chalk.white(req.body.toString()))
        break
      case 'json':
        console.log(chalk.magenta('body (json): '))
        console.log(chalk.green(neatJSON(req.body, {
          wrap: 40,
          aligned: true,
          afterComma: 1,
          afterColon1: 1,
          afterColonN: 1
        })))
        break
      case 'xml':
        console.log(chalk.magenta('body (xml): '))
        console.log(chalk.green(pd.xml(req.rawBody)))
        break
      case 'text':
        console.log(chalk.magenta('body: ') + chalk.yellow(`(parsed as plain text since content-type is '${headers['content-type']}'. Forgot to set it correctly?)`))
        console.log(chalk.white(req.body))
        break
      default:
        throw new Error('Internal Error! bodyType not set!')
    }
    res.status(200).end()
  })
  return app
}

export default function consoleLogServer (opts = {}) {
  opts = _.defaults({port: 3000, hostname: 'localhost'}, opts)
  const app = create(opts)
  return {
    app,
    start: (cb = () => true) => {
      app.listen(opts.port, opts.hostname, () => {
        console.log(`console-log-server listening on http://${opts.hostname}:${opts.port}`)
        cb(null)
      })
    }
  }
}

if (!module.parent) {
  consoleLogServer().start()
}
