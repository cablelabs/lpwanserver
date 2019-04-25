const { prisma } = require('../lib/prisma')
const httpError = require('http-errors')
const { onFail } = require('../lib/utils')

module.exports = class ReportingProtocol {
  createReportingProtocol (name, protocolHandler) {
    const data = { name, protocolHandler }
    return prisma.createReportingProtocol(data)
  }

  updateReportingProtocol ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing ReportingProtocol ID')
    return prisma.updateReportingProtocol({ data, where: { id } })
  }

  async retrieveReportingProtocol (id) {
    const rec = await onFail(400, () => prisma.reportingProtocol({ id }))
    if (!rec) throw httpError(404, 'Reporting protocol not found')
    return rec
  }

  retrieveReportingProtocols () {
    return prisma.reportingProtocols()
  }

  deleteReportingProtocol (id) {
    return onFail(400, () => prisma.deleteReportingProtocol({ id }))
  }
}
