const config = require('./config')
const { log } = require('./log')
const { createRestServer } = require('./rest-server')

// uncaughtExceptions
// uncaughtExceptions are handled and logged by winston

// Log exit code to console
process.on('exit', (code) => {
  log.info(`LPWAN Server to exit with code: ${code}`, { exitCode: code })
})

process.on('warning', warning => {
  log.warn(warning.name, warning)
})

async function main () {
  const restServer = await createRestServer()

  const shutdown = (staticMeta = {}) => (dynamicMeta = {}) => {
    log.info(`LPWAN to shutdown.`, { ...staticMeta, ...dynamicMeta })
    restServer.close(() => {
      process.exit()
    })
  }

  process.on('SIGTERM', shutdown({ signal: 'SIGTERM' }))
  process.on('SIGINT', shutdown({ signal: 'SIGINT' }))

  restServer.on('error', err => {
    log.error(`REST server: ${err}`, { error: err })
    shutdown()({ error: err.toString() })
  })

  restServer.listen(config.port, () => {
    log.info(`Listening on ${config.port}`)
  })
}

main().catch(err => {
  log.log({ ...err, message: `${err}`, level: 'error' })
})
