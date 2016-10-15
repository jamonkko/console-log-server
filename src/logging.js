import prettyjson from 'prettyjson'
import chalk from 'chalk'
import _ from 'lodash/fp'
import { neatJSON } from '../vendor/neat-json'
import { pd } from 'pretty-data'

export function logRequest (req, res, next) {
  res.on('finish', () => {
    const pathLine = req.method + ' ' + req.originalUrl
    const divLine = '*'.repeat(pathLine.length)
    console.log(chalk.cyan.dim(divLine))
    console.log(chalk.yellow.bold(pathLine))
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
    console.log(chalk.yellow(pathLine))
    console.log(chalk.cyan.dim(divLine))
    console.log()
  })
  next()
}

export function handleMiddlewareErrors (err, req, res, next) {
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
