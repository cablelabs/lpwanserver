const { prisma } = require('../lib/prisma')
const httpError = require('http-errors')
const { onFail } = require('../lib/utils')

module.exports = class NetworkProvider {
  createNetworkProvider (name) {
    return prisma.createNetworkProvider({ name })
  }

  updateNetworkProvider ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing NetworkProvider ID')
    return prisma.updateNetworkProvider({ data, where: { id } })
  }

  async retrieveNetworkProvider (id) {
    const rec = await onFail(400, () => prisma.networkProvider({ id }))
    if (!rec) throw httpError(404, 'NetworkProvider not found')
    return rec
  }

  async retrieveNetworkProviders ({ limit, offset, ...where } = {}) {
    if (where.search) {
      where.name_contains = where.search
      delete where.search
    }
    const query = { where }
    if (limit) query.first = limit
    if (offset) query.skip = offset
    const [records, totalCount] = await Promise.all([
      prisma.networkProviders(query),
      prisma.networkProvidersConnection({ where }).aggregate().count()
    ])
    return { totalCount, records }
  }

  deleteNetworkProvider (id) {
    return onFail(400, () => prisma.deleteNetworkProvider({ id }))
  }
}
