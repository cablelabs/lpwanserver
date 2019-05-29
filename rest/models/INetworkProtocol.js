const path = require('path')
const { prisma, formatInputData, formatRelationshipsIn, loadRecord } = require('../lib/prisma')
const httpError = require('http-errors')
const { onFail } = require('../lib/utils')
const registerNetworkProtocols = require('../networkProtocols/register')

const handlerDir = path.join(__dirname, '../networkProtocols/handlers')

module.exports = class NetworkProtocol {
  constructor () {
    this.handlers = {}
  }

  async initialize (modelAPI) {
    await registerNetworkProtocols(modelAPI)
    const { records } = await this.list()
    const handlersDir = path.join(__dirname, '../networkProtocols/handlers')
    records.forEach(x => {
      let Handler = require(path.join(handlersDir, x.protocolHandler))
      this.handlers[x.id] = new Handler({ modelAPI, networkProtocolId: x.id })
    })
  }

  async create (name, networkTypeId, protocolHandler, version, masterProtocolId) {
    const data = formatInputData({
      name,
      protocolHandler,
      networkProtocolVersion: version,
      networkTypeId,
      masterProtocolId
    })
    let rec = await prisma.createNetworkProtocol(data).$fragment(fragments.basic)
    if (!masterProtocolId) {
      rec = await this.update({ id: rec.id, masterProtocolId: rec.id })
    }
    return rec
  }

  async upsert ({ networkProtocolVersion, ...np }) {
    const { records } = await this.list({ search: np.name, networkProtocolVersion })
    if (records.length) {
      return this.update({ id: records[0].id, ...np })
    }
    return this.create(np.name, np.networkTypeId, np.protocolHandler, networkProtocolVersion, np.masterProtocolId)
  }

  update ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing NetworkProtocol ID')
    data = formatInputData(data)
    return prisma.updateNetworkProtocol({ data, where: { id } }).$fragment(fragments.basic)
  }

  load (id) {
    return loadNetworkProtocol({ id })
  }

  async list ({ limit, offset, ...where } = {}) {
    where = formatRelationshipsIn(where)
    if (where.search) {
      where.name_contains = where.search
      delete where.search
    }
    if (where.networkProtocolVersion) {
      where.networkProtocolVersion_contains = where.networkProtocolVersion
      delete where.networkProtocolVersion
    }
    const query = { where }
    if (limit) query.first = limit
    if (offset) query.skip = offset
    // if (Object.keys(where).length) {
    const [records, totalCount] = await Promise.all([
      prisma.networkProtocols(query).$fragment(fragments.basic),
      prisma.networkProtocolsConnection({ where }).aggregate().count()
    ])
    return { totalCount, records: records.map(addMetadata) }
  }

  remove (id) {
    return onFail(400, () => prisma.deleteNetworkProtocol({ id }))
  }

  getHandler (id) {
    return this.handlers[id]
  }
}

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
// Helpers
// ******************************************************************************
function addMetadata (rec) {
  return {
    ...rec,
    metaData: require(path.join(handlerDir, rec.protocolHandler, 'metadata'))
  }
}

const loadNetworkProtocol = loadRecord('networkProtocol', fragments, 'basic')
