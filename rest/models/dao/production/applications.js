// Database implementation.
const { prisma, formatInputData, formatRelationshipReferences } = require('../../../lib/prisma')

// Error reporting
var httpError = require('http-errors')

// Utils
const { onFail } = require('../../../lib/utils')

const formatRefsIn = formatRelationshipReferences('in')

//* *****************************************************************************
// Applications database table.
//* *****************************************************************************
module.exports = {
  createApplication,
  retrieveApplication,
  updateApplication,
  deleteApplication,
  retrieveAllApplications,
  retrieveApplications
}
//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the application record.
//
// name                - the name of the application
// description         - the description of the application
// companyId           - the id of the Company this application belongs to
// reportingProtocolId - The protocol used to report data to the application
// baseUrl             - The base URL to use for reporting the data to the
//                       application using the reporting protocol
//
// Returns the promise that will execute the create.
function createApplication (name, description, companyId, reportingProtocolId, baseUrl) {
  const data = formatInputData({
    name,
    description,
    companyId,
    reportingProtocolId,
    baseUrl
  })
  return prisma.createApplication(data).fragment$(fragments.basic)
}

async function loadApplication (uniqueKeyObj, fragementKey = 'basic') {
  const rec = await onFail(400, () => prisma.application(uniqueKeyObj)).fragment$(fragments[fragementKey])
  if (!rec) throw httpError(404, 'Application not found')
  return rec
}

// Retrieve a application record by id.  This method retrieves not just the
// application fields, but also returns an array of the networkTypeIds the
// application has applicationNetworkTypeLinks to.
//
// id - the record id of the application.
//
// Returns a promise that executes the retrieval.
async function retrieveApplication (id) {
  const app = await loadApplication({ id })
  try {
    const networks = await prisma
      .applicationNetworkTypeLinks({ where: { application: { id } } })
      .fragment$(fragments.ntwkTypeLink)
    app.networks = networks.map(x => x.networkType.id)
  }
  catch (err) {
    // ignore
  }
  return app
}

// Update the application record.
//
// application - the updated record.  Note that the id must be unchanged from
//               retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
function updateApplication ({ id, ...data }) {
  if (!id) throw httpError(400, 'No existing Application ID')
  data = formatInputData(data)
  return prisma.updateApplication({ data, where: { id } })
}

// Delete the application record.
//
// id - the id of the application record to delete.
//
// Returns a promise that performs the delete.
function deleteApplication (id) {
  return onFail(400, () => prisma.deleteApplication({ id }))
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Gets all applications from the database.
//
// Returns a promise that does the retrieval.
function retrieveAllApplications () {
  return prisma.applications()
}

// Retrieve the application by name.
// Returns a promise that does the retrieval.
// Application name is not required in schema.
// Shouldn't load one doc based on non-unique property
// Not used anywhere, so removing fn
// exports.retrieveApplicationbyName = function (name) {
//   return new Promise(function (resolve, reject) {
//     db.fetchRecord('applications', 'name', name, function (err, rec) {
//       if (err) {
//         reject(err)
//       }
//       else {
//         resolve(rec)
//       }
//     })
//   })
// }

// Retrieves a subset of the applications in the system given the options.
//
// Options include limits on the number of applications returned, the offset to
// the first application returned (together giving a paging capability), a
// search string on application name, a companyId, and a reportingProtocolId.
// The returned totalCount shows the number of records that match the query,
// ignoring any limit and/or offset.
async function retrieveApplications (opts) {
  const where = formatRefsIn(opts)
  if (opts.search) {
    where.name_contains = opts.search
    delete where.search
  }
  const query = { where }
  if (opts.limit) query.first = opts.limit
  if (opts.offset) query.skip = opts.offset
  const [records, totalCount] = await Promise.all([
    prisma.applications(query).fragment$(fragments.basic),
    prisma.applicationsConnection({ where }).aggregate.count()
  ])
  return { totalCount, records }
}

const fragments = {
  basic: `fragment Basic on Application {
    id
    name
    description
    baseUrl
    company {
      id
    }
    reportingProtocol {
      id
    }
  }`,
  ntwkTypeLink: `fragment Basic on CompanyNetworkTypeLink {
    id
    networkType {
      id
    }
  }`
}