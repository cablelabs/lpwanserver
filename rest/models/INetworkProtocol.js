const path = require('path')
const { prisma, formatInputData, formatRelationshipsIn } = require('../lib/prisma')
const httpError = require('http-errors')
const { onFail } = require('../lib/utils')

const handlerDir = path.join(__dirname, '../networkProtocols/handlers')

module.exports = class NetworkProtocol {
  async create (name, networkTypeId, protocolHandler, version, masterProtocol) {
    const data = formatInputData({
      name,
      protocolHandler,
      networkProtocolVersion: version,
      networkTypeId,
      masterProtocol
    })
    let rec = await prisma.createNetworkProtocol(data).$fragment(fragments.basic)
    if (!masterProtocol) {
      rec = await this.update({ id: rec.id, masterProtocol: rec.id })
    }
    return rec
  }

  async upsert ({ networkProtocolVersion, ...np }) {
    const { records } = await this.list({ search: np.name, networkProtocolVersion })
    if (records.length) {
      return this.update({ id: records[0].id, ...np })
    }
    return this.create(np.name, np.networkTypeId, np.protocolHandler, networkProtocolVersion, np.masterProtocol)
  }

  update ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing NetworkProtocol ID')
    data = formatInputData(data)
    return prisma.updateNetworkProtocol({ data, where: { id } }).$fragment(fragments.basic)
  }

  async load (id) {
    const rec = await onFail(400, () => prisma.networkProtocol({ id }).$fragment(fragments.basic))
    if (!rec) throw httpError(404, 'NetworkProtocol not found')
    return addMetadata(rec)
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

  deleteNetworkProtocol (id) {
    return onFail(400, () => prisma.deleteNetworkProtocol({ id }))
  }
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

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicNetworkProtocol on NetworkProtocol {
    id
    name
    protocolHandler
    networkProtocolVersion
    masterProtocol
    networkType {
      id
    }
  }`
}
