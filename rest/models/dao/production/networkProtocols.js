// Database implementation.
const { prisma, formatInputData, formatRelationshipsIn } = require('../../../lib/prisma')
const appLogger = require('../../../lib/appLogger')

// Error reporting
var httpError = require('http-errors')

// Utils
const { onFail } = require('../../../lib/utils')

//* *****************************************************************************
// NetworkProtocols database table.
//* *****************************************************************************
module.exports = {
  createNetworkProtocol,
  upsertNetworkProtocol,
  retrieveNetworkProtocol,
  updateNetworkProtocol,
  deleteNetworkProtocol,
  retrieveAllNetworkProtocols,
  retrieveNetworkProtocols
}
//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the networkProtocol record.
//
// name            - the name of the network protocol to display for selection
// protocolType    - the protocol type, such as "LoRa", "NB-IoT", etc.
// protocolHandler - the filename for the code that supports the general network
//                   protocol api for this specific protocol.
//
// Returns the promise that will execute the create.
async function createNetworkProtocol (name, networkTypeId, protocolHandler, version, masterProtocol) {
  const data = formatInputData({
    name,
    protocolHandler,
    networkProtocolVersion: version,
    networkTypeId,
    masterProtocol
  })
  let rec = await prisma.createNetworkProtocol(data).$fragment(fragments.basic)
  if (!masterProtocol) {
    rec = await updateNetworkProtocol({ id: rec.id, masterProtocol: rec.id })
  }
  return rec
}

async function upsertNetworkProtocol ({ networkProtocolVersion, ...np }) {
  const { records } = await retrieveNetworkProtocols({ search: np.name, networkProtocolVersion })
  if (records.length) {
    return updateNetworkProtocol({ id: records[0].id, ...np })
  }
  return createNetworkProtocol(np.name, np.networkTypeId, np.protocolHandler, networkProtocolVersion, np.masterProtocol)
  // removed code in which NetworkProtocol references itself as it's masterProtocol
}

// Retrieve a networkProtocol record by id.
//
// id - the record id of the networkProtocol.
//
// Returns a promise that executes the retrieval.
async function retrieveNetworkProtocol (id) {
  const rec = await onFail(400, () => prisma.networkProtocol({ id }).$fragment(fragments.basic))
  if (!rec) throw httpError(404, 'NetworkProtocol not found')
  return rec
}

// Update the networkProtocol record.
//
// networkProtocol - the updated record.  Note that the id must be unchanged
//                   from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
function updateNetworkProtocol ({ id, ...data }, fragment = 'basic') {
  if (!id) throw httpError(400, 'No existing NetworkProtocol ID')
  data = formatInputData(data)
  return prisma.updateNetworkProtocol({ data, where: { id } }).$fragment(fragments[fragment])
}

// Delete the networkProtocol record.
//
// id - the id of the networkProtocol record to delete.
//
// Returns a promise that performs the delete.
function deleteNetworkProtocol (id) {
  return onFail(400, () => prisma.deleteNetworkProtocol({ id }))
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Gets all networkProtocols from the database.
//
// Returns a promise that does the retrieval.
function retrieveAllNetworkProtocols () {
  return prisma.networkProtocols().$fragment(fragments.basic)
}

/**
 * Retrieves a subset of the networkProtocols in the system given the options.
 *
 * Options include limits on the number of companies returned, the offset to
 * the first company returned (together giving a paging capability), and a
 * search string on networkProtocol name or type.
 *
 */
async function retrieveNetworkProtocols ({ limit, offset, ...where } = {}) {
  where = formatRelationshipsIn(where)
  if (where.search) {
    where.name_contains = where.search
    delete where.search
  }
  if (where.networkProtocolVersion) {
    where.networkProtocolVersion_contains = where.networkProtocolVersion
    delete where.networkProtocolVersion
  }
  const query = { where }
  if (limit) query.first = limit
  if (offset) query.skip = offset
  // if (Object.keys(where).length) {
  const [records, totalCount] = await Promise.all([
    prisma.networkProtocols(query).$fragment(fragments.basic),
    prisma.networkProtocolsConnection({ where }).aggregate().count()
  ])
  return { totalCount, records }
}

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicNetworkProtocol on NetworkProtocol {
    id
    name
    protocolHandler
    networkProtocolVersion
    masterProtocol
    networkType {
      id
    }
  }`
}
