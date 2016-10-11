import chalk from 'chalk'
import _ from 'lodash/fp'

export function saveRawBody (req, res, next) {
  req.rawBody = ''
  req.on('data', (chunk) => { req.rawBody += chunk })
  next()
}

export function logRequestStartAndEnd (req, res, next) {
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

export function detectEmptyBody (req, res, next) {
  if (req.rawBody.length === 0) {
    req.bodyType = 'empty'
  }
  next()
}

export function markBodyAsXml (req, res, next) {
  if (!_.isEmpty(req.body) && !req.bodyType) {
    req.bodyType = 'xml'
  }
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
