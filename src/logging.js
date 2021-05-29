import prettyjson from 'prettyjson'
import chalk from 'chalk'
import _ from 'lodash/fp'
import { neatJSON } from '../vendor/neat-json'
import { pd } from 'pretty-data'
import dateFormat from 'dateformat'
import parseHeaders from 'parse-headers'
import mime from 'mime-types'

/**
 * @param {RequestExt} req
 * @param {ResponseExt} res
 * @param {CLSOptions} opts
 */
export function logRequest (req, res, opts) {
  const cnsl = opts.console
  const now = dateFormat(new Date(), opts.dateFormat)

  function divider (text) {
    const divLine = chalk.white.dim.bold(`>> [req:${req.locals.id}] [${now}]`)
    return {
      begin: () => {
        cnsl.log(divLine)
        cnsl.log(text)
      },
      end: () => {
        cnsl.log(text)
        cnsl.log(divLine)
      }
    }
  }

  const err = req.locals.bodyError
  const proxyUrl = req.locals.proxyUrl || ''
  const proxyArrow = chalk.white.bold(' --> ')
  const pathLine = `${req.method} ${req.originalUrl}`
  const div = !err
    ? divider(
        chalk.yellow.bold(pathLine) +
          (proxyUrl ? proxyArrow + chalk.yellow.bold(proxyUrl) : '')
      )
    : divider(
        chalk.red.bold(pathLine) +
          (proxyUrl ? proxyArrow + chalk.red.bold(proxyUrl) : '') +
          chalk.red.bold('  *error*')
      )
  cnsl.log()
  div.begin()
  const renderParams = obj =>
    prettyjson.render(obj, { defaultIndentation: 2 }, 2)
  const headers = req.headers
  cnsl.log(chalk.magenta('headers' + ':'))
  cnsl.log(renderParams(headers))

  if (_.isEmpty(req.query)) {
    cnsl.log(chalk.magenta('query: (empty)'))
  } else {
    cnsl.log(chalk.magenta('query:'))
    cnsl.log(renderParams(req.query))
  }

  switch (req.locals.bodyType) {
    case 'empty':
      cnsl.log(chalk.magenta('body: (empty)'))
      break
    case 'raw':
      cnsl.log(
        chalk.magenta('body: ') +
          chalk.yellow(
            `(parsed as raw string by console-log-server since content-type is '${headers['content-type']}'. Forgot to set it correctly?)`
          )
      )
      cnsl.log(chalk.white(req.body.toString()))
      break
    case 'json':
      cnsl.log(chalk.magenta('body (json): '))
      cnsl.log(
        chalk.green(
          neatJSON(req.body, {
            wrap: 40,
            aligned: true,
            afterComma: 1,
            afterColon1: 1,
            afterColonN: 1
          })
        )
      )
      break
    case 'url':
      cnsl.log(chalk.magenta('body (url): '))
      cnsl.log(renderParams(req.body))
      break
    case 'xml':
      cnsl.log(chalk.magenta('body (xml): '))
      cnsl.log(chalk.green(pd.xml(req.locals.rawBodyBuffer)))
      break
    case 'text':
      cnsl.log(
        chalk.magenta('body: ') +
          chalk.yellow(
            `(parsed as plain text since content-type is '${headers['content-type']}'. Forgot to set it correctly?)`
          )
      )
      cnsl.log(chalk.white(req.body))
      break
    case 'error':
      cnsl.log(
        chalk.red('body (error): ') +
          chalk.yellow(
            '(failed to handle request. Body printed below as plain text if at all...)'
          )
      )
      if (req.body) {
        cnsl.log(chalk.white(req.locals.rawBodyBuffer))
      }
      break
    default:
      throw new Error(
        `Internal Error! Unknown bodyType: ${req.locals.bodyType}`
      )
  }

  printParseError(
    err,
    req.locals.rawBodyBuffer,
    'Warning! Received request body was invalid',
    opts
  )

  div.end()
  cnsl.log()
}

/**
 * @param {RequestExt} req
 * @param {ResponseExt} res
 * @param {CLSOptions} opts
 */
export function logDefaultBodyError (req, res, opts) {
  return printParseError(
    res.locals.defaultBodyError,
    opts.responseBody,
    `[req:${req.locals.id}] Warning! Returned responseBody is invalid. Consider fixing it unless you set it intentionally to have invalid value`,
    opts
  )
}

/**
 * @param {RequestExt} req
 * @param {ResponseExt} res
 * @param {CLSOptions} opts
 */
