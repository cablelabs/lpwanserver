// Database implementation.
const { prisma } = require('../../../lib/prisma')

// Error reporting
var httpError = require('http-errors')

// Utils
const { onFail } = require('../../../lib/utils')

//* *****************************************************************************
// ReportingProtocols database table.
//* *****************************************************************************

module.exports = {
  createReportingProtocol,
  retrieveReportingProtocol,
  updateReportingProtocol,
  deleteReportingProtocol,
  retrieveReportingProtocols
}

//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the reportingProtocol record.
//
// name            - the name of the reporting protocol to display for selection
// protocolHandler - the filename for the code that supports the general
//                   reporting protocol api for this specific protocol.
//
// Returns the promise that will execute the create.
function createReportingProtocol (name, protocolHandler) {
  const data = { name, protocolHandler }
  return prisma.createReportingProtocol(data)
}

// Retrieve a reportingProtocol record by id.
//
// id - the record id of the reportingProtocol.
//
// Returns a promise that executes the retrieval.
async function retrieveReportingProtocol (id) {
  const rec = await onFail(400, () => prisma.reportingProtocol({ id }))
  if (!rec) throw httpError(404, 'Reporting protocol not found')
  return rec
}

// Update the reportingProtocol record.
//
// reportingProtocol - the updated record.  Note that the id must be unchanged
//                     from retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
function updateReportingProtocol ({ id, ...data }) {
  if (!id) throw httpError(400, 'No existing ReportingProtocol ID')
  return prisma.updateReportingProtocol({ data, where: { id } })
}

// Delete the reportingProtocol record.
//
// id - the id of the reportingProtocol record to delete.
//
// Returns a promise that performs the delete.
function deleteReportingProtocol (id) {
  return onFail(400, () => prisma.deleteReportingProtocol({ id }))
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Gets all reportingProtocols from the database.
//
// Returns a promise that does the retrieval.
function retrieveReportingProtocols () {
  return prisma.reportingProtocols()
}
