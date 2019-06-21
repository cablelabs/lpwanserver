var appLogger = require('../lib/appLogger.js')
const { prisma } = require('../lib/prisma')
const { normalizeDevEUI, parseProp, stringifyProp } = require('../lib/utils')
const { redisClient } = require('../lib/redis')
const CacheFirstStrategy = require('../../lib/prisma-cache/src/cache-first-strategy')
const R = require('ramda')

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

// ******************************************************************************
// Database Client
// ******************************************************************************
const DB = new CacheFirstStrategy({
  name: 'deviceNetworkTypeLink',
  pluralName: 'deviceNetworkTypeLinks',
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

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = class DeviceNetworkTypeLink {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
  }

  async load (id) {
    return parseNetworkSettings(await DB.load({ id }))
  }

  async list (query, opts) {
    let [ records, totalCount ] = await DB.list(query, opts)
    return [ records.map(parseNetworkSettings), totalCount ]
  }

  async create (data, { validateCompanyId, remoteOrigin = false } = {}) {
    try {
      if (validateCompanyId) await this.validateCompanyForDevice(validateCompanyId, data.deviceId)
      if (data.networkSettings && data.networkSettings.devEUI) {
        data = R.assocPath(['networkSettings', 'devEUI'], normalizeDevEUI(data.networkSettings.devEUI), data)
      }
      const rec = await DB.create(stringifyNetworkSettings(data))
      if (!remoteOrigin) {
        var logs = await this.modelAPI.networkTypeAPI.addDevice(data.networkTypeId, data.deviceId, data.networkSettings)
        rec.remoteAccessLogs = logs
      }
      return rec
    }
    catch (err) {
      appLogger.log('Error creating deviceNetworkTypeLink: ' + err)
      throw err
    }
  }

  async update ({ id, ...data }, validateCompanyId) {
    try {
      await this.validateCompanyForDeviceNetworkTypeLink(validateCompanyId, id)
      if (data.networkSettings && data.networkSettings.devEUI) {
        data.networkSettings.devEUI = normalizeDevEUI(data.networkSettings.devEUI)
      }
      const rec = await DB.update({ id }, stringifyNetworkSettings(data))
      const device = await this.modelAPI.devices.load(rec.device.id)
      var logs = await this.modelAPI.networkTypeAPI.pushDevice(rec.networkType.id, device)
      rec.remoteAccessLogs = logs
      return rec
    }
    catch (err) {
      appLogger.log('Error updating deviceNetworkTypeLink: ' + err)
      throw err
    }
  }

  async remove (id, validateCompanyId) {
    try {
      const rec = await DB.load({ id })
      await this.validateCompanyForDeviceNetworkTypeLink(validateCompanyId, id)
      // Don't delete the local record until the remote operations complete.
      var logs = await this.modelAPI.networkTypeAPI.deleteDevice(rec.networkType.id, rec.device.id)
      await DB.remove({ id })
      return logs
    }
    catch (err) {
      appLogger.log('Error deleting deviceNetworkTypeLink: ' + err)
      throw err
    }
  }

  async pushDeviceNetworkTypeLink (deviceNetworkTypeLink) {
    try {
      var rec = await this.load(deviceNetworkTypeLink)
      var logs = await this.modelAPI.networkTypeAPI.pushDevice(rec.networkType.id, rec.device.id, rec.networkSettings)
      rec.remoteAccessLogs = logs
      return rec
    }
    catch (err) {
      appLogger.log('Error updating deviceNetworkTypeLink: ' + err)
      throw err
    }
  }

  async validateCompanyForDevice (companyId, deviceId) {
    if (!companyId) return
    const d = await this.modelAPI.devices.load(deviceId)
    await this.modelAPI.applicationNetworkTypeLinks.validateCompanyForApplication(companyId, d.application.id)
  }

  async validateCompanyForDeviceNetworkTypeLink (companyId, dnlId) {
    if (!companyId) return
    const dnl = await this.load(dnlId)
    await this.validateCompanyForDevice(companyId, dnl.device.id)
  }

  async findByDevEUI (devEUI, networkTypeId) {
    let devNtl
    // Check cache for devNtl ID
    let devNtlId = await redisClient.getAsync(`ip-devNtl-${devEUI}`)
    if (devNtlId) {
      devNtl = await this.load(devNtlId)
      if (!devNtl) await redisClient.delAsync(`ip-devNtl-${devEUI}`)
    }
    else {
      const devNTLQuery = { networkType: { id: networkTypeId }, networkSettings_contains: devEUI }
      let [ devNtls ] = await this.list(devNTLQuery)
      devNtl = devNtls[0]
      if (devNtl) await redisClient.setAsync(`ip-devNtl-${devEUI}`, devNtl.id)
    }
    return devNtl
  }
}
