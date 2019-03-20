// Database implementation.
const { prisma, formatInputData, formatRelationshipsIn } = require('../../../lib/prisma')

// Error reporting
var httpError = require('http-errors')

// Utils
const { onFail } = require('../../../lib/utils')

//* *****************************************************************************
// DeviceProfiles database table.
//* *****************************************************************************
module.exports = {
  createDeviceProfile,
  retrieveDeviceProfile,
  updateDeviceProfile,
  deleteDeviceProfile,
  retrieveDeviceProfiles
}
//* *****************************************************************************
// CRUD support.
//* *****************************************************************************

// Create the deviceProfiles record.
//
// deviceId          - The id for the device this link is being created for
// networkTypeId     - The id for the network the device is linked to
// name              - The display name for the profile.
// description       - The description for the profile
// networkSettings   - The settings required by the network protocol in json
//                     format
// Returns the promise that will execute the create.
function createDeviceProfile (networkTypeId, companyId, name, description, networkSettings) {
  const data = formatInputData({
    networkTypeId,
    companyId,
    name,
    description,
    networkSettings: JSON.stringify(networkSettings)
  })
  return prisma.createDeviceProfile(data).$fragment(fragments.basic)
}

// Retrieve a deviceProfiles record by id.
//
// id - the record id of the deviceProfiles record.
//
// Returns a promise that executes the retrieval.
async function retrieveDeviceProfile (id) {
  const rec = await onFail(400, () => prisma.deviceProfile({ id }).$fragment(fragments.basic))
  if (!rec) throw httpError(404, 'DeviceProfile not found')
  if (rec.networkSettings) {
    rec.networkSettings = JSON.parse(rec.networkSettings)
  }
  return rec
}

// Update the deviceProfiles record.
//
// profile - the updated record. Note that the id must be unchanged from
//           retrieval to guarantee the same record is updated.
//
// Returns a promise that executes the update.
function updateDeviceProfile ({ id, ...data }) {
  if (!id) throw httpError(400, 'No existing DeviceProfile ID')
  if (data.networkSettings) {
    data.networkSettings = JSON.stringify(data.networkSettings)
  }
  data = formatInputData(data)
  return prisma.updateDeviceProfile({ data, where: { id } }).$fragment(fragments.basic)
}

// Delete the deviceProfiles record.
//
// id - the id of the deviceProfiles record to delete.
//
// Returns a promise that performs the delete.
function deleteDeviceProfile (id) {
  return onFail(400, () => prisma.deleteDeviceProfile({ id }))
}

//* *****************************************************************************
// Custom retrieval functions.
//* *****************************************************************************

// Retrieves a subset of the deviceProfiles in the system given the options.
//
// Options include the companyId, and the networkTypeId.
//
// Returns a promise that does the retrieval.
async function retrieveDeviceProfiles ({ limit, offset, ...where } = {}) {
  where = formatRelationshipsIn(where)
  if (where.search) {
    where.name_contains = where.search
    delete where.search
  }
  const query = { where }
  if (limit) query.first = limit
  if (offset) query.skip = offset
  let [records, totalCount] = await Promise.all([
    prisma.deviceProfiles(query).$fragment(fragments.basic),
    prisma.deviceProfilesConnection({ where }).aggregate().count()
  ])
  records = records.map(x => ({
    ...x,
    networkSettings: JSON.parse(x.networkSettings)
  }))
  return { totalCount, records }
}

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicDeviceProfile on DeviceProfile {
    id
    name
    description
    networkSettings
    company {
      id
    }
    networkType {
      id
    }
  }`
}
