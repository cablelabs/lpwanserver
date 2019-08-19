const { prisma } = require('../lib/prisma')
const path = require('path')
const { redisClient } = require('../lib/redis')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const { logger } = require('../log')
const { createModel, create, list, load, update, remove } = require('./Model')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicReportingProtocol on ReportingProtocol {
    id
    name
    displayName
  }`
}

// ******************************************************************************
// Model Context
// ******************************************************************************
const modelContext = {
  // references to handler modules that have been imported
  handlers: {},

  // Database Client
  DB: new CacheFirstStrategy({
    name: 'reportingProtocol',
    pluralName: 'reportingProtocols',
    fragments,
    defaultFragmentKey: 'basic',
    prisma,
    redis: redisClient,
    log: logger.info.bind(logger)
  })
}

// ******************************************************************************
// Model API
// ******************************************************************************
async function initialize (ctx) {
  const [ records ] = await ctx.DB.list()
  const handlersDir = path.join(__dirname, '../reportingProtocols')
  records.forEach(x => {
    let Handler = require(path.join(handlersDir, x.protocolHandler))
    ctx.handlers[x.id] = new Handler({ reportingProtocolId: x.id })
  })
}

function getHandler (ctx, { id }) {
  return ctx.handlers[id]
}

// ******************************************************************************
// Model
// ******************************************************************************
const model = createModel(
  modelContext,
  {
    initialize,
    create,
    list,
    load,
    update,
    remove,
    getHandler
  }
)

module.exports = {
  model,
  initialize,
  list,
  getHandler
}
