const { prisma } = require('../lib/prisma')
const httpError = require('http-errors')
const { renameKeys } = require('../lib/utils')
const path = require('path')
const { redisClient } = require('../lib/redis')
const CacheFirstStrategy = require('../../lib/prisma-cache/src/cache-first-strategy')
var appLogger = require('../lib/appLogger.js')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicReportingProtocol on ReportingProtocol {
    id
    name
    protocolHandler
  }`
}

// ******************************************************************************
// Database Client
// ******************************************************************************
const DB = new CacheFirstStrategy({
  name: 'reportingProtocol',
  pluralName: 'reportingProtocols',
  fragments,
  defaultFragmentKey: 'basic',
  prisma,
  redis: redisClient,
  log: appLogger.log.bind(appLogger)
})

// ******************************************************************************
// Helpers
// ******************************************************************************
const renameQueryKeys = renameKeys({ search: 'name_contains' })

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = class ReportingProtocol {
  constructor () {
    this.handlers = {}
  }

  async initialize () {
    const [ records ] = await DB.list()
    const handlersDir = path.join(__dirname, '../reportingProtocols')
    records.forEach(x => {
      let Handler = require(path.join(handlersDir, x.protocolHandler))
      this.handlers[x.id] = new Handler({ reportingProtocolId: x.id })
    })
  }

  load (id) {
    return DB.load({ id })
  }

  async list (query = {}, opts) {
    return DB.list(renameQueryKeys(query), opts)
  }

  create (name, protocolHandler) {
    return DB.create({ name, protocolHandler })
  }

  update ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing ReportingProtocol ID')
    return DB.update({ id }, data)
  }

  remove (id) {
    return DB.remove({ id })
  }

  getHandler (id) {
    return this.handlers[id]
  }
}
