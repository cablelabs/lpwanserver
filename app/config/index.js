const path = require('path')
const schema = require('./schema.json')
const { buildConfig } = require('../lib/json-schema-config')
const fs = require('fs')
const { validateSchema } = require('../lib/utils')

function normalizeFilePath (x) {
  if (!x) return x
  const filePath = x.charAt(0) === '/' ? x : path.join(__dirname, '..', x)
  return filePath.charAt(filePath.length - 1) === '/' ? filePath.slice(0, -1) : filePath
}

function readAndParseConfigFile (filePath) {
  if (!filePath) return {}
  filePath = normalizeFilePath(filePath)
  return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }))
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
validateSchema('Application configuration failed validation', schema)(config)

// add prisma_url to the environment
process.env.prisma_url = config.prisma_url

module.exports = config
