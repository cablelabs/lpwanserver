// Database implementation.
const { prisma, formatInputData } = require('../../../lib/prisma')
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
function createNetworkProtocol (name, networkTypeId, protocolHandler, version, masterProtocolId) {
  const data = formatInputData({
    name,
    protocolHandler,
    networkProtocolVersion: version,
    networkTypeId,
    masterProtocolId
  })
  return prisma.createNetworkProtocol(data).fragment$(fragments.basic)
}

async function upsertNetworkProtocol ({ networkProtocolVersion, ...np }) {
  const [ oldNp ] = await retrieveNetworkProtocols({ search: np.name, networkProtocolVersion })
  if (oldNp) {
    return updateNetworkProtocol({ id: oldNp.id, ...np })
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
  const rec = await onFail(400, () => prisma.networkProtocol({ id })).fragment$(fragments.basic)
  if (!rec) throw httpError(404, 'NetworkProtocol not found')
  return rec
}

// Update the networkProtocol record.
//
// networkProtocol - the updated record.  Note that the id must be unchanged
//                   from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
function updateNetworkProtocol ({ id, ...data }) {
  if (!id) throw httpError(400, 'No existing NetworkProtocol ID')
  data = formatInputData(data)
  return prisma.updateNetworkProtocol({ data, where: { id } })
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
  return prisma.networkProtocols().fragment$(fragments.basic)
}

/**
 * Retrieves a subset of the networkProtocols in the system given the options.
 *
 * Options include limits on the number of companies returned, the offset to
 * the first company returned (together giving a paging capability), and a
 * search string on networkProtocol name or type.
 *
 */
async function retrieveNetworkProtocols (opts) {
  const where = {}
  if (opts.networkId) where.network = { id: opts.networkId }
  if (opts.search) where.name_contains = opts.search
  if (opts.networkProtocolVersion) where.networkProtocolVersion_contains = opts.networkProtocolVersion
  const query = { where }
  if (opts.limit) query.first = opts.limit
  if (opts.offset) query.skip = opts.offset
  const [records, totalCount] = await Promise.all([
    prisma.networkProtocols(query).fragment$(fragments.query),
    prisma.networkProtocolsConnection({ where }).aggregate.count()
  ])
  return { totalCount, records }
}

const fragments = {
  basic: `fragment Basic on NetworkProtocol {
    id
    name
    protocolHandler
    networkProtocolVersion
    networkType {
      id
    }
    masterProtocol {
      id
    }
  }`
}
