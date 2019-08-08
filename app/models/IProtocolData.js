const { prisma, formatRelationshipsIn } = require('../lib/prisma')
const httpError = require('http-errors')
const { logger } = require('../log')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const { redisClient } = require('../lib/redis')

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
// Database Client
// ******************************************************************************
const DB = new CacheFirstStrategy({
  name: 'protocolData',
  pluralName: 'protocolDatas',
  fragments,
  defaultFragmentKey: 'basic',
  prisma,
  redis: redisClient,
  log: logger.info.bind(logger)
})

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = class ProtocolData {
  async load (networkId, networkProtocolId, dataIdentifier) {
    const [ records ] = await DB.list({ networkId, networkProtocolId, dataIdentifier })
    if (!records.length) throw httpError.NotFound()
    return records[0]
  }

  async loadValue (network, dataId) {
    const rec = await this.load(network.id, network.networkProtocol.id, dataId)
    return rec.dataValue
  }

  create (networkId, networkProtocolId, dataIdentifier, dataValue) {
    const data = { networkId, networkProtocolId, dataIdentifier, dataValue }
    return DB.create(data)
  }

  async upsert (network, dataId, dataValue) {
    try {
      const rec = await this.load(network.id, network.networkProtocol.id, dataId)
      return this.update({ id: rec.id, dataValue })
    }
    catch (err) {
      return this.create(network.id, network.networkProtocol.id, dataId, dataValue)
    }
  }

  update ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing ProtocolData ID')
    return DB.update({ id }, data)
  }

  remove (id) {
    return DB.remove({ id })
  }

  clearProtocolData (networkId, networkProtocolId, keyStartsWith) {
    const where = formatRelationshipsIn({
      networkId,
      networkProtocolId,
      dataIdentifier_contains: keyStartsWith
    })
    return prisma.deleteManyProtocolDatas(where)
  }

  reverseLookupProtocolData (networkId, keyLike, dataValue) {
    const where = formatRelationshipsIn({
      networkId,
      dataIdentifier_contains: keyLike,
      dataValue
    })
    return prisma.protocolDatas({ where })
  }
}
