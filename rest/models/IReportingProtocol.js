const { prisma, loadRecord } = require('../lib/prisma')
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

  list () {
    return prisma.reportingProtocols()
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
