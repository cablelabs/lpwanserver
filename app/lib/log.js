const { createLogger, format, transports } = require('winston')
const config = require('../config')

const log = createLogger({
  level: config.log_level,
  defaultMeta: {
    // service: 'lpwanserver'
  },
  transports: [
    new transports.Console({
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
  log.add(new transports.File({ ...fileTransportOpts, filename: config.log_file }))
}
if (config.log_file_errors) {
  log.add(new transports.File({ ...fileTransportOpts, level: 'error', filename: config.log_file_errors }))
}

module.exports = {
  log
}
