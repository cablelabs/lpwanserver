const { prisma, formatRelationshipsIn } = require('../lib/prisma')
const httpError = require('http-errors')
const { logger } = require('../log')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const { redisClient } = require('../lib/redis')
const { createModel, create, update, remove } = require('./Model')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicProtocolData on ProtocolData {
    id
    dataIdentifier
    dataValue
    network {
      id
    }
    networkProtocol {
      id
    }
  }`
}

// ******************************************************************************
// Model Context
// ******************************************************************************
const modelContext = {
  DB: new CacheFirstStrategy({
    name: 'protocolData',
    pluralName: 'protocolDatas',
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
async function load (ctx, args) {
  const [ records ] = await ctx.DB.list(args)
  if (!records.length) throw httpError.NotFound()
  return records[0]
}

async function loadValue (ctx, { network, dataIdentifier }) {
  const rec = await this.load(ctx, { where: {
    networkId: network.id,
    networkProtocolId: network.networkProtocol.id,
    dataIdentifier
  } })
  return rec.dataValue
}

async function upsert (ctx, { network, dataIdentifier, dataValue }) {
  const where = {
    networkId: network.id,
    networkProtocolId: network.networkProtocol.id,
    dataIdentifier
  }
  try {
    const rec = await this.load({ where })
    return this.update({ where: { id: rec.id }, data: { dataValue } })
  }
  catch (err) {
    return this.create({ data: { ...where, dataValue } })
  }
}

function clearProtocolData (ctx, { networkId, networkProtocolId, keyStartsWith }) {
  const where = formatRelationshipsIn({
    networkId,
    networkProtocolId,
    dataIdentifier_contains: keyStartsWith
  })
  return prisma.deleteManyProtocolDatas(where)
}

function reverseLookupProtocolData (ctx, { networkId, keyLike, dataValue }) {
  const where = formatRelationshipsIn({
    networkId,
    dataIdentifier_contains: keyLike,
    dataValue
  })
  return prisma.protocolDatas({ where })
}

// ******************************************************************************
// Model
// ******************************************************************************
const model = createModel(
  modelContext,
  {
    load,
    loadValue,
    create,
    upsert,
    update,
    remove,
    clearProtocolData,
    reverseLookupProtocolData
  }
)

module.exports = {
  model,
  load,
  loadValue,
  upsert
}
