// Database implementation.
const { prisma, formatRelationshipsIn, formatInputData } = require('../../../lib/prisma')

// Error reporting
var httpError = require('http-errors')

// Utils
const { onFail } = require('../../../lib/utils')

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
async function createNetwork (data) {
  data = formatInputData({
    ...data,
    securityData: data.securityData && JSON.stringify(data.securityData)
  })
  return prisma.createNetwork(data).$fragment(fragments.internal)
}

// Retrieve a network record by id.
//
// id - the record id of the network.
//
// Returns a promise that executes the retrieval.
async function retrieveNetwork (id, fragment = 'internal') {
  const rec = await onFail(400, () => prisma.network({ id }).$fragment(fragments[fragment]))
  if (!rec) throw httpError(404, 'Network not found')
  return rec
}

// Update the network record.
//
// network- the updated record.  Note that the id must be unchanged
//          from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
async function updateNetwork ({ id, ...data }, fragment = 'internal') {
  if (!id) throw httpError(400, 'No existing Network ID')
  data = formatInputData(data)
  return prisma.updateNetwork({ data, where: { id } }).$fragment(fragments[fragment])
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
async function retrieveNetworks ({ limit, offset, ...where } = {}, fragment = 'basic') {
  where = formatRelationshipsIn(where)
  if (where.search) {
    where.name_contains = where.search
    delete where.search
  }
  const query = { where }
  if (limit) query.first = limit
  if (offset) query.skip = offset
  let [records, totalCount] = await Promise.all([
    prisma.networks(query).$fragment(fragments[fragment]),
    prisma.networksConnection({ where }).aggregate().count()
  ])
  return { totalCount, records }
}

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicNetwork on Network {
    id
    name
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
  }`,
  internal: `fragment InternalNetwork on Network {
    id
    name
    baseUrl
    securityData
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
