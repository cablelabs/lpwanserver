const { reportingProtocols } = require('../../models')
const { formatRelationshipsOut } = require('../../lib/prisma')
const { pipe, authorize: auth, parsePaginationQuery } = require('../middleware/openapi-backend')

module.exports = {
  listReportingProtocols: pipe(
    auth(['ReportingProtocol:list']),
    parsePaginationQuery,
    listReportingProtocols
  ),
  loadReportingProtocol: pipe(
    auth(['ReportingProtocol:load']),
    loadReportingProtocol
  )
}

async function listReportingProtocols (_, req, res) {
  const [ recs, totalCount ] = await reportingProtocols.list(req.query, { includeTotal: true })
  res.status(200).json({ records: recs.map(formatRelationshipsOut), totalCount })
}

async function loadReportingProtocol (_, req, res) {
  const rec = await reportingProtocols.load(req.params.id)
  res.status(200).json(formatRelationshipsOut(rec))
}
