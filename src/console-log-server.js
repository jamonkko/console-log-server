/*!
 * @license
 * console-log-server v0.0.1 (https://github.com/jamonkko/console-log-server#readme)
 * Copyright 2016 Jarkko Mönkkönen <jamonkko@gmail.com>
 * Licensed under MIT
 */
import express from 'express'
import bodyParser from 'body-parser'
import chalk from 'chalk'
import { neatJSON } from '../vendor/neat-json'
import prettyjson from 'prettyjson'
import { pd } from 'pretty-data'
import _ from 'lodash'
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
    if (!lineErrorMatches) return false
    const line = _.toNumber(lineErrorMatches[1])
    const lineWithError = _.last(req.rawBody.split('\n', line))
    console.error(chalk.yellow(`Line ${line} in request body (error is probably near it):`))
    console.error(lineWithError)
  }
  console.error(chalk.red('Error receiving request: ' + req.method + ' ' + req.originalUrl))
  console.error(chalk.red(err.stack))
  logJsonParseError() || logXmlParseError()
  res.status(500).send('Internal error!')
}

const unknownContentType = (req) => Buffer.isBuffer(req.body)

const app = express()
app.use(logRequestStartAndEnd)
app.use(saveRawBody)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(xmlParser())
app.use(bodyParser.text())
app.use(bodyParser.raw({type: () => true}))
app.use(handleMiddlewareErrors)

app.all('*', (req, res) => {
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

  if (_.isEmpty(req.body)) {
    console.log(chalk.magenta('body: (empty)'))
  } else if (unknownContentType(req)) {
    console.log(chalk.magenta('body: ') + chalk.yellow(`(parsed as raw string since content-type '${headers['content-type']}' is not supported. Forgot to set it correctly?)`))
    console.log(chalk.white(req.body.toString()))
  } else if (headers['content-type'] && headers['content-type'].indexOf('json') !== -1) {
    console.log(chalk.magenta('body (json): '))
    console.log(chalk.green(neatJSON(req.body, {
      wrap: 40,
      aligned: true,
      afterComma: 1,
      afterColon1: 1,
      afterColonN: 1
    })))
  } else if (headers['content-type'] && headers['content-type'].indexOf('xml') !== -1) {
    console.log(chalk.magenta('body (xml): '))
    console.log(chalk.green(pd.xml(req.rawBody)))
  } else {
    console.log(chalk.magenta('body: ') + chalk.yellow(`(parsed as plain text since content-type is '${headers['content-type']}'. Forgot to set it correctly?)`))
    console.log(chalk.white(req.body))
  }
  res.status(200).end()
})

const port = _.toNumber(process.env.PORT || 3000)
app.listen(port)
console.log('Listening at http://localhost:' + port)
