const { applicationNetworkTypeLinks, companies } = require('../../models')
const httpError = require('http-errors')
const R = require('ramda')
const { formatRelationshipsOut } = require('../../lib/prisma')

async function createApplicationNetworkTypeLink (_, req, res) {
  const company = await companies.load(req.user.company.id)
  const opts = {}
  if (company.type !== 'ADMIN') opts.companyId = req.user.company.id
  const rec = await applicationNetworkTypeLinks.create(req.body, opts)
  res.status(201).json(R.pick(['id', 'remoteAccessLogs'], rec))
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
  // No changing the application or the network.
  if (req.body.applicationId || req.body.networkTypeId) {
    throw httpError(403, 'Cannot change link targets')
  }
  // TODO: Get rid of companies.  For now it is always cablelabs HACK
  const [ cos ] = await companies.list({ limit: 1 })
  await applicationNetworkTypeLinks.update({ id: req.params.id, ...req.body }, { companyId: cos[0].id })
  res.status(204).send()
}

async function removeApplicationNetworkTypeLink (_, req, res) {
  // If not an admin company, the applicationId better be associated with the user's company.
  const company = await companies.load(req.user.company.id)
  let companyId = company.type === 'ADMIN' ? void 0 : req.user.company.id
  const result = await applicationNetworkTypeLinks.remove(req.params.id, companyId)
  res.status(204).json({ remoteAccessLogs: result.remoteAccessLogs })
}

async function pushApplicationNetworkTypeLink (_, req, res) {
  const result = applicationNetworkTypeLinks.pushApplicationNetworkTypeLink(req.params.id, req.user.company.id)
  res.status(200).json(result)
}

module.exports = {
  createApplicationNetworkTypeLink,
  listApplicationNetworkTypeLinks,
  loadApplicationNetworkTypeLink,
  updateApplicationNetworkTypeLink,
  removeApplicationNetworkTypeLink,
  pushApplicationNetworkTypeLink
}
