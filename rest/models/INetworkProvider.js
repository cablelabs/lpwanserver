const { prisma, loadRecord } = require('../lib/prisma')
const httpError = require('http-errors')
const { onFail } = require('../lib/utils')

module.exports = class NetworkProvider {
  create (name) {
    return prisma.createNetworkProvider({ name })
  }

  update ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing NetworkProvider ID')
    return prisma.updateNetworkProvider({ data, where: { id } })
  }

  load (id) {
    return loadNetworkProvider({ id })
  }

  async list ({ limit, offset, ...where } = {}) {
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

  remove (id) {
    return onFail(400, () => prisma.deleteNetworkProvider({ id }))
  }
}

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicNetworkProvider on NetworkProvider {
    id
    name
  }`
}

// ******************************************************************************
// Helpers
// ******************************************************************************
const loadNetworkProvider = loadRecord('networkProvider', fragments, 'basic')
