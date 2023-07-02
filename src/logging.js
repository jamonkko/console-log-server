import prettyjson from 'prettyjson'
import chalk from 'chalk'
import _ from 'lodash/fp'
import { neatJSON } from '../vendor/neat-json'
import { pd } from 'pretty-data'
import dateFormat from 'dateformat'
import parseHeaders from 'parse-headers'
import mime from 'mime-types'
import sortObject from 'sorted-object'

/**
 * @param {RequestExt} req
 * @param {ResponseExt} res
 * @param {CLSOptions} opts
 */
export function logRequest (req, res, opts) {
  const ctx = createChalk(opts)
  const cnsl = opts.console
  const now = dateFormat(new Date(), opts.dateFormat)

  function divider (text) {
    const divLine = ctx.white.dim.bold(`>> [req:${req.locals.id}] [${now}]`)
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
  const proxyArrow = ctx.white.bold(' --> ')
  const pathLine = `${req.method} ${req.originalUrl}`
  const div = !err
    ? divider(
      ctx.yellow.bold(pathLine) +
        (proxyUrl ? proxyArrow + ctx.yellow.bold(proxyUrl) : '')
    )
    : divider(
      ctx.red.bold(pathLine) +
        (proxyUrl ? proxyArrow + ctx.red.bold(proxyUrl) : '') +
        ctx.red.bold('  *error*')
    )
  cnsl.log()
  div.begin()
  const headers = req.headers
  cnsl.log(ctx.magenta('headers' + ':'))
  cnsl.log(renderParams(headers, opts))

  if (_.isEmpty(req.query)) {
    cnsl.log(ctx.magenta('query: (empty)'))
  } else {
    cnsl.log(ctx.magenta('query:'))
    cnsl.log(renderParams(req.query, opts))
  }

  switch (req.locals.bodyType) {
    case 'empty':
      cnsl.log(ctx.magenta('body: (empty)'))
      break
    case 'raw':
      cnsl.log(
        ctx.magenta('body: ') +
          ctx.yellow(
            `(parsed as raw string by console-log-server since content-type is '${headers['content-type']}'. Forgot to set it correctly?)`
          )
      )
      cnsl.log(ctx.white(req.body.toString()))
      break
    case 'json':
      cnsl.log(ctx.magenta('body (json): '))
      cnsl.log(
        ctx.green(
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
      cnsl.log(ctx.magenta('body (url): '))
      cnsl.log(renderParams(req.body, opts))
      break
    case 'xml':
      cnsl.log(ctx.magenta('body (xml): '))
      cnsl.log(ctx.green(pd.xml(req.locals.rawBodyBuffer)))
      break
    case 'text':
      cnsl.log(
        ctx.magenta('body: ') +
          ctx.yellow(
            `(parsed as plain text since content-type is '${headers['content-type']}'. Forgot to set it correctly?)`
          )
      )
      cnsl.log(ctx.white(req.body))
      break
    case 'error':
      cnsl.log(
        ctx.red('body (error): ') +
          ctx.yellow(
            '(failed to handle request. Body printed below as plain text if at all...)'
          )
      )
      if (req.body) {
        cnsl.log(ctx.white(req.locals.rawBodyBuffer))
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
  const ctx = createChalk(opts)
  const cnsl = opts.console
  const now = dateFormat(new Date(), opts.dateFormat)

  function divider (text) {
    const divLine = ctx.white.dim.bold(`<< [res:${req.locals.id}] [${now}]`)
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
  const proxyArrow = ctx.white.bold(' <-- ')
  const statusPreFix = `${res.statusCode}`
  const pathLine = ` <- ${req.method} ${req.originalUrl}`
  const div =
    res.statusCode < 400
      ? divider(
        ctx.green.bold(statusPreFix) +
          ctx.yellow.bold(pathLine) +
          (proxyUrl ? proxyArrow + ctx.yellow.bold(proxyUrl) : '')
      )
      : divider(
        ctx.red.bold(statusPreFix) +
          ctx.red.bold(pathLine) +
          (proxyUrl ? proxyArrow + ctx.red.bold(proxyUrl) : '')
      )
  cnsl.log()
  div.begin()

  cnsl.log(ctx.magenta('headers' + ':'))
  cnsl.log(renderParams(parseHeaders(res._header), opts))

  const contentType = res.get('content-type')
  const bodyType =
    res.locals.body === undefined
      ? 'empty'
      : _.isString(contentType)
        ? mime.extension(contentType)
        : 'raw'

  try {
    switch (bodyType) {
      case 'empty':
        cnsl.log(ctx.magenta('body: (empty)'))
        break
      case 'raw':
        cnsl.log(
          ctx.magenta('body: ') + ctx.yellow(`(raw - could not resolve type)`)
        )
        cnsl.log(ctx.white(res.locals.body.toString()))
        break
      case 'json': {
        const json = JSON.parse(res.locals.body)
        cnsl.log(ctx.magenta(`body: (${bodyType})`))
        cnsl.log(
          ctx.green(
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
        cnsl.log(ctx.magenta(`body: (${bodyType})`))
        cnsl.log(ctx.green(xml))
        break
      }
      case 'text':
        cnsl.log(ctx.magenta(`body: (${bodyType})`))
        cnsl.log(ctx.white(res.locals.body))
        break
      default:
        cnsl.log(
          ctx.magenta('body: ') +
            (bodyType
              ? ctx.yellow(
                `(${bodyType} - as raw string, no formatting support yet)`
              )
              : ctx.yellow('(as raw string)'))
        )
        cnsl.log(ctx.white(res.locals.body.toString()))
        break
    }
  } catch (e) {
    cnsl.log(
      ctx.magenta('body: ') +
        ctx.yellow(`(raw - error when trying to pretty-print as '${bodyType}')`)
    )
    cnsl.log(ctx.white(res.locals.body.toString()))

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
 * @param {CLSOptions} opts
 */
function createChalk (opts) {
  return new chalk.constructor(
    opts.color !== false ? undefined : { enabled: false }
  )
}

/**
 * @param {CLSOptions} opts
 * @param {object} obj
 */
function renderParams (obj, opts) {
  const result = prettyjson.render(
    opts.sortFields ? sortObject(obj) : obj,
    {
      defaultIndentation: 2,
      noColor: opts.color !== false ? undefined : true
    },
    2
  )
  if (opts.sortFields && _.startsWith('v0.10.', process.version)) {
    // Node 0.10 does not support sorted object fields, need to do some manual sorting for it
    return _.flow(_.split('\n'), _.sortBy(_.identity), _.join('\n'))(result)
  } else {
    return result
  }
}

/**
 * @param {Error} err
 * @param {string} data
 * @param {string} message
 * @param {CLSOptions} opts
 */
function printParseError (err, data, message, opts) {
  const ctx = createChalk(opts)
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
        ctx.yellow(`Check the position near ${index} below (marked with '!'):`)
      )
      cnsl.error(ctx.yellow('...'))
      cnsl.error(`${contentBeforeError}${ctx.red('!')}${contentAfterError}"`)
      cnsl.error(ctx.yellow('...'))
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
      cnsl.error(ctx.yellow(errorTitle))
      cnsl.error(lineWithError)
      if (column) {
        cnsl.error(_.repeat(column - 1, ' ') + ctx.bold.red('^'))
      }
      return true
    }

    cnsl.error(ctx.red(`${message}: ${err.message}`))
    logJsonParseError() || logXmlParseError() || cnsl.error(ctx.red(err.stack))
  }
}
