const path = require('path')
const Ajv = require('ajv')
const Observable = require('./lib/observable')
const schema = require('../config/schema.json')
const R = require('ramda')
const { buildConfig } = require('./lib/json-schema-config')

// import the config file indicated by process.env.config_file
function buildConfigFromFile (filePath) {
  if (!filePath) return {}
  const isAbsolutePath = filePath.charAt(0) === '/'
  return isAbsolutePath
    ? require(filePath)
    : require(path.join(__dirname, '../config', filePath))
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

module.exports = config
