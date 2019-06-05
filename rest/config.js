const path = require('path')
const Ajv = require('ajv')
const Observable = require('./lib/observable')
const schema = require('../config/schema.json')
const R = require('ramda')
const { buildConfig } = require('./lib/json-schema-config')
const { normalizeFilePath } = require('./lib/utils')
const fs = require('fs')

// import the config file indicated by process.env.config_file
function buildConfigFromFile (filePath) {
  if (!filePath) return {}
  return require(normalizeFilePath(filePath))
}

const data = buildConfigFromFile(process.env.config_file)
const configValues = buildConfig({ schema, data })

// set environment variables for the prisma client
// prisma client doesn't have access to config, so it needs env variables
Object.assign(
  process.env,
  R.pick(['prisma_protocol', 'prisma_host', 'prisma_port'], configValues)
)

const ajv = new Ajv()
const ajvValidate = ajv.compile(schema)

function validate (data) {
  const valid = ajvValidate(data)
  if (valid) return true
  throw new Error(ajv.errorsText())
}

const config = new Observable({ validate })
config.setAllValues(configValues)

// Cache in memory the contents of the TLS files
config.set('ssl_key', fs.readFileSync(config.get('ssl_key_file')))
config.set('ssl_cert', fs.readFileSync(config.get('ssl_cert_file')))
if (config.get('ssl_ca_file')) {
  config.set('ssl_ca', fs.readFileSync(config.get('ssl_ca_file')))
}
if (config.get('ssl_crl_file')) {
  config.set('ssl_crl', fs.readFileSync(config.get('ssl_crl_file')))
}

module.exports = config
