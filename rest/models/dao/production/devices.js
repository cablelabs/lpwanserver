// Database implementation.
const { prisma, formatInputData, formatRelationshipsIn } = require('../../../lib/prisma')
const appLogger = require('../../../lib/appLogger')
// Error reporting
var httpError = require('http-errors')

// Utils
const { onFail } = require('../../../lib/utils')

//* *****************************************************************************
// Devices database table.
//* *****************************************************************************
module.exports = {
  createDevice,
  retrieveDevice,
  updateDevice,
  deleteDevice,
  retrieveAllDevices,
  retrieveDevices
}
//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the device record.
//
// name                - the name of the device
// description         - a description of the device
// deviceModel         - model information for the device
// applicationId       - the id of the Application this device belongs to
//
// Returns the promise that will execute the create.
function createDevice (name, description, applicationId, deviceModel) {
  const data = formatInputData({
    name,
    description,
    applicationId,
    deviceModel
  })
  appLogger.log(`devices: createDevice: ${JSON.stringify(data)}`)
  return prisma.createDevice(data).$fragment(fragments.basic)
}

async function loadDevice (uniqueKeyObj, fragementKey = 'basic') {
  const rec = await onFail(400, () => prisma.device(uniqueKeyObj).$fragment(fragments[fragementKey]))
  if (!rec) throw httpError(404, 'Device not found')
  return rec
}

// Retrieve a device record by id.  This method retrieves not just the
// device fields, but also returns an array of the networkTypeIds the
// device has deviceNetworkTypeLinks to.
//
// id - the record id of the device.
//
// Returns a promise that executes the retrieval.
async function retrieveDevice (id) {
  return loadDevice({ id })
}

// Update the device record.
//
// device - the updated record.  Note that the id must be unchanged from
//               retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
function updateDevice ({ id, ...data }) {
  if (!id) throw httpError(400, 'No existing Device ID')
  data = formatInputData(data)
  return prisma.updateDevice({ data, where: { id } }).$fragment(fragments.basic)
}

// Delete the device record.
//
// id - the id of the device record to delete.
//
// Returns a promise that performs the delete.
function deleteDevice (id) {
  return onFail(400, () => prisma.deleteDevice({ id }))
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Gets all devices from the database.
//
// Returns a promise that does the retrieval.
function retrieveAllDevices () {
  return prisma.devices()
}

// Retrieve the device by name.
//
// Returns a promise that does the retrieval.
// Device name is not required in schema.
// Shouldn't load one doc based on non-unique property
// Not used anywhere, so removing fn
// function retrieveDevicebyName (name) {
// }

// Retrieves a subset of the devices in the system given the options.
//
// Options include limits on the number of devices returned, the offset to
// the first device returned (together giving a paging capability), a
// search string on device name, a companyId, an applicationId, or a
// deviceProfileId.
async function retrieveDevices ({ limit, offset, ...where } = {}) {
  where = formatRelationshipsIn(where)
  if (where.search) {
    where.name_contains = where.search
    delete where.search
  }
  const query = { where }
  if (limit) query.first = limit
  if (offset) query.skip = offset
  const [records, totalCount] = await Promise.all([
    prisma.devices(query).$fragment(fragments.basic),
    prisma.devicesConnection({ where }).aggregate().count()
  ])
  return { totalCount, records }
}

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicDevice on Device {
    id
    name
    description
    deviceModel
    application {
      id
    }
  }`
}