export function logResponse (/** @type {RequestExt} */ req, res, opts) {
  const cnsl = opts.console
  const now = dateFormat(new Date(), opts.dateFormat)

  function divider (text) {
    const divLine = chalk.white.dim.bold(`<< [res:${req.locals.id}] [${now}]`)
    return {
      begin: () => {
        cnsl.log(divLine)
        cnsl.log(text)
      },
      end: () => {
        cnsl.log(text)
        cnsl.log(divLine)
      }
    }
  }

  const proxyUrl = req.locals.proxyUrl || ''
  const proxyArrow = chalk.white.bold(' <-- ')
  const statusPreFix = `${res.statusCode}`
  const pathLine = ` <- ${req.method} ${req.originalUrl}`
  const div =
    res.statusCode < 400
      ? divider(
          chalk.green.bold(statusPreFix) +
            chalk.yellow.bold(pathLine) +
            (proxyUrl ? proxyArrow + chalk.yellow.bold(proxyUrl) : '')
        )
      : divider(
          chalk.red.bold(statusPreFix) +
            chalk.red.bold(pathLine) +
            (proxyUrl ? proxyArrow + chalk.red.bold(proxyUrl) : '')
        )
  cnsl.log()
  div.begin()
  const renderParams = obj =>
    prettyjson.render(obj, { defaultIndentation: 2 }, 2)
  cnsl.log(chalk.magenta('headers' + ':'))
  cnsl.log(renderParams(parseHeaders(res._header)))

  const contentType = res.getHeader('content-type')
  const bodyType =
    res.locals.body === undefined
      ? 'empty'
      : _.isString(contentType)
      ? mime.extension(contentType)
      : 'raw'

  try {
    switch (bodyType) {
      case 'empty':
        cnsl.log(chalk.magenta('body: (empty)'))
        break
      case 'raw':
        cnsl.log(
          chalk.magenta('body: ') +
            chalk.yellow(`(raw - could not resolve type)`)
        )
        cnsl.log(chalk.white(res.locals.body.toString()))
        break
      case 'json': {
        const json = JSON.parse(res.locals.body)
        cnsl.log(chalk.magenta(`body: (${bodyType})`))
        cnsl.log(
          chalk.green(
            neatJSON(json, {
              wrap: 40,
              aligned: true,
              afterComma: 1,
              afterColon1: 1,
              afterColonN: 1
            })
          )
        )
        break
      }
      case 'xml': {
        const xml = pd.xml(res.locals.body)
        cnsl.log(chalk.magenta(`body: (${bodyType})`))
        cnsl.log(chalk.green(xml))
        break
      }
      case 'text':
        cnsl.log(chalk.magenta(`body: (${bodyType})`))
        cnsl.log(chalk.white(res.locals.body))
        break
      default:
        throw new Error(
          `Internal Error! Unknown response bodyType: ${bodyType}`
        )
    }
  } catch (e) {
    cnsl.log(
      chalk.magenta('body: ') +
        chalk.yellow(
          `(raw - error when trying to pretty-print as '${bodyType}')`
        )
    )
    cnsl.log(chalk.white(res.locals.body.toString()))

    printParseError(
      e,
      res.locals.body,
      'Warning! Response body is invalid',
      opts
    )
  }

  div.end()
  cnsl.log()
}

/**
 * @param {Error} err
 * @param {string} data
 * @param {string} message
 * @param {CLSOptions} opts
 */
function printParseError (err, data, message, opts) {
  const cnsl = opts.console
  if (err) {
    cnsl.log()
    const logJsonParseError = () => {
      const positionMatches = err.message.match(/at position\s+(\d+)/)
      if (!positionMatches) return false
      const index = _.toNumber(positionMatches[1])
      const contentBeforeError = data.substring(index - 80, index)
      const contentAfterError = data.substring(index, index + 80)
      cnsl.error(
        chalk.yellow(
          `Check the position near ${index} below (marked with '!'):`
        )
      )
      cnsl.error(chalk.yellow('...'))
      cnsl.error(`${contentBeforeError}${chalk.red('!')}${contentAfterError}"`)
      cnsl.error(chalk.yellow('...'))
      return true
    }
    const logXmlParseError = () => {
      const lineErrorMatches = err.message.match(/Line:\s+(\d+)/)
      const columnErrorMatches = err.message.match(/Column:\s+(\d+)/)
      if (!lineErrorMatches) return false
      const line = _.toNumber(lineErrorMatches[1])
      const column = _.toNumber(columnErrorMatches[1])
      const lineWithError = data.split('\n', line + 1)[line]
      let errorTitle = `Failed to parse as XML. Parse error might be here at line:${line}`
      if (column) {
        errorTitle += ` column:${column}`
      }
      errorTitle += ' (see below)'
      cnsl.error(chalk.yellow(errorTitle))
      cnsl.error(lineWithError)
      if (column) {
        cnsl.error(_.repeat(column - 1, ' ') + chalk.bold.red('^'))
      }
      return true
    }

    cnsl.error(chalk.red(`${message}: ${err.message}`))
    logJsonParseError() ||
      logXmlParseError() ||
      cnsl.error(chalk.red(err.stack))
  }
}
