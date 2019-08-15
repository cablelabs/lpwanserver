const config = require('../config')
const { logger } = require('../log')
const express = require('express')
const morgan = require('morgan')
const { configureCors, serveSpa: serveWebClient } = require('./middleware')
const jwt = require('express-jwt')
const { default: OpenApiBackend } = require('openapi-backend')
const api = require('../api')
const handlers = require('./handlers')
const cors = require('cors')

const validateJwt = jwt({ secret: config.jwt_secret })

async function createApp () {
  // Create the REST application.
  var app = express()

  if (config.public_dir) {
    serveWebClient({
      app,
      publicDir: config.public_dir,
      omit: req => /^\/api/.test(req.path)
    })
  }

  // stream morgan to winston
  app.use(morgan('tiny', { stream: { write: x => logger.info(x.trim()) } }))

  app.use(express.json())
  app.use(cors(configureCors(config.cors_whitelist)))

  // Authentication is a 2 step process
  // This middleware will validate and decode JWTs when present
  // Enforcing authentication happens downstream
  app.use((req, res, next) => {
    req.headers.authorization ? validateJwt(req, res, next) : next()
  })

  const OpenApi = new OpenApiBackend({ definition: api, handlers })
  app.use((req, res, next) => {
    OpenApi.handleRequest(req, req, res).catch(e => next(e))
  })

  // 4 arguments are needed for Express error handlers
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    logger.debug(`HTTP request error: ${err}`, { error: err })
    if (!err.statusCode) err.statusCode = 500
    res.status(err.statusCode).send(err.toString())
  })

  return app
}

module.exports = {
  createApp
}
