// Database implementation.
const { prisma } = require('../../../lib/prisma')

// Error reporting
const httpError = require('http-errors')

// Utils
const { onFail } = require('../../../lib/utils')

//* *****************************************************************************
// NetworkTypes database table.
//* *****************************************************************************

module.exports = {
  createNetworkType,
  retrieveNetworkType,
  updateNetworkType,
  deleteNetworkType,
  retrieveAllNetworkTypes,
  retrieveNetworkTypebyName
}

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the networkTypes record.
//
// name  - the name of the networkType
//
// Returns the promise that will execute the create.
function createNetworkType (name) {
  return prisma.createNetworkType({ name })
}

async function loadNetworkType (uniqueKeyObj) {
  const rec = await onFail(400, () => prisma.networkType(uniqueKeyObj))
  if (!rec) throw httpError(404, 'NetworkType not found')
  return rec
}
// Retrieve a networkType record by id.
//
// id - the record id of the networkType.
//
// Returns a promise that executes the retrieval.
async function retrieveNetworkType (id) {
  return loadNetworkType({ id })
}

// Update the networkType record.
//
// networkType - the updated record.  Note that the id must be unchanged from
//               retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
function updateNetworkType ({ id, ...data }) {
  if (!id) throw httpError(400, 'No existing NetworkType ID')
  return prisma.updateNetworkType({ data, where: { id } })
}

// Delete the networkType record.
//
// networkTypeId - the id of the networkType record to delete.
//
// Returns a promise that performs the delete.
function deleteNetworkType (id) {
  return onFail(400, () => prisma.deleteNetworkType({ id }))
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Gets all networkTypes from the database.
//
// Returns a promise that does the retrieval.
function retrieveAllNetworkTypes () {
  return prisma.networkTypes()
}

// Retrieve the networkType by name.
//
// Returns a promise that does the retrieval.
function retrieveNetworkTypebyName (name) {
  return loadNetworkType({ name })
}
