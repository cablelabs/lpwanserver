const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const { log } = require('../lib/log')

let apiDefinition
let openApiPath = path.join(__dirname, './openapi.yml')

try {
  apiDefinition = yaml.safeLoad(fs.readFileSync(openApiPath, 'utf8'))
}
catch (e) {
  log.error('Failed to open or parse openapi.yml', e)
  process.exit(1)
}

module.exports = apiDefinition
