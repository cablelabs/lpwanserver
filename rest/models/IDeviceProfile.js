var appLogger = require('../lib/appLogger.js')
const { prisma } = require('../lib/prisma')
var httpError = require('http-errors')
const { renameKeys, stringifyProp, parseProp } = require('../lib/utils')
const { redisClient } = require('../lib/redis')
const CacheFirstStrategy = require('../../lib/prisma-cache/src/cache-first-strategy')

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
// Database Client
// ******************************************************************************
const DB = new CacheFirstStrategy({
  name: 'deviceProfile',
  pluralName: 'deviceProfiles',
  fragments,
  defaultFragmentKey: 'basic',
  prisma,
  redis: redisClient,
  log: appLogger.log.bind(appLogger)
})

// ******************************************************************************
// Helpers
// ******************************************************************************
const parseNetworkSettings = parseProp('networkSettings')
const stringifyNetworkSettings = stringifyProp('networkSettings')
const renameQueryKeys = renameKeys({ search: 'name_contains' })

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = class DeviceProfile {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
  }

  async load (id) {
    return parseNetworkSettings(await DB.load({ id }))
  }

  async list (query = {}, opts) {
    let [ records, totalCount ] = await DB.list(renameQueryKeys(query), opts)
    return [ records.map(parseNetworkSettings), totalCount ]
  }

  async create (networkTypeId, companyId, name, description, networkSettings, { remoteOrigin = false } = {}) {
    try {
      const data = { networkTypeId, companyId, name, description, networkSettings }
      const rec = await DB.create(stringifyNetworkSettings(data))
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
      const rec = await DB.update({ id }, stringifyNetworkSettings(data))
      var logs = await this.modelAPI.networkTypeAPI.pushDeviceProfile(rec.networkType.id, id)
      rec.remoteAccessLogs = logs
      return rec
    }
    catch (err) {
      appLogger.log('Error updating deviceProfile:' + err)
      throw err
    }
  }

  async remove (id, validateCompanyId) {
    try {
      // Since we clear the remote networks before we delete the local
      // record, validate the company now, if required.  Also, we need the
      // networkTypeId from the record to delete it from the relevant
      // networks.  So get the record to start anyway.
      var rec = await DB.load({ id })

      if (validateCompanyId && validateCompanyId !== rec.company.id) {
        throw new httpError.Unauthorized()
      }

      // Don't delete the local record until the remote operations complete.
      var logs = await this.modelAPI.networkTypeAPI.deleteDeviceProfile(rec.networkType.id, id)
      await DB.remove({ id })
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
