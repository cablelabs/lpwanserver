const { prisma, formatRelationshipsIn } = require('../lib/prisma')
const httpError = require('http-errors')
const { create, update, remove } = require('./model-lib')

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
// Model Functions
// ******************************************************************************
async function load (ctx, args) {
  const [ records ] = await ctx.DB.list(args)
  if (!records.length) throw httpError.NotFound()
  return records[0]
}

async function loadValue (ctx, { network, dataIdentifier }) {
  const rec = await ctx.$self.load({ where: {
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
    const rec = await ctx.$self.load({ where })
    return ctx.$self.update({ where: { id: rec.id }, data: { dataValue } })
  }
  catch (err) {
    return ctx.$self.create({ data: { ...where, dataValue } })
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
module.exports = {
  api: {
    load,
    loadValue,
    create,
    upsert,
    update,
    remove,
    clearProtocolData,
    reverseLookupProtocolData
  },
  fragments
}
