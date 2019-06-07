const { prisma, loadRecord } = require('../lib/prisma')
const httpError = require('http-errors')
const { onFail } = require('../lib/utils')

module.exports = class NetworkType {
  create (name) {
    return prisma.createNetworkType({ name })
  }

  update ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing NetworkType ID')
    return prisma.updateNetworkType({ data, where: { id } })
  }

  remove (id) {
    return onFail(400, () => prisma.deleteNetworkType({ id }))
  }

  async list ({ limit, offset, ...where } = {}) {
    if (where.search) {
      where.name_contains = where.search
      delete where.search
    }
    const query = { where }
    if (limit) query.first = limit
    if (offset) query.skip = offset
    let [records, totalCount] = await Promise.all([
      prisma.networkTypes(query).$fragment(fragments.basic),
      prisma.networkTypesConnection({ where }).aggregate().count()
    ])
    return { totalCount, records }
  }

  load (id) {
    return loadNetworkType({ id })
  }

  loadByName (name) {
    return loadNetworkType({ name })
  }
}

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicNetworkType on NetworkType {
    id
    name
  }`
}

// ******************************************************************************
// Helpers
// ******************************************************************************
const loadNetworkType = loadRecord('networkType', fragments, 'basic')
