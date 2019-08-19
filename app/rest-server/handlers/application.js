const { applications, devices } = require('../../models')
const { formatRelationshipsOut } = require('../../lib/prisma')
const { pipe, authorize: auth, parsePaginationQuery } = require('../middleware/openapi-backend')

module.exports = {
  createApplication: pipe(
    auth(['Application:create']),
    createApplication
  ),
  listApplications: pipe(
    auth(['Application:list']),
    parsePaginationQuery,
    listApplications
  ),
  loadApplication: pipe(
    auth(['Application:load']),
    loadApplication
  ),
  updateApplication: pipe(
    auth(['Application:update']),
    updateApplication
  ),
  removeApplication: pipe(
    auth(['Application:remove']),
    removeApplication
  ),
  bulkCreateDevices: pipe(
    auth(['Device:create']),
    bulkCreateDevices
  )
}

async function createApplication (_, req, res) {
  const rec = await applications.create(req.body)
  res.status(201).json({ id: rec.id })
}

async function listApplications (_, req, res) {
  const [ recs, totalCount ] = await applications.list(req.query, { includeTotal: true })
  res.status(200).json({ records: recs.map(formatRelationshipsOut), totalCount })
}

async function loadApplication (_, req, res) {
  const rec = await applications.load(req.params.id)
  res.status(200).json(formatRelationshipsOut(rec))
}

async function updateApplication (_, req, res) {
  await applications.update({ id: req.params.id, ...req.body })
  res.status(204).send()
}

async function removeApplication (_, req, res) {
  await applications.remove(req.params.id)
  res.status(204).send()
}

async function bulkCreateDevices (_, req, res) {
  let result = await devices.importDevices({
    ...req.body,
    applicationId: req.params.id
  })
  res.status(200).json(result)
}
