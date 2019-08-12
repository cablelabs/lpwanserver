const config = require('./config')
const { logger } = require('./log')
const { createApp } = require('./express-app')
const { createRestServer } = require('./rest-server')
const fs = require('fs')
const path = require('path')

// uncaughtExceptions
// uncaughtExceptions are handled and logged by winston

// Log exit code to console
process.on('exit', (code) => {
  logger.info(`LPWAN Server to exit with code: ${code}`, { exitCode: code })
})

process.on('warning', warning => {
  logger.warn(warning.name, warning)
})

async function main () {
  // ensure api.yml was copied in from docs/dist
  fs.accessSync(path.join(__dirname, 'api.yml'))

  const app = await createApp()
  const restServer = createRestServer(app, config)

  const shutdown = (staticMeta = {}) => (dynamicMeta = {}) => {
    logger.info(`LPWAN to shutdown.`, { ...staticMeta, ...dynamicMeta })
    restServer.close(() => {
      process.exit()
    })
  }

  process.on('SIGTERM', shutdown({ signal: 'SIGTERM' }))
  process.on('SIGINT', shutdown({ signal: 'SIGINT' }))

  restServer.on('error', err => {
    logger.error('REST server error.', { ...err, message: err.message })
    shutdown()({ error: err.message })
  })

  restServer.listen(config.port, () => {
    logger.info(`Listening on ${config.port}`)
  })
}

main().catch(err => {
  logger.log({ ...err, message: `${err}`, level: 'error' })
})
