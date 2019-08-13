const { companies } = require('../../models')
const httpError = require('http-errors')

async function ensureAdminCompany (req) {
  req.company = await companies.load(req.user.company)
  if (req.company.type !== 'ADMIN') throw httpError.Forbidden()
}

async function createCompany (_, req, res) {
  await ensureAdminCompany(req)
  const rec = await companies.create(req.body)
  res.status(201).json({ id: rec.id })
}

async function listCompanies (_, req, res) {
  const userCompany = await companies.load(req.user.company)
  if (userCompany.type !== 'ADMIN') {
    return res.status(200).json({ records: [userCompany], totalCount: 1 })
  }
  const [records, totalCount] = await companies.list(req.query, { includeTotal: true })
  return res.status(200).json({ records, totalCount })
}

async function loadCompany (_, req, res) {
  let authorized = req.params.id === req.user.company.id
  if (!authorized) {
    const userCompany = await companies.load(req.user.company)
    if (userCompany.type === 'ADMIN') authorized = true
  }
  if (!authorized) throw new httpError.Forbidden()
  res.status(200).json(await companies.load(req.params.id))
}

async function updateCompany (_, req, res) {
  let authorized = req.params.id === req.user.company.id
  if (!authorized) {
    const userCompany = await companies.load(req.user.company)
    if (userCompany.type === 'ADMIN') authorized = true
  }
  if (!authorized) throw new httpError.Forbidden()
  await companies.update({ id: req.params.id, ...req.body })
  res.status(204).send()
}

async function removeCompany (_, req, res) {
  const userCompany = await companies.load(req.user.company)
  if (userCompany.type === 'ADMIN') throw new httpError.Forbidden()
  await companies.remove(req.params.id)
  res.status(204).send()
}

module.exports = {
  createCompany,
  listCompanies,
  loadCompany,
  updateCompany,
  removeCompany
}
