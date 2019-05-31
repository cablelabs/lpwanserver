// Main application, loaded from bin/rest
//
// This module handles translating REST requests to the methods that handle
// those operations.  This module also manages the login sessions and
// permissions required to execute the various operations.

const config = require('./rest/config')
var https = require('https')
var fs = require('fs')
const createApp = require('./restApp')

// Catch unhandled promise rejections.
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Promise Rejection at: Promise ', p, ' reason: ', reason)
  console.log('Stack:', reason.stack)
  // application specific logging, throwing an error, or other logic here
})

async function createServer () {
  const sslFiles = {
    key: fs.readFileSync(config.get('ssl_key_file'), { encoding: 'utf8' }),
    cert: fs.readFileSync(config.get('ssl_cert_file'), { encoding: 'utf8' })
  }
  if (config.get('ssl_ca_file')) {
    sslFiles.ca = fs.readFileSync(config.get('ssl_ca_file'), { encoding: 'utf8' })
  }
  if (config.get('ssl_crl_file')) {
    sslFiles.ca = fs.readFileSync(config.get('ssl_crl_file'), { encoding: 'utf8' })
  }

  const httpServerOpts = {
    ...sslFiles,
    // request client certificates from IP devices
    requestCert: true,
    // don't reject API calls if client doesn't provide a certificate
    rejectUnauthorized: false
  }

  const app = await createApp()

  const server = https.createServer(httpServerOpts, app).listen({
    port: config.get('port'),
    exclusive: true
  })
  console.log('REST https server starting on port ' + config.get('port'))
  return server
}

function closeServer (server) {
  return new Promise((resolve, reject) => {
    server.close(err => {
      if (err) return reject(err)
      resolve()
    })
  })
}

module.exports = {
  createServer,
  closeServer
}
