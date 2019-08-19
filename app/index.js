const config = require('./config')
const { logger } = require('./log')
const { createRestServer } = require('./rest-server')
const fs = require('fs')
const path = require('path')
const models = require('./models')

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
  await models.initialize()

  const restServer = await createRestServer()

  const shutdown = (staticMeta = {}) => (dynamicMeta = {}) => {
    logger.info(`LPWAN to shutdown.`, { ...staticMeta, ...dynamicMeta })
    restServer.close(() => {
      process.exit()
    })
  }

  process.on('SIGTERM', shutdown({ signal: 'SIGTERM' }))
  process.on('SIGINT', shutdown({ signal: 'SIGINT' }))

  restServer.on('error', err => {
    logger.error(`REST server: ${err}`, { error: err })
    shutdown()({ error: err.toString() })
  })

  restServer.listen(config.port, () => {
    logger.info(`Listening on ${config.port}`)
  })
}

main().catch(err => {
  logger.log({ ...err, message: `${err}`, level: 'error' })
})
