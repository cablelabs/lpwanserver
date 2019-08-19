const { users } = require('../../models')
const httpError = require('http-errors')
const { formatRelationshipsOut } = require('../../lib/prisma')
const { pipe, authorize: auth, parsePaginationQuery } = require('../middleware/openapi-backend')

module.exports = {
  createUser: pipe(
    auth(['User:create']),
    createUser
  ),
  listUsers: pipe(
    auth(['User:list']),
    parsePaginationQuery,
    listUsers
  ),
  loadUser: pipe(
    auth(),
    loadUser
  ),
  updateUser: pipe(
    auth(),
    updateUser
  ),
  removeUser: pipe(
    auth(['User:remove']),
    removeUser
  ),
  loadMyUser: pipe(
    auth(),
    loadMyUser
  ),
  verifyUserEmail: verifyUserEmail
}

async function listUsers (_, req, res) {
  const [records, totalCount] = await users.list(req.query, { includeTotal: true })
  res.status(200).json({ records: records.map(formatRelationshipsOut), totalCount })
}

function loadMyUser (_, req, res) {
  res.status(200).json(formatRelationshipsOut(req.user))
}

async function loadUser (_, req, res) {
  const authorized =
    req.user.id === req.params.id ||
    users.hasPermissions(req.user, ['User:read'])
  if (!authorized) throw new httpError.Forbidden()
  const rec = await users.load(req.params.id)
  res.status(200).json(formatRelationshipsOut(rec))
}

async function createUser (_, req, res) {
  const rec = await users.create(req.body)
  res.status(201).json({ id: rec.id })
}

async function updateUser (_, req, res) {
  const respond = async () => {
    await users.update({ id: req.params.id, ...req.body })
    res.status(204).send()
  }
  if (users.hasPermissions(req.user, ['User:update'])) {
    return respond()
  }
  if (req.user.id === req.params.id) {
    // limit what fields a user can change
    const allowed = ['email', 'password']
    const keys = Object.keys(req.body)
    if (keys.every(x => allowed.includes(x))) {
      return respond()
    }
  }
  throw new httpError.Forbidden()
}

async function removeUser (_, req, res) {
  if (req.user.id === req.params.id) {
    throw httpError(403, 'Cannot delete your own account.')
  }
  await users.remove(req.params.id)
  res.status(204).send()
}

async function verifyUserEmail (_, req, res) {
  await users.handleEmailVerifyResponse(
    req.params.uuid,
    req.query.function,
    req.query.source
  )
  res.status(204).send()
}
