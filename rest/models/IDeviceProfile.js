var appLogger = require('../lib/appLogger.js')
const { prisma, formatInputData, formatRelationshipsIn, loadRecord } = require('../lib/prisma')
var httpError = require('http-errors')
const { onFail } = require('../lib/utils')

module.exports = class DeviceProfile {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
  }

  async create (networkTypeId, companyId, name, description, networkSettings, { remoteOrigin = false } = {}) {
    try {
      const data = formatInputData({
        networkTypeId,
        companyId,
        name,
        description,
        networkSettings: JSON.stringify(networkSettings)
      })
      const rec = await prisma.createDeviceProfile(data).$fragment(fragments.basic)
      if (!remoteOrigin) {
        var logs = await this.modelAPI.networkTypeAPI.addDeviceProfile(networkTypeId, rec.id)
        rec.remoteAccessLogs = logs
      }
      return parseNetworkSettings(rec)
    }
    catch (err) {
      appLogger.log('Failed to create deviceProfile:' + err)
      throw err
    }
  }

  async update ({ id, ...data }) {
    try {
      if (!id) throw httpError(400, 'No existing DeviceProfile ID')
      if (data.networkSettings) {
        data.networkSettings = JSON.stringify(data.networkSettings)
      }
      data = formatInputData(data)
      const rec = await prisma.updateDeviceProfile({ data, where: { id } }).$fragment(fragments.basic)
      var logs = await this.modelAPI.networkTypeAPI.pushDeviceProfile(rec.networkType.id, id)
      rec.remoteAccessLogs = logs
      return rec
    }
    catch (err) {
      appLogger.log('Error updating deviceProfile:' + err)
      throw err
    }
  }

  load (id) {
    return loadDeviceProfile({ id })
  }

  async list ({ limit, offset, ...where } = {}) {
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

  async remove (id, validateCompanyId) {
    try {
      // Since we clear the remote networks before we delete the local
      // record, validate the company now, if required.  Also, we need the
      // networkTypeId from the record to delete it from the relevant
      // networks.  So get the record to start anyway.
      var rec = await this.load(id)

      if (validateCompanyId && validateCompanyId !== rec.company.id) {
        throw new httpError.Unauthorized()
      }

      // Don't delete the local record until the remote operations complete.
      var logs = await this.modelAPI.networkTypeAPI.deleteDeviceProfile(rec.networkType.id, id)
      await onFail(400, () => prisma.deleteDeviceProfile({ id }))
      return logs
    }
    catch (err) {
      appLogger.log('Error deleting deviceProfile: ' + err)
      throw err
    }
  }

  async pushDeviceProfile (id) {
    try {
      var rec = await this.load(id)
      var logs = await this.modelAPI.networkTypeAPI.pushDeviceProfile(rec.networkType.id, id)
      rec.remoteAccessLogs = logs
      return rec
    }
    catch (err) {
      appLogger.log('Error pushing deviceProfile:' + err)
      throw err
    }
  }
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

// ******************************************************************************
// Helpers
// ******************************************************************************
function parseNetworkSettings (x) {
  return typeof x.networkSettings === 'string'
    ? { ...x, networkSettings: JSON.parse(x.networkSettings) }
    : x
}

const loadDeviceProfile = loadRecord('deviceProfile', fragments, 'basic')
