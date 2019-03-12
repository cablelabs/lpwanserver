// Database implementation.
const { prisma } = require('../../../lib/prisma')

// Error reporting
const httpError = require('http-errors')

// Utils
const { onFail } = require('../../../lib/utils')

//* *****************************************************************************
// NetworkProviders database table.
//* *****************************************************************************
module.exports = {
  createNetworkProvider,
  retrieveNetworkProvider,
  updateNetworkProvider,
  deleteNetworkProvider,
  retrieveAllNetworkProviders,
  retrieveNetworkProviders
}
//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the networkProviders record.
//
// name  - the name of the networkProvider
//
// Returns the promise that will execute the create.
function createNetworkProvider (name) {
  return prisma.createNetworkProvider({ name })
}

async function loadNetworkProvider (uniqueKeyObj) {
  const rec = await onFail(400, () => prisma.networkType(uniqueKeyObj))
  if (!rec) throw httpError(404, 'NetworkProvider not found')
  return rec
}
// Retrieve a networkType record by id.
//
// id - the record id of the networkType.
//
// Returns a promise that executes the retrieval.
async function retrieveNetworkProvider (id) {
  return loadNetworkProvider({ id })
}

// Update the networkProvider record.
//
// networkProvider - the updated record.  Note that the id must be unchanged
//                   from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
function updateNetworkProvider ({ id, ...data }) {
  if (!id) throw httpError(400, 'No existing NetworkProvider ID')
  return prisma.updateNetworkProvider({ data, where: { id } })
}

// Delete the networkProvider record.
//
// networkProviderId - the id of the networkProvider record to delete.
//
// Returns a promise that performs the delete.
function deleteNetworkProvider (id) {
  return onFail(400, () => prisma.deleteNetworkProvider({ id }))
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Gets all networkProviders from the database.
//
// Returns a promise that does the retrieval.
function retrieveAllNetworkProviders () {
  return prisma.networkTypes()
}

// Retrieve the networkProvider by name.
//
// Returns a promise that does the retrieval.
async function retrieveNetworkProviders (opts = {}) {
  const where = {}
  if (opts.search) where.name_contains = opts.search
  const query = { where }
  if (opts.limit) query.first = opts.limit
  if (opts.offset) query.skip = opts.offset
  const [records, totalCount] = await Promise.all([
    prisma.networkProviders(query),
    prisma.networkProvidersConnection({ where }).aggregate.count()
  ])
  return { totalCount, records }
}
