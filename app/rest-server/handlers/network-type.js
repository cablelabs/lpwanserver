const { networkTypes } = require('../../models')
const { formatRelationshipsOut } = require('../../lib/prisma')
const { pipe, authorize: auth, parsePaginationQuery } = require('../middleware/openapi-backend')

module.exports = {
  listNetworkTypes: pipe(
    auth(['NetworkType:list']),
    parsePaginationQuery,
    listNetworkTypes
  ),
  loadNetworkType: pipe(
    auth(['NetworkType:load']),
    loadNetworkType
  )
}

async function listNetworkTypes (_, req, res) {
  const [ recs, totalCount ] = await networkTypes.list(req.query, { includeTotal: true })
  res.status(200).json({ records: recs.map(formatRelationshipsOut), totalCount })
}

async function loadNetworkType (_, req, res) {
  const rec = await networkTypes.load(req.params.id)
  res.status(200).json(formatRelationshipsOut(rec))
}
