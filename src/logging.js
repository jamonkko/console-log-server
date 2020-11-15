import prettyjson from 'prettyjson'
import chalk from 'chalk'
import _ from 'lodash/fp'
import { neatJSON } from '../vendor/neat-json'
import { pd } from 'pretty-data'
import dateFormat from 'dateformat'

export default (err, req, res, opts) => {
  const log = opts.log
  const now = new Date()

  function divider (text, color = chalk.cyan.dim) {
    const divLine = color('*'.repeat(chalk.stripColor(text).length))
    return {
      begin: () => {
        log(divLine)
        log(text)
      },
      end: () => {
        log(text)
        log(divLine)
      }
    }
  }

  const pathLine = req.method + ' ' + req.originalUrl
  const div = !err ? divider(chalk.yellow.bold(pathLine)) : divider(chalk.red.bold(`${pathLine} (error!)`), chalk.red.dim)
  log()
  div.begin()
  const renderParams = (obj) => prettyjson.render(obj, {defaultIndentation: 2}, 2)
  const headers = req.headers

  log(chalk.magenta('meta' + ':'))
  log(renderParams({
    date: dateFormat(now, opts.dateFormat || "yyyy-mm-dd'T'HH:MM:sso")
  }))
  log(chalk.magenta('headers' + ':'))
  log(renderParams(headers))

  if (_.isEmpty(req.query)) {
    log(chalk.magenta('query: (empty)'))
  } else {
    log(chalk.magenta('query:'))
    log(renderParams(req.query))
  }

  switch (req.bodyType) {
    case 'empty':
      log(chalk.magenta('body: (empty)'))
      break
    case 'raw':
      log(chalk.magenta('body: ') + chalk.yellow(`(parsed as raw string by console-log-server since content-type is '${headers['content-type']}'. Forgot to set it correctly?)`))
      log(chalk.white(req.body.toString()))
      break
    case 'json':
      log(chalk.magenta('body (json): '))
      log(chalk.green(neatJSON(req.body, {
        wrap: 40,
        aligned: true,
        afterComma: 1,
        afterColon1: 1,
        afterColonN: 1
      })))
      break
    case 'url':
      log(chalk.magenta('body (url): '))
      log(renderParams(req.body))
      break
    case 'xml':
      log(chalk.magenta('body (xml): '))
      log(chalk.green(pd.xml(req.rawBody)))
      break
    case 'text':
      log(chalk.magenta('body: ') + chalk.yellow(`(parsed as plain text since content-type is '${headers['content-type']}'. Forgot to set it correctly?)`))
      log(chalk.white(req.body))
      break
    case 'error':
      log(chalk.red('body (error): ') + chalk.yellow(`(failed to handle request. Body printed below as plain text if at all...)`))
      if (req.body) {
        log(chalk.white(req.rawBody))
      }
      break
    default:
      throw new Error(`Internal Error! Unknown bodyType: ${req.bodyType}`)
  }

  if (err) {
    log()
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

    console.error(chalk.red(err.stack))
    logJsonParseError() || logXmlParseError()
  }

  div.end()
  log()
}

