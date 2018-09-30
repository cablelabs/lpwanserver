// Centralized logging system for the REST application.
var stackTrace = require('stack-trace')
const {createLogger, format, transports} = require('winston')
const {combine, timestamp, prettyPrint} = format

const headers = format((info, opts) => {
  if (opts.headers) {
    let frame = stackTrace.get()[10]
    var line = frame.getLineNumber()
    var file = frame.getFileName().replace(/^.*[\\\/]/, '')
    info.label = '[' + file + '] ' + line + ': '
  }
  return info
})

module.exports = function () {
  return createLogger({
    format: combine(
      headers({headers: true}),
      timestamp(),
      prettyPrint()
    ),
    transports: [
      new transports.Console({
        level: 'warn',
        depth: true
      }),
      new transports.File({
        level: 'info',
        depth: true,
        filename: 'lpwan.log'
      })]
  })
}
