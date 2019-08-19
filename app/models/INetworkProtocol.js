const path = require('path')
const { prisma } = require('../lib/prisma')
const { renameKeys } = require('../lib/utils')
const registerNetworkProtocols = require('../networkProtocols/register')
const { redisClient } = require('../lib/redis')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const { logger } = require('../log')
const { createModel, create, load, update, remove } = require('./Model')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicNetworkProtocol on NetworkProtocol {
    id
    name
    displayName
    version
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
    name: 'networkProtocol',
    pluralName: 'networkProtocols',
    fragments,
    defaultFragmentKey: 'basic',
    prisma,
    redis: redisClient,
    log: logger.info.bind(logger)
  })
}

// ******************************************************************************
// Helpers
// ******************************************************************************
const handlerDir = path.join(__dirname, '../networkProtocols/handlers')

function addMetadata (rec) {
  return {
    ...rec,
    metaData: require(path.join(handlerDir, rec.protocolHandler, 'metadata'))
  }
}
const renameQueryKeys = renameKeys({
  search: 'name_contains',
  version: 'version_contains'
})

// ******************************************************************************
// Model API
// ******************************************************************************
async function initialize (ctx) {
  await registerNetworkProtocols(ctx.$models)
  const [ records ] = await ctx.DB.list()
  const handlersDir = path.join(__dirname, '../networkProtocols/handlers')
  records.forEach(x => {
    let Handler = require(path.join(handlersDir, x.protocolHandler))
    this.handlers[x.id] = new Handler({ modelAPI: ctx.$models, networkProtocolId: x.id })
  })
}

async function list (ctx, { where = {}, ...opts }) {
  let [records, totalCount] = await ctx.DB.list({ where: renameQueryKeys(where), ...opts })
  return [records.map(addMetadata), totalCount]
}

async function upsert (ctx, { version, name, ...np }) {
  const [nps] = await this.list(ctx, { where: { search: name, version }, limit: 1 })
  if (nps.length) {
    return this.update(ctx, { where: { id: nps[0].id }, data: np })
  }
  return this.create(ctx, { data: { ...np, version, name } })
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
  create,
  list,
  upsert,
  getHandler
}
