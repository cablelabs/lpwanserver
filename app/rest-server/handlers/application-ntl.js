const { applicationNetworkTypeLinks } = require('../../models')
const R = require('ramda')
const { formatRelationshipsOut } = require('../../lib/prisma')
const { pipe, authorize: auth, parsePaginationQuery } = require('../middleware/openapi-backend')

module.exports = {
  createApplicationNetworkTypeLink: pipe(
    auth(['ApplicationNetworkTypeLink:create']),
    createApplicationNetworkTypeLink
  ),
  listApplicationNetworkTypeLinks: pipe(
    auth(['ApplicationNetworkTypeLink:list']),
    parsePaginationQuery,
    listApplicationNetworkTypeLinks
  ),
  loadApplicationNetworkTypeLink: pipe(
    auth(['ApplicationNetworkTypeLink:load']),
    loadApplicationNetworkTypeLink
  ),
  updateApplicationNetworkTypeLink: pipe(
    auth(['ApplicationNetworkTypeLink:update']),
    updateApplicationNetworkTypeLink
  ),
  removeApplicationNetworkTypeLink: pipe(
    auth(['ApplicationNetworkTypeLink:remove']),
    removeApplicationNetworkTypeLink
  )
}

async function createApplicationNetworkTypeLink (_, req, res) {
  const rec = await applicationNetworkTypeLinks.create(req.body)
  res.status(201).json({ id: rec.id })
}

async function listApplicationNetworkTypeLinks (_, req, res) {
  const [records, totalCount] = await applicationNetworkTypeLinks.list(req.query, { includeTotal: true })
  res.status(200).json({ records: records.map(formatRelationshipsOut), totalCount })
}

async function loadApplicationNetworkTypeLink (_, req, res) {
  const rec = await applicationNetworkTypeLinks.load(req.params.id)
  res.status(200).json(formatRelationshipsOut(rec))
}

async function updateApplicationNetworkTypeLink (_, req, res) {
  await applicationNetworkTypeLinks.update({ id: req.params.id, ...req.body })
  res.status(204).send()
}

async function removeApplicationNetworkTypeLink (_, req, res) {
  await applicationNetworkTypeLinks.remove(req.params.id)
  res.status(204).send()
}
