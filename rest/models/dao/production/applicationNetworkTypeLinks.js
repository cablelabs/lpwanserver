// Database implementation.
const { prisma, formatInputData, formatRelationshipsIn } = require('../../../lib/prisma')

// Utils
const { onFail } = require('../../../lib/utils')

// Logging
var appLogger = require('../../../lib/appLogger.js')

// Application access
var app = require('./applications.js')

// Error reporting
var httpError = require('http-errors')

//* *****************************************************************************
// ApplicationNetworkTypeLinks database table.
//* *****************************************************************************
module.exports = {
  createApplicationNetworkTypeLink,
  retrieveApplicationNetworkTypeLink,
  updateApplicationNetworkTypeLink,
  deleteApplicationNetworkTypeLink,
  retrieveApplicationNetworkTypeLinks,
  validateCompanyForApplication,
  validateCompanyForApplicationNetworkTypeLink
}
//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the applicationNetworkTypeLinks record.
//
// applicationId     - The id for the application this link is being created for
// networkTypeId     - The id for the network the application is linked to
// networkSettings   - The settings required by the network protocol in json
//                     format
// validateCompanyId - If supplied, the application MUST belong to this company.
//
// Returns the promise that will execute the create.
async function createApplicationNetworkTypeLink (applicationId, networkTypeId, networkSettings, validateCompanyId) {
  if (validateCompanyId) {
    await validateCompanyForApplication(validateCompanyId, applicationId)
  }
  const data = formatInputData({
    applicationId,
    networkTypeId,
    networkSettings: JSON.stringify(networkSettings)
  })
  return prisma.createApplicationNetworkTypeLink(data).$fragment(fragments.basic)
}

// Retrieve a applicationNetworkTypeLinks record by id.
//
// id - the record id of the applicationNetworkTypeLinks record.
//
// Returns a promise that executes the retrieval.
async function retrieveApplicationNetworkTypeLink (id) {
  const rec = await onFail(400, () => prisma.applicationNetworkTypeLink({ id }).$fragment(fragments.basic))
  if (!rec) throw httpError(404, 'ApplicationNetworkTypeLink not found')
  return { ...rec, networkSettings: JSON.parse(rec.networkSettings) }
}

// Update the applicationNetworkTypeLinks record.
//
// applicationNetworkTypeLinks - the updated record. Note that the id must be
//                           unchanged from retrieval to guarantee the same
//                           record is updated.
// validateCompanyId       - If supplied, the application MUST belong to this
//                           company.
//
// Returns a promise that executes the update.
async function updateApplicationNetworkTypeLink ({ id, ...data }, validateCompanyId) {
  await validateCompanyForApplicationNetworkTypeLink(validateCompanyId, id)
  if (data.networkSettings) {
    data.networkSettings = JSON.stringify(data.networkSettings)
  }
  data = formatInputData(data)
  return prisma.updateApplicationNetworkTypeLink({ data, where: { id } }).$fragment(fragments.basic)
}

// Delete the applicationNetworkTypeLinks record.
//
// id                - the id of the applicationNetworkTypeLinks record to delete.
// validateCompanyId - If supplied, the application MUST belong to this company.
//
// Returns a promise that performs the delete.
async function deleteApplicationNetworkTypeLink (id, validateCompanyId) {
  await validateCompanyForApplicationNetworkTypeLink(validateCompanyId, id)
  return onFail(400, () => prisma.deleteApplicationNetworkTypeLink({ id }))
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Retrieves a subset of the applicationNetworkTypeLinks in the system given the options.
//
// Options include the applicationId, and the networkTypeId.
//
// Returns a promise that does the retrieval.
async function retrieveApplicationNetworkTypeLinks ({ limit, offset, ...where } = {}) {
  where = formatRelationshipsIn(where)
  const query = { where }
  if (limit) query.first = limit
  if (offset) query.skip = offset
  let [records, totalCount] = await Promise.all([
    prisma.applicationNetworkTypeLinks(query).$fragment(fragments.basic),
    prisma.applicationNetworkTypeLinksConnection({ where }).aggregate().count()
  ])
  records = records.map(x => ({
    ...x,
    networkSettings: JSON.parse(x.networkSettings)
  }))
  return { totalCount, records }
}

/***************************************************************************
 * Validation methods
 ***************************************************************************/
async function validateCompanyForApplication (companyId, applicationId) {
  if (!companyId) return
  try {
    const application = await app.retrieveApplication(applicationId)
    if (application.company.id !== companyId) {
      throw new httpError.Unauthorized()
    }
  }
  catch (err) {
    appLogger.log('Error validating company ' + companyId + ' for ' + 'application ' + applicationId + '.')
    throw err
  }
}

async function validateCompanyForApplicationNetworkTypeLink (companyId, antlId) {
  if (!companyId) return
  try {
    var antl = await retrieveApplicationNetworkTypeLink(antlId)
    await validateCompanyForApplication(companyId, antl.application.id)
  }
  catch (err) {
    appLogger.log('Error validating company ' + companyId + ' for ' + 'applicationNetworkLink ' + antlId + '.')
    throw err
  }
}

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicApplicationNetworkTypeLink on ApplicationNetworkTypeLink {
    id
    networkSettings
    application {
      id
    }
    networkType {
      id
    }
  }`
}
