import prettyjson from 'prettyjson'
import chalk from 'chalk'
import _ from 'lodash/fp'
import { neatJSON } from '../vendor/neat-json'
import { pd } from 'pretty-data'
import dateFormat from 'dateformat'
import parseHeaders from 'parse-headers'

export function logRequest (err, req, res, opts) {
  const console = opts.console
  const now = dateFormat(new Date(), opts.dateFormat)

  function divider (text, color = chalk.white.dim) {
    const divLine = color.bold(`>> [req:${req.locals.id}] [${now}]`)
    return {
      begin: () => {
        console.log(divLine)
        console.log(text)
      },
      end: () => {
        console.log(text)
        console.log(divLine)
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
  console.log()
  div.begin()
  const renderParams = obj =>
    prettyjson.render(obj, { defaultIndentation: 2 }, 2)
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
      console.log(
        chalk.magenta('body: ') +
          chalk.yellow(
            `(parsed as raw string by console-log-server since content-type is '${headers['content-type']}'. Forgot to set it correctly?)`
          )
      )
      console.log(chalk.white(req.body.toString()))
      break
    case 'json':
      console.log(chalk.magenta('body (json): '))
      console.log(
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
      console.log(chalk.magenta('body (url): '))
      console.log(renderParams(req.body))
      break
    case 'xml':
      console.log(chalk.magenta('body (xml): '))
      console.log(chalk.green(pd.xml(req.rawBody)))
      break
    case 'text':
      console.log(
        chalk.magenta('body: ') +
          chalk.yellow(
            `(parsed as plain text since content-type is '${headers['content-type']}'. Forgot to set it correctly?)`
          )
      )
      console.log(chalk.white(req.body))
      break
    case 'error':
      console.log(
        chalk.red('body (error): ') +
          chalk.yellow(
            '(failed to handle request. Body printed below as plain text if at all...)'
          )
      )
      if (req.body) {
        console.log(chalk.white(req.rawBody))
      }
      break
    default:
      throw new Error(`Internal Error! Unknown bodyType: ${req.bodyType}`)
  }

  if (err) {
    console.log()
    const logJsonParseError = () => {
      const positionMatches = err.message.match(/at position\s+(\d+)/)
      if (!positionMatches) return false
      const index = _.toNumber(positionMatches[1])
      const contentBeforeError = req.rawBody.substring(index - 80, index)
      const contentAfterError = req.rawBody.substring(index, index + 80)
      console.error(
        chalk.yellow(
          `Check the request body position near ${index} below (marked with '!'):`
        )
      )
      console.error(chalk.yellow('...'))
      console.error(
        `${contentBeforeError}${chalk.red('!')}${contentAfterError}"`
      )
      console.error(chalk.yellow('...'))
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
      console.error(chalk.yellow(errorTitle))
      console.error(lineWithError)
      if (column) {
        console.error(_.repeat(column - 1, ' ') + chalk.bold.red('^'))
      }
    }

    console.error(chalk.red(err.stack))
    logJsonParseError() || logXmlParseError()
  }

  div.end()
  console.log()
}

export function logResponse (err, req, res, opts) {
  const console = opts.console
  const now = dateFormat(new Date(), opts.dateFormat)

  function divider (text, color = chalk.white.dim) {
    const divLine = color.bold(`<< [res:${req.locals.id}] [${now}]`)
    return {
      begin: () => {
        console.log(divLine)
        console.log(text)
      },
      end: () => {
        console.log(text)
        console.log(divLine)
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
  console.log()
  div.begin()
  const renderParams = obj =>
    prettyjson.render(obj, { defaultIndentation: 2 }, 2)
  // const headers = res.getHeaders()
  console.log(chalk.magenta('headers' + ':'))
  console.log(renderParams(parseHeaders(res._header)))

  console.log(chalk.magenta('body: '))
  console.log(res.locals.body)
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
  console.log()
}
