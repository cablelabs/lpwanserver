const path = require('path')
const { prisma } = require('../lib/prisma')
const httpError = require('http-errors')
const { renameKeys } = require('../lib/utils')
const registerNetworkProtocols = require('../networkProtocols/register')
const { redisClient } = require('../lib/redis')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const { logger } = require('../log')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicNetworkProtocol on NetworkProtocol {
    id
    name
    protocolHandler
    networkProtocolVersion
    masterProtocol {
      id
    }
    networkType {
      id
    }
  }`
}

// ******************************************************************************
// Database Client
// ******************************************************************************
const DB = new CacheFirstStrategy({
  name: 'networkProtocol',
  pluralName: 'networkProtocols',
  fragments,
  defaultFragmentKey: 'basic',
  prisma,
  redis: redisClient,
  log: logger.info.bind(logger)
})

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
  networkProtocolVersiona: 'networkProtocolVersion_contains'
})

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = class NetworkProtocol {
  constructor () {
    this.handlers = {}
  }

  async initialize (modelAPI) {
    await registerNetworkProtocols(modelAPI)
    const [ nps ] = await this.list()
    const handlersDir = path.join(__dirname, '../networkProtocols/handlers')
    nps.forEach(x => {
      let Handler = require(path.join(handlersDir, x.protocolHandler))
      this.handlers[x.id] = new Handler({ modelAPI, networkProtocolId: x.id })
    })
  }

  load (id) {
    return DB.load({ id })
  }

  async list (query = {}, opts) {
    let [ records, totalCount ] = await DB.list(renameQueryKeys(query), opts)
    return [records.map(addMetadata), totalCount]
  }

  async create (name, networkTypeId, protocolHandler, version, masterProtocolId) {
    const data = {
      name,
      protocolHandler,
      networkProtocolVersion: version,
      networkTypeId,
      masterProtocolId
    }
    let rec = await DB.create(data)
    if (!masterProtocolId) {
      rec = await this.update({ id: rec.id, masterProtocolId: rec.id })
    }
    return rec
  }

  update ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing NetworkProtocol ID')
    return DB.update({ id }, data)
  }

  async upsert ({ networkProtocolVersion, ...np }) {
    const [nps] = await this.list({ search: np.name, networkProtocolVersion, limit: 1 })
    if (nps.length) {
      return this.update({ id: nps[0].id, ...np })
    }
    return this.create(np.name, np.networkTypeId, np.protocolHandler, networkProtocolVersion, np.masterProtocolId)
  }

  remove (id) {
    return DB.remove({ id })
  }

  getHandler (id) {
    return this.handlers[id]
  }
}
