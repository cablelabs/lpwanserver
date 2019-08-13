const { users, companies } = require('../../models')
const httpError = require('http-errors')
const { formatRelationshipsOut } = require('../../lib/prisma')

async function listUsers (_, req, res) {
  const [records, totalCount] = await users.list(req.query, { includeTotal: true })
  res.status(200).json({ records: records.map(formatRelationshipsOut), totalCount })
}

function loadMyUser (_, req, res) {
  res.status(200).json(formatRelationshipsOut(req.user))
}

async function loadUser (_, req, res) {
  const user = await users.load(req.params.id)
  const respond = () => res.status(200).json(formatRelationshipsOut(user))
  if (user.id === req.user.id) return respond()
  if (user.company.id === req.user.company.id) return respond()
  const company = await companies.load(req.user.company.id)
  if (company.type === 'ADMIN') return respond()
  throw new httpError.Forbidden()
}

async function createUser (_, req, res) {
  const rec = await users.create(req.body)
  res.status(201).json({ id: rec.id })
}

async function updateUser (_, req, res) {
  const user = await users.load(req.params.id)
  let authorized = user.id === req.user.id || user.company.id === req.user.company.id
  if (!authorized) {
    const company = await companies.load(req.user.company.id)
    if (company.type === 'ADMIN') authorized = true
  }
  if (!authorized) throw new httpError.Forbidden()
  await users.update({ id: req.params.id, ...req.body })
  res.status(204).send()
}

async function removeUser (_, req, res) {
  if (req.user.id === req.params.id) {
    throw httpError(403, 'Cannot delete your own account.')
  }
  const user = await users.load(req.params.id)
  let authorized = user.company.id === req.user.company.id
  if (!authorized) {
    const company = await companies.load(req.user.company.id)
    if (company.type === 'ADMIN') authorized = true
  }
  if (!authorized) throw new httpError.Fzorbidden()
  await users.remove(user.id)
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

module.exports = {
  listUsers,
  loadUser,
  createUser,
  updateUser,
  removeUser,
  loadMyUser,
  verifyUserEmail
}
