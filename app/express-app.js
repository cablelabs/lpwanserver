const config = require('./config')
const { logger } = require('./log')
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const RestServer = require('./rest/restServer')
const serveSpa = require('./lib/serve-spa')

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

async function createApp () {
  // Create the REST application.
  var app = express()

  if (config.public_dir) {
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

  // stream morgan to winston
  app.use(morgan('tiny', { stream: { write: x => logger.info(x.trim()) } }))

  // Add the body parser.
  app.use(express.json())

  // Add a cookie parser.
  app.use(cookieParser())

  app.use(cors(buildCorsMiddlewareOptions(config)))

  // Initialize the application support interfaces.  We pass in the
  // application so we can add functions and API endpoints.
  var restServer = new RestServer(app)
  await restServer.initialize()

  return app
}

module.exports = {
  createApp
}
