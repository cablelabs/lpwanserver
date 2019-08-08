const path = require('path')
const Ajv = require('ajv')
const schema = require('./schema.json')
const { buildConfig } = require('../lib/json-schema-config')
const fs = require('fs')

function normalizeFilePath (x) {
  const filePath = (!x || x.charAt(0) === '/') ? x : path.join(__dirname, '..', x)
  return filePath.charAt(filePath.length - 1) === '/' ? filePath.slice(0, -1) : filePath
}

function readAndParseConfigFile (filePath) {
  if (!filePath) return {}
  filePath = normalizeFilePath(filePath)
  return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }))
}

function validateConfig (data) {
  const ajv = new Ajv()
  const valid = ajv.validate(schema, data)
  if (!valid) {
    const error = new Error('The configuration object failed validation.')
    error.errors = ajv.errors
    throw error
  }
}

const config = buildConfig({
  schema,
  data: readAndParseConfigFile(process.env.config_file)
})

// Normalize file paths
const fileRegEx = /_(file|dir)/
const filePaths = Object.keys(config).filter(x => fileRegEx.test(x))
filePaths.forEach(x => {
  config[x] = normalizeFilePath(config[x])
})

// Validate config
validateConfig(config)

// add prisma_url to the environment
process.env.prisma_url = config.prisma_url

module.exports = config
