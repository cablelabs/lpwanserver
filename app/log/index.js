const { createLogger, format, transports } = require('winston')
const config = require('../config')

const logger = createLogger({
  level: config.log_level,
  defaultMeta: {
    // service: 'lpwanserver'
  },
  transports: [
    new transports.Console({
      level: 'debug',
      format: format.combine(
        format.colorize(),
        format.simple(),
        format.errors({ stack: true })
      ),
      handleExceptions: true
    })
  ]
})

// Logging to files
const fileTransportOpts = {
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  handleExceptions: true
}
if (config.log_file) {
  logger.add(new transports.File({ ...fileTransportOpts, level: 'info', filename: config.log_file }))
}
if (config.log_file_errors) {
  logger.add(new transports.File({ ...fileTransportOpts, level: 'error', filename: config.log_file_errors }))
}

module.exports = {
  logger
}
