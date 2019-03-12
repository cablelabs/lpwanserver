// Database implementation.
const { prisma, formatRelationshipReferences, formatInputData } = require('../../../lib/prisma')

// Error reporting
var httpError = require('http-errors')

// Utils
const { onFail } = require('../../../lib/utils')

const formatRefsIn = formatRelationshipReferences('in')

//* *****************************************************************************
// Networks database table.
//* *****************************************************************************

module.exports = {
  createNetwork,
  retrieveNetwork,
  updateNetwork,
  deleteNetwork,
  retrieveNetworks
}
//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the network record.
//
// name                      - the name of the network to display for selection
// networkProviderId         - the id of the networkProvider that manages this
//                             network.
// networkTypeId             - the id of the networkType this network supports
// networkProtocolId         - the id of the networkProtocol this network uses
// baseUrl                   - the root of the URL to be used by the
//                             networkProtocol to access the network api.
// securityData              - Data used by the networkProtocol to access the
//                             remote system.  Could be a JWT token or other
//                             login credentials.
//
// Returns the promise that will execute the create.
function createNetwork (name, networkProviderId, networkTypeId, networkProtocolId, baseUrl, securityData) {
  const data = formatInputData({
    name,
    networkProviderId,
    networkTypeId,
    networkProtocolId,
    baseUrl,
    securityData
  })
  return prisma.createNetwork(data).fragment$(fragments.basic)
}

// Retrieve a network record by id.
//
// id - the record id of the network.
//
// Returns a promise that executes the retrieval.
async function retrieveNetwork (id) {
  const rec = await onFail(400, () => prisma.network({ id })).fragment$(fragments.basic)
  if (!rec) throw httpError(404, 'Network not found')
  return rec
}

// Update the network record.
//
// network- the updated record.  Note that the id must be unchanged
//          from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
function updateNetwork ({ id, ...data }) {
  if (!id) throw httpError(400, 'No existing Network ID')
  data = formatInputData(data)
  return prisma.updateNetwork({ data, where: { id } })
}

// Delete the network record.
//
// id - the id of the network record to delete.
//
// Returns a promise that performs the delete.
function deleteNetwork (id) {
  return onFail(400, () => prisma.deleteNetwork({ id }))
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

/**
 * Retrieves a subset of the networks in the system given the options.
 *
 * Options include limits on the number of networks returned, the offset to
 * the first network returned (together giving a paging capability), a
 * search string on network name, and networkProtocolId.
 *
 */
async function retrieveNetworks (opts = {}) {
  const where = formatRefsIn(opts)
  if (opts.search) {
    where.name_contains = opts.search
    delete where.search
  }
  const query = { where }
  if (opts.limit) query.first = opts.limit
  if (opts.offset) query.skip = opts.offset
  const [records, totalCount] = await Promise.all([
    prisma.networks(query).fragment$(fragments.basic),
    prisma.networksConnection({ where }).aggregate.count()
  ])
  return { totalCount, records }
}

const fragments = {
  basic: `fragment Basic on Network {
    id
    baseUrl
    networkProvider {
      id
    }
    networkType {
      id
    }
    networkProtocol {
      id
    }
  }`
}
