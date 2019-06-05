const { prisma, loadRecord, formatRelationshipsIn } = require('../lib/prisma')
const httpError = require('http-errors')
const { onFail } = require('../lib/utils')
const path = require('path')

module.exports = class ReportingProtocol {
  constructor () {
    this.handlers = {}
  }

  async initialize () {
    const { records } = await this.list()
    const handlersDir = path.join(__dirname, '../reportingProtocols')
    records.forEach(x => {
      let Handler = require(path.join(handlersDir, x.protocolHandler))
      this.handlers[x.id] = new Handler({ reportingProtocolId: x.id })
    })
  }

  create (name, protocolHandler) {
    const data = { name, protocolHandler }
    return prisma.createReportingProtocol(data)
  }

  update ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing ReportingProtocol ID')
    return prisma.updateReportingProtocol({ data, where: { id } })
  }

  load (id) {
    return loadReportingProtocol({ id })
  }

  async list ({ limit, offset, ...where } = {}) {
    where = formatRelationshipsIn(where)
    if (where.search) {
      where.name_contains = where.search
      delete where.search
    }
    const query = { where }
    if (limit) query.first = limit
    if (offset) query.skip = offset
    const [records, totalCount] = await Promise.all([
      prisma.reportingProtocols(query).$fragment(fragments.basic),
      prisma.reportingProtocolsConnection({ where }).aggregate().count()
    ])
    return { totalCount, records }
  }

  remove (id) {
    return onFail(400, () => prisma.deleteReportingProtocol({ id }))
  }

  getHandler (id) {
    return this.handlers[id]
  }
}

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicReportingProtocol on ReportingProtocol {
    id
    name
    protocolHandler
  }`
}

// ******************************************************************************
// Helpers
// ******************************************************************************
const loadReportingProtocol = loadRecord('reportingProtocol', fragments, 'basic')
