const R = require('ramda')

// using the keys from the config schema, build an
// object using values from process.env
function buildEnvironmentVariablesConfig (schema) {
  const trueRx = /^true$/i
  const propertyKeys = Object.keys(schema.properties)
  let env = R.pick(propertyKeys, process.env)
  return Object.keys(env).reduce((acc, x) => {
    const { type } = schema.properties[x]
    switch (type) {
      case 'integer': return R.assoc(x, parseInt(env[x], 10), acc)
      case 'boolean': return R.assoc(x, trueRx.test(env[x]), acc)
      default: return R.assoc(x, env[x], acc)
    }
  }, {})
}

// build an object using values from the defaults in the schema
function buildConfigDefaults (schema, definitions) {
  return Object.keys(schema.properties).reduce((acc, prop) => {
    let spec = schema.properties[prop]
    if (spec.$ref) {
      spec = definitions[spec.$ref.replace('#/definitions/', '')]
      return R.assoc(prop, buildConfigDefaults(spec, definitions), acc)
    }
    return R.assoc(prop, spec.default, acc)
  }, {})
}

function buildConfig ({ schema, data = {} }) {
  return R.merge(
    R.mergeDeepRight(
      buildConfigDefaults(schema, schema.definitions),
      data
    ),
    buildEnvironmentVariablesConfig(schema)
  )
}

module.exports = {
  buildConfig
}
