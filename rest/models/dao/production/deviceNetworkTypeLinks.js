// Database implementation.
const { prisma, formatInputData, formatRelationshipsIn } = require('../../../lib/prisma')

// Utils
const { onFail } = require('../../../lib/utils')

// Device access
var dev = require('./devices.js')

// Application/company validation from applicationNetowrkLinks
var app = require('./applicationNetworkTypeLinks.js')

// Error reporting
var httpError = require('http-errors')

//* *****************************************************************************
// DeviceNetworkTypeLinks database table.
//* *****************************************************************************
module.exports = {
  createDeviceNetworkTypeLink,
  retrieveDeviceNetworkTypeLink,
  updateDeviceNetworkTypeLink,
  deleteDeviceNetworkTypeLink,
  retrieveDeviceNetworkTypeLinks
}
//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the deviceNetworkTypeLinks record.
//
// deviceId          - The id for the device this link is being created for
// networkTypeId         - The id for the network the device is linked to
// networkSettings   - The settings required by the network protocol in json
//                     format
// validateCompanyId - If supplied, the device MUST belong to this company.
//
// Returns the promise that will execute the create.
async function createDeviceNetworkTypeLink (deviceId, networkTypeId, deviceProfileId, networkSettings, validateCompanyId) {
  await validateCompanyForDevice(validateCompanyId, deviceId)
  const data = formatInputData({
    deviceId,
    networkTypeId,
    deviceProfileId,
    networkSettings: JSON.stringify(networkSettings)
  })
  return prisma.createDeviceNetworkTypeLink(data).$fragment(fragments.basic)
}

// Retrieve a deviceNetworkTypeLinks record by id.
//
// id - the record id of the deviceNetworkTypeLinks record.
//
// Returns a promise that executes the retrieval.
async function retrieveDeviceNetworkTypeLink (id) {
  const rec = await onFail(400, () => prisma.deviceNetworkTypeLink({ id }).$fragment(fragments.basic))
  if (!rec) throw httpError(404, 'DeviceNetworkTypeLink not found')
  return rec
}

// Update the deviceNetworkTypeLinks record.
//
// deviceNetworkTypeLinks      - the updated record. Note that the id must be
//                           unchanged from retrieval to guarantee the same
//                           record is updated.
// validateCompanyId       - If supplied, the device MUST belong to this
//                           company.
//
// Returns a promise that executes the update.
async function updateDeviceNetworkTypeLink ({ id, ...data }, validateCompanyId) {
  await validateCompanyForDeviceNetworkTypeLink(validateCompanyId, id)
  if (data.networkSettings) {
    data.networkSettings = JSON.stringify(data.networkSettings)
  }
  data = formatInputData(data)
  return prisma.updateDeviceNetworkTypeLink({ data, where: { id } }).$fragment(fragments.basic)
}

// Delete the deviceNetworkTypeLinks record.
//
// id                - the id of the deviceNetworkTypeLinks record to delete.
// validateCompanyId - If supplied, the device MUST belong to this company.
//
// Returns a promise that performs the delete.
async function deleteDeviceNetworkTypeLink (id, validateCompanyId) {
  await validateCompanyForDeviceNetworkTypeLink(validateCompanyId, id)
  return onFail(400, () => prisma.deleteDeviceNetworkTypeLink({ id }))
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Retrieves a subset of the deviceNetworkTypeLinks in the system given the options.
//
// Options include the deviceId, and the networkTypeId.
//
// Returns a promise that does the retrieval.
async function retrieveDeviceNetworkTypeLinks ({ limit, offset, ...where } = {}) {
  where = formatRelationshipsIn(where)
  const query = { where }
  if (limit) query.first = limit
  if (offset) query.skip = offset
  let [records, totalCount] = await Promise.all([
    prisma.deviceNetworkTypeLinks(query).$fragment(fragments.basic),
    prisma.deviceNetworkTypeLinksConnection({ where }).aggregate().count()
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
async function validateCompanyForDevice (companyId, deviceId) {
  if (!companyId) return
  const d = await dev.retrieveDevice(deviceId)
  await app.validateCompanyForApplication(companyId, d.application.id)
}

async function validateCompanyForDeviceNetworkTypeLink (companyId, dnlId) {
  if (!companyId) return
  const dnl = await retrieveDeviceNetworkTypeLink(dnlId)
  await validateCompanyForDevice(companyId, dnl.device.id)
}

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicDeviceNetworkTypeLink on DeviceNetworkTypeLink {
    id
    networkSettings
    device {
      id
    }
    networkType {
      id
    }
    deviceProfile {
      id
    }
  }`
}
