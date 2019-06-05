// Main application, loaded from bin/rest
//
// This module handles translating REST requests to the methods that handle
// those operations.  This module also manages the login sessions and
// permissions required to execute the various operations.

const config = require('./rest/config')
var https = require('https')
const createApp = require('./restApp')
const appLogger = require('./rest/lib/appLogger')

async function createServer () {
  const app = await createApp()
  const opts = {
    key: config.get('ssl_key'),
    cert: config.get('ssl_cert'),
    ca: config.get('ssl_ca'),
    crl: config.get('ssl_crl'),
    requestCert: true,
    rejectUnauthorized: false
  }
  const listenOpts = { port: config.get('port') }
  const server = https.createServer(opts, app).listen(listenOpts, err => {
    if (err) appLogger.log(`${err}`, 'error')
    else appLogger.log('REST https server starting on port ' + config.get('port'))
  })
  return server
}

module.exports = {
  createServer
}
