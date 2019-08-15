const config = require('../config')
const https = require('https')
const fs = require('fs')
const createApp = require('./app')

async function createRestServer () {
  const app = await createApp()
  const opts = {
    // HTTPS required to get client cert from 3GPP devices
    key: fs.readFileSync(config.ssl_key_file),
    cert: fs.readFileSync(config.ssl_cert_file),
    // 3GPP devices authenticate with an x509 client cert
    requestCert: true,
    // But dont't make the cert required for most API users
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
