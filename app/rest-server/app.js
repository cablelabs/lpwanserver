const config = require('../config')
const { log } = require('../lib/log')
const express = require('express')
const morgan = require('morgan')
const { configureCors, serveSpa: serveWebClient } = require('./middleware')
const jwt = require('express-jwt')
const { default: OpenApiBackend } = require('openapi-backend')
const api = require('../api')
const handlers = require('./handlers')
const cors = require('cors')
const models = require('../models')
const R = require('ramda')

const validateJwt = jwt({ secret: config.jwt_secret })

async function createApp () {
  // Create the REST application.
  var app = express()

  // Initialize Models
  await models.networkProtocol.initialize()
  await models.reportingProtocol.initialize()

  if (config.public_dir) {
    serveWebClient({
      app,
      publicDir: config.public_dir,
      omit: req => /^\/api/.test(req.path)
    })
  }

  // stream morgan to winston
  app.use(morgan('tiny', { stream: { write: x => log.info(x.trim()) } }))

  app.use(express.json())
  app.use(cors(configureCors(config.cors_whitelist)))

  // Authentication is a 2 step process
  // This middleware will validate and decode JWTs when present
  // Enforcing authentication happens downstream
  app.use((req, res, next) => {
    const { authorization: auth } = req.headers
    if (!auth) return next()
    let type = auth.split(' ')[0].toLowerCase()
    if (type !== 'bearer') return next()
    validateJwt(req, res, next)
  })

  const OpenApi = new OpenApiBackend({ definition: api, handlers })
  app.use((req, res, next) => {
    OpenApi.handleRequest(req, req, res).catch(e => next(e))
  })

  // 4 arguments are needed for Express error handlers
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || err.status || 500
    let command = err.statusCode === 500 ? 'error' : 'debug'
    log[command](`HTTP request error: ${err}`, { error: err })
    log[command]('Request info', R.pick(['headers', 'url', 'params'], req))
    res.status(err.statusCode).send(err.toString())
  })

  return app
}

module.exports = {
  createApp
}
