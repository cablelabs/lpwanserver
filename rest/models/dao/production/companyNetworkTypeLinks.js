// Database implementation.
const { prisma, formatInputData, formatRelationshipsIn } = require('../../../lib/prisma')

// Utils
const { onFail } = require('../../../lib/utils')

// Error reporting
var httpError = require('http-errors')

const appLogger = require('../../../lib/appLogger')
//* *****************************************************************************
// CompanyNetworkTypeLinks database table.
//* *****************************************************************************
module.exports = {
  createCompanyNetworkTypeLink,
  retrieveCompanyNetworkTypeLink,
  updateCompanyNetworkTypeLink,
  deleteCompanyNetworkTypeLink,
  retrieveCompanyNetworkTypeLinks
}
//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the companyNetworkTypeLinks record.
//
// companyId       - The id for the company this link is being created for
// networkTypeId       - The id for the network the company is linked to
// networkSettings - The settings required by the network protocol in json
//                   format
//
// Returns the promise that will execute the create.
function createCompanyNetworkTypeLink (companyId, networkTypeId, networkSettings) {
  const data = formatInputData({
    companyId,
    networkTypeId,
    networkSettings: networkSettings && JSON.stringify(networkSettings)
  })
  return prisma.createCompanyNetworkTypeLink(data).$fragment(fragments.basic)
}

// Retrieve a companyNetworkTypeLinks record by id.
//
// id - the record id of the companyNetworkTypeLinks record.
//
// Returns a promise that executes the retrieval.
async function retrieveCompanyNetworkTypeLink (id) {
  const rec = await onFail(400, () => prisma.companyNetworkTypeLink({ id }).$fragment(fragments.basic))
  if (!rec) throw httpError(404, 'CompanyNetworkTypeLink not found')
  return rec
}

// Update the companyNetworkTypeLinks record.
//
// companyNetworkTypeLinks - the updated record.  Note that the id must be unchanged
//                       from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
function updateCompanyNetworkTypeLink ({ id, ...data }) {
  if (data.networkSettings) {
    data.networkSettings = JSON.stringify(data.networkSettings)
  }
  data = formatInputData(data)
  return prisma.updateCompanyNetworkTypeLink({ data, where: { id } }).$fragment(fragments.basic)
}

// Delete the companyNetworkTypeLinks record.
//
// id - the id of the companyNetworkTypeLinks record to delete.
//
// Returns a promise that performs the delete.
function deleteCompanyNetworkTypeLink (id) {
  return onFail(400, () => prisma.deleteCompanyNetworkTypeLink({ id }))
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Retrieves a subset of the companyNetworkTypeLinks in the system given the options.
//
// Options include the companyId, and the networkTypeId.
//
// Returns a promise that does the retrieval.
async function retrieveCompanyNetworkTypeLinks ({ limit, offset, ...where } = {}) {
  where = formatRelationshipsIn(where)
  const query = { where }
  if (limit) query.first = limit
  if (offset) query.skip = offset
  const [records, totalCount] = await Promise.all([
    prisma.companyNetworkTypeLinks(query).$fragment(fragments.basic),
    prisma.companyNetworkTypeLinksConnection({ where }).aggregate().count()
  ])
  return { totalCount, records }
}

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicCompanyNetworkTypeLink on CompanyNetworkTypeLink {
    id
    networkSettings
    company {
      id
    }
    networkType {
      id
    }
  }`
}