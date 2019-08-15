const { deviceProfiles } = require('../../models')
const { formatRelationshipsOut } = require('../../lib/prisma')
const { pipe, authorize: auth, parsePaginationQuery } = require('../middleware/openapi-backend')

module.exports = {
  createDeviceProfile: pipe(
    auth(['DeviceProfile:create']),
    createDeviceProfile
  ),
  listDeviceProfiles: pipe(
    auth(['DeviceProfile:list']),
    parsePaginationQuery,
    listDeviceProfiles
  ),
  loadDeviceProfile: pipe(
    auth(['DeviceProfile:load']),
    loadDeviceProfile
  ),
  updateDeviceProfile: pipe(
    auth(['DeviceProfile:update']),
    updateDeviceProfile
  ),
  removeDeviceProfile: pipe(
    auth(['DeviceProfile:remove']),
    removeDeviceProfile
  )
}

async function createDeviceProfile (_, req, res) {
  const rec = await deviceProfiles.create(req.body)
  res.status(201).json({ id: rec.id })
}

async function listDeviceProfiles (_, req, res) {
  const [ recs, totalCount ] = await deviceProfiles.list(req.query, { includeTotal: true })
  res.status(200).json({ records: recs.map(formatRelationshipsOut), totalCount })
}

async function loadDeviceProfile (_, req, res) {
  const rec = await deviceProfiles.load(req.params.id)
  res.status(200).json(formatRelationshipsOut(rec))
}

async function updateDeviceProfile (_, req, res) {
  await deviceProfiles.update({ id: req.params.id, ...req.body })
  res.status(204).send()
}

async function removeDeviceProfile (_, req, res) {
  await deviceProfiles.remove(req.params.id)
  res.status(204).send()
}
