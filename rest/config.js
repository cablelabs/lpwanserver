const path = require('path')
const Ajv = require('ajv')
const { ValidatedObservable } = require('./lib/observable')
const schema = require('../config/schema.json')
const R = require('ramda')
const { mutate } = require('./lib/utils')

const ajv = new Ajv()
const ajvValidate = ajv.compile(schema)

function validate (data) {
  const valid = ajvValidate(data)
  if (valid) return true
  throw new Error(ajv.errorsText())
}

// test if a string is true or TRUE
const trueRx = /^true$/i

// using the keys from the config schema, build an
// object using values from process.env
function buildEnvironmentVariablesConfig (schema) {
  const propertyKeys = Object.keys(schema.properties)
  let env = R.pick(propertyKeys, process.env)
  return Object.keys(env).reduce((acc, x) => {
    const { type } = schema.properties[x]
    switch (type) {
      case 'integer': return mutate(x, parseInt(env[x], 10), acc)
      case 'boolean': return mutate(x, trueRx.test(env[x]), acc)
      default: return mutate(x, env[x], acc)
    }
  }, {})
}

// build an object using values from the defaults in the schema
function buildConfigDefaults (schema, definitions) {
  return Object.keys(schema.properties).reduce((acc, prop) => {
    let spec = schema.properties[prop]
    if (spec.$ref) {
      spec = definitions[spec.$ref.replace('#/definitions/', '')]
      return mutate(prop, buildConfigDefaults(spec, definitions), acc)
    }
    return mutate(prop, spec.default, acc)
  }, {})
}

// import the config file indicated by process.env.config_file
function buildConfigFromFile (filePath, isAbsolutePath = false) {
  if (!filePath) return {}
  return isAbsolutePath
    ? require(filePath)
    : require(path.join(__dirname, '../config', filePath))
}

// merge the environment variables, config file values, and defaults
let configValues = R.merge(
  R.mergeDeepRight(
    buildConfigDefaults(schema, schema.definitions),
    buildConfigFromFile(process.env.config_file, trueRx.test(process.env.config_file_absolute))
  ),
  buildEnvironmentVariablesConfig(schema)
)

// set environment variables for the prisma client
// prisma client doesn't have access to config, so it needs env variables
Object.assign(
  process.env,
  R.pick(['prisma_protocol', 'prisma_host', 'prisma_port'], configValues)
)

const config = new ValidatedObservable({ validate })
config.setAllValues(configValues)

module.exports = config
