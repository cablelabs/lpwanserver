const { networks } = require('../../models')
const { formatRelationshipsOut } = require('../../lib/prisma')
const { pipe, authorize: auth, parsePaginationQuery } = require('../middleware/openapi-backend')

module.exports = {
  createNetwork: pipe(
    auth(['Network:create']),
    createNetwork
  ),
  listNetworks: pipe(
    auth(['Network:list']),
    parsePaginationQuery,
    listNetworks
  ),
  loadNetwork: pipe(
    auth(['Network:load']),
    loadNetwork
  ),
  updateNetwork: pipe(
    auth(['Network:update']),
    updateNetwork
  ),
  removeNetwork: pipe(
    auth(['Network:remove']),
    removeNetwork
  )
}

async function createNetwork (_, req, res) {
  const rec = await networks.create(req.body)
  res.status(201).json({ id: rec.id })
}

async function listNetworks (_, req, res) {
  const [ recs, totalCount ] = await networks.list(req.query, { includeTotal: true })
  res.status(200).json({ records: recs.map(formatRelationshipsOut), totalCount })
}

async function loadNetwork (_, req, res) {
  const rec = await networks.load(req.params.id)
  res.status(200).json(formatRelationshipsOut(rec))
}

async function updateNetwork (_, req, res) {
  await networks.update({ id: req.params.id, ...req.body })
  res.status(204).send()
}

async function removeNetwork (_, req, res) {
  await networks.remove(req.params.id)
  res.status(204).send()
}
