const config = require('./config')
const { logger } = require('./log')
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Api = require('./rest-2')
const serveSpa = require('./lib/serve-spa')
const jwt = require('express-jwt')

const validateJwt = jwt({ secret: config.jwt_secret })

function buildCorsMiddlewareOptions () {
  var whitelist = config.cors_whitelist.map(x => new RegExp(x))
  return {
    origin (origin, callback) {
      if (whitelist.some(x => x.test(origin))) {
        callback(null, true)
        return
      }
      callback(new Error('Not allowed by CORS settings'))
    }
  }
}

function serveWebClient (app) {
  try {
    serveSpa({
      app,
      public: config.public_dir,
      omit: req => /^\/api/.test(req.path)
    })
  }
  catch (err) {
    logger.error('Failed to add Express middleware to serve UI. Set public_dir to empty string to avoid error.', err)
    throw err
  }
}

async function createApp () {
  // Create the REST application.
  var app = express()

  if (config.public_dir) serveWebClient(app)

  // stream morgan to winston
  app.use(morgan('tiny', { stream: { write: x => logger.info(x.trim()) } }))

  app.use(express.json())
  app.use(cors(buildCorsMiddlewareOptions(config)))

  // Authentication is a 2 step process
  // This middleware will validate and decode JWTs when present
  // Enforcing authentication happens downstream
  app.use((req, res, next) => {
    req.headers.authorization ? validateJwt(req, res, next) : next()
  })

  app.use((req, res, next) => {
    Api.handleRequest(req, req, res).catch(e => next(e))
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
