const { networkProviders } = require('../../models')
const { formatRelationshipsOut } = require('../../lib/prisma')
const { pipe, authorize: auth, parsePaginationQuery } = require('../middleware/openapi-backend')

module.exports = {
  createNetworkProvider: pipe(
    auth(['NetworkProvider:create']),
    createNetworkProvider
  ),
  listNetworkProviders: pipe(
    auth(['NetworkProvider:list']),
    parsePaginationQuery,
    listNetworkProviders
  ),
  loadNetworkProvider: pipe(
    auth(['NetworkProvider:load']),
    loadNetworkProvider
  ),
  updateNetworkProvider: pipe(
    auth(['NetworkProvider:update']),
    updateNetworkProvider
  ),
  removeNetworkProvider: pipe(
    auth(['NetworkProvider:remove']),
    removeNetworkProvider
  )
}

async function createNetworkProvider (_, req, res) {
  const rec = await networkProviders.create(req.body)
  res.status(201).json({ id: rec.id })
}

async function listNetworkProviders (_, req, res) {
  const [ recs, totalCount ] = await networkProviders.list(req.query, { includeTotal: true })
  res.status(200).json({ records: recs.map(formatRelationshipsOut), totalCount })
}

async function loadNetworkProvider (_, req, res) {
  const rec = await networkProviders.load(req.params.id)
  res.status(200).json(formatRelationshipsOut(rec))
}

async function updateNetworkProvider (_, req, res) {
  await networkProviders.update({ id: req.params.id, ...req.body })
  res.status(204).send()
}

async function removeNetworkProvider (_, req, res) {
  await networkProviders.remove(req.params.id)
  res.status(204).send()
}
