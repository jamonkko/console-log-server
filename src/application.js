import express from 'express'
import bodyParser from 'body-parser'
import xmlParser from 'express-xml-bodyparser'
import prettyjson from 'prettyjson'
import chalk from 'chalk'
import _ from 'lodash/fp'
import { neatJSON } from '../vendor/neat-json'
import { pd } from 'pretty-data'
import { saveRawBody, logRequestStartAndEnd, detectEmptyBody, markBodyAsXml, handleMiddlewareErrors } from './middleware'

const defaultRoute = (req, res) => {
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
}

export default (opts) => {
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
  app.all('*', defaultRoute)
  return app
}
