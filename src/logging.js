import prettyjson from 'prettyjson'
import chalk from 'chalk'
import _ from 'lodash/fp'
import { neatJSON } from '../vendor/neat-json'
import { pd } from 'pretty-data'
import dateFormat from 'dateformat'
import parseHeaders from 'parse-headers'

export function logRequest (err, req, res, opts) {
  const cnsl = opts.console
  const now = dateFormat(new Date(), opts.dateFormat)

  function divider (text, color = chalk.white.dim) {
    const divLine = color.bold(`>> [req:${req.locals.id}] [${now}]`)
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
          chalk.red.bold('  *error*'),
        chalk.red.dim
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

  switch (req.bodyType) {
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
      cnsl.log(chalk.green(pd.xml(req.rawBody)))
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
        cnsl.log(chalk.white(req.rawBody))
      }
      break
    default:
      throw new Error(`Internal Error! Unknown bodyType: ${req.bodyType}`)
  }

  if (err) {
    cnsl.log()
    const logJsonParseError = () => {
      const positionMatches = err.message.match(/at position\s+(\d+)/)
      if (!positionMatches) return false
      const index = _.toNumber(positionMatches[1])
      const contentBeforeError = req.rawBody.substring(index - 80, index)
      const contentAfterError = req.rawBody.substring(index, index + 80)
      cnsl.error(
        chalk.yellow(
          `Check the request body position near ${index} below (marked with '!'):`
        )
      )
      cnsl.error(chalk.yellow('...'))
      cnsl.error(`${contentBeforeError}${chalk.red('!')}${contentAfterError}"`)
      cnsl.error(chalk.yellow('...'))
    }
    const logXmlParseError = () => {
      const lineErrorMatches = err.message.match(/Line:\s+(\d+)/)
      const columnErrorMatches = err.message.match(/Column:\s+(\d+)/)
      if (!lineErrorMatches) return false
      const line = _.toNumber(lineErrorMatches[1])
      const column = _.toNumber(columnErrorMatches[1])
      const lineWithError = req.rawBody.split('\n', line + 1)[line]
      let errorTitle = `Failed to parse body as XML according to Content-Type. Parse error in body might be here at line:${line}`
      if (column) {
        errorTitle += ` column:${column}`
      }
      errorTitle += ' (see below)'
      cnsl.error(chalk.yellow(errorTitle))
      cnsl.error(lineWithError)
      if (column) {
        cnsl.error(_.repeat(column - 1, ' ') + chalk.bold.red('^'))
      }
    }

    cnsl.error(chalk.red(err.stack))
    logJsonParseError() || logXmlParseError()
  }

  div.end()
  cnsl.log()
}

export function logResponse (err, req, res, opts) {
  const cnsl = opts.console
  const now = dateFormat(new Date(), opts.dateFormat)

  function divider (text, color = chalk.white.dim) {
    const divLine = color.bold(`<< [res:${req.locals.id}] [${now}]`)
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
    !err && res.statusCode < 400
      ? divider(
          chalk.green.bold(statusPreFix) +
            chalk.yellow.bold(pathLine) +
            (proxyUrl ? proxyArrow + chalk.yellow.bold(proxyUrl) : '')
        )
      : divider(
          chalk.red.bold(statusPreFix) +
            chalk.red.bold(pathLine) +
            (proxyUrl ? proxyArrow + chalk.red.bold(proxyUrl) : '') +
            (err ? chalk.red.bold('  *error*') : ''),
          chalk.red.dim
        )
  cnsl.log()
  div.begin()
  const renderParams = obj =>
    prettyjson.render(obj, { defaultIndentation: 2 }, 2)
  // const headers = res.getHeaders()
  cnsl.log(chalk.magenta('headers' + ':'))
  cnsl.log(renderParams(parseHeaders(res._header)))

  cnsl.log(chalk.magenta('body: '))
  cnsl.log(res.locals.body)
  // switch (req.bodyType) {
  //   case 'empty':
  //     log(chalk.magenta('body: (empty)'))
  //     break
  //   case 'raw':
  //     log(chalk.magenta('body: ') + chalk.yellow(`(parsed as raw string by console-log-server since content-type is '${headers['content-type']}'. Forgot to set it correctly?)`))
  //     log(chalk.white(req.body.toString()))
  //     break
  //   case 'json':
  //     log(chalk.magenta('body (json): '))
  //     log(chalk.green(neatJSON(req.body, {
  //       wrap: 40,
  //       aligned: true,
  //       afterComma: 1,
  //       afterColon1: 1,
  //       afterColonN: 1
  //     })))
  //     break
  //   case 'xml':
  //     log(chalk.magenta('body (xml): '))
  //     log(chalk.green(pd.xml(req.rawBody)))
  //     break
  //   case 'text':
  //     log(chalk.magenta('body: ') + chalk.yellow(`(parsed as plain text since content-type is '${headers['content-type']}'. Forgot to set it correctly?)`))
  //     log(chalk.white(req.body))
  //     break
  //   case 'error':
  //     log(chalk.red('body (error): ') + chalk.yellow('(failed to handle request. Body printed below as plain text if at all...)'))
  //     if (req.body) {
  //       log(chalk.white(req.rawBody))
  //     }
  //     break
  //   default:
  //     throw new Error(`Internal Error! Unknown bodyType: ${req.bodyType}`)
  // }

  // if (err) {
  //   log()
  //   const logJsonParseError = () => {
  //     const positionMatches = err.message.match(/at position\s+(\d+)/)
  //     if (!positionMatches) return false
  //     const index = _.toNumber(positionMatches[1])
  //     const contentBeforeError = req.rawBody.substring(index - 80, index)
  //     const contentAfterError = req.rawBody.substring(index, index + 80)
  //     console.error(chalk.yellow(`Check the request body position near ${index} below (marked with '!'):`))
  //     console.error(chalk.yellow('...'))
  //     console.error(`${contentBeforeError}${chalk.red('!')}${contentAfterError}"`)
  //     console.error(chalk.yellow('...'))
  //   }
  //   const logXmlParseError = () => {
  //     const lineErrorMatches = err.message.match(/Line:\s+(\d+)/)
  //     const columnErrorMatches = err.message.match(/Column:\s+(\d+)/)
  //     if (!lineErrorMatches) return false
  //     const line = _.toNumber(lineErrorMatches[1])
  //     const column = _.toNumber(columnErrorMatches[1])
  //     const lineWithError = req.rawBody.split('\n', line + 1)[line]
  //     let errorTitle = `Failed to parse body as XML according to Content-Type. Parse error in body might be here at line:${line}`
  //     if (column) {
  //       errorTitle += ` column:${column}`
  //     }
  //     errorTitle += ' (see below)'
  //     console.error(chalk.yellow(errorTitle))
  //     console.error(lineWithError)
  //     if (column) {
  //       console.error(_.repeat(column - 1, ' ') + chalk.bold.red('^'))
  //     }
  //   }

  //   console.error(chalk.red(err.stack))
  //   logJsonParseError() || logXmlParseError()
  // }

  div.end()
  cnsl.log()
}
