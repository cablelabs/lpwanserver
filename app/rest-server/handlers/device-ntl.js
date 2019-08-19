const { deviceNetworkTypeLinks } = require('../../models')
const { formatRelationshipsOut } = require('../../lib/prisma')
const { pipe, authorize: auth, parsePaginationQuery } = require('../middleware/openapi-backend')

module.exports = {
  createDeviceNetworkTypeLink: pipe(
    auth(['DeviceNetworkTypeLink:create']),
    createDeviceNetworkTypeLink
  ),
  listDeviceNetworkTypeLinks: pipe(
    auth(['DeviceNetworkTypeLink:list']),
    parsePaginationQuery,
    listDeviceNetworkTypeLinks
  ),
  loadDeviceNetworkTypeLink: pipe(
    auth(['DeviceNetworkTypeLink:load']),
    loadDeviceNetworkTypeLink
  ),
  updateDeviceNetworkTypeLink: pipe(
    auth(['DeviceNetworkTypeLink:update']),
    updateDeviceNetworkTypeLink
  ),
  removeDeviceNetworkTypeLink: pipe(
    auth(['DeviceNetworkTypeLink:remove']),
    removeDeviceNetworkTypeLink
  )
}

async function createDeviceNetworkTypeLink (_, req, res) {
  const rec = await deviceNetworkTypeLinks.create(req.body)
  res.status(201).json({ id: rec.id })
}

async function listDeviceNetworkTypeLinks (_, req, res) {
  const [records, totalCount] = await deviceNetworkTypeLinks.list(req.query, { includeTotal: true })
  res.status(200).json({ records: records.map(formatRelationshipsOut), totalCount })
}

async function loadDeviceNetworkTypeLink (_, req, res) {
  const rec = await deviceNetworkTypeLinks.load(req.params.id)
  res.status(200).json(formatRelationshipsOut(rec))
}

async function updateDeviceNetworkTypeLink (_, req, res) {
  await deviceNetworkTypeLinks.update({ id: req.params.id, ...req.body })
  res.status(204).send()
}

async function removeDeviceNetworkTypeLink (_, req, res) {
  await deviceNetworkTypeLinks.remove(req.params.id)
  res.status(204).send()
}
