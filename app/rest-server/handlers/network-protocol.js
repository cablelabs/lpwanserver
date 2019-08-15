const { networkProtocols } = require('../../models')
const { formatRelationshipsOut } = require('../../lib/prisma')
const { pipe, authorize: auth, parsePaginationQuery } = require('../middleware/openapi-backend')

module.exports = {
  listNetworkProtocols: pipe(
    auth(['NetworkProtocol:list']),
    parsePaginationQuery,
    listNetworkProtocols
  ),
  loadNetworkProtocol: pipe(
    auth(['NetworkProtocol:load']),
    loadNetworkProtocol
  )
}

async function listNetworkProtocols (_, req, res) {
  const [ recs, totalCount ] = await networkProtocols.list(req.query, { includeTotal: true })
  res.status(200).json({ records: recs.map(formatRelationshipsOut), totalCount })
}

async function loadNetworkProtocol (_, req, res) {
  const rec = await networkProtocols.load(req.params.id)
  res.status(200).json(formatRelationshipsOut(rec))
}
