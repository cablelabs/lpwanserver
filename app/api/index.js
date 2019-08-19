const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const { logger } = require('../../log')

let apiDefinition
let openApiPath = path.join(__dirname, './openapi.yml')

try {
  apiDefinition = yaml.safeLoad(fs.readFileSync(openApiPath, 'utf8'))
}
catch (e) {
  logger.error('Failed to parse api.yml', e)
  process.exit(1)
}

module.exports = apiDefinition
