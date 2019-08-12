const config = require('./config')
const https = require('https')
const fs = require('fs')

function createRestServer (app) {
  const opts = {
    key: fs.readFileSync(config.ssl_key_file),
    cert: fs.readFileSync(config.ssl_cert_file),
    requestCert: true,
    rejectUnauthorized: false
  }
  if (config.ssl_ca_file) {
    opts.ca = fs.readFileSync(config.ssl_ca_file)
  }
  if (config.ssl_crl_file) {
    opts.crl = fs.readFileSync(config.ssl_crl_file)
  }
  return https.createServer(opts, app)
}

module.exports = {
  createRestServer
}
