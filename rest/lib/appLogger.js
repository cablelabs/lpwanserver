// Centralized logging system for the REST application.
var restCallLogger = require('morgan')
var nconf = require('nconf')
var stackTrace = require('stack-trace')
var winston = require('winston')

exports.logger = winston.createLogger({
  level: 'warn',
  transports: [
    new winston.transports.File({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple()),
      filename: 'lpwan.log',
      level: 'info'
    })
  ]
})

var loggingEnabled
var loggingHeaders

exports.initRESTCallLogger = function (app) {
  var logFormat = nconf.get('log_format_morgan')
  if (logFormat) {
    app.use(restCallLogger(logFormat))
  }

  // Also init whether we do general logging
  loggingEnabled = nconf.get('logging_enabled')
  loggingHeaders = nconf.get('logging_headers')
}

exports.log = function (msg, level) {
  if (!level) level = 'info'
  if (loggingEnabled) {
    var header = ''
    if (loggingHeaders) {
      var date = new Date().toISOString()
      var frame = stackTrace.get()[1]
      var method = frame.getFunctionName()
      var line = frame.getLineNumber()
      var file = frame.getFileName().replace(/^.*[\\\/]/, '')

      header = '[' + date + '] ' +
                         file + ':' +
                         line + ': '

      if (level) this.logger.log(level, header + ':  ' + msg + "\n")
      else this.logger.info(header, msg)
    }
    else {
      if (level) this.logger.log(level, header + ':  ' + msg +"\n")
      this.logger.info('Message', msg)
    }
    if (level === 'info' || level === 'warn' || level === 'error') {
      if (typeof msg === 'object') {
        console.log(header + JSON.stringify(msg) + "\n")
      }
      else {
        console.log(header +
          msg)
      }
    }
  }
}
