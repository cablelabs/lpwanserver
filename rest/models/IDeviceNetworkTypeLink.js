var appLogger = require('../lib/appLogger.js')
var httpError = require('http-errors')
const { prisma, formatInputData, formatRelationshipsIn } = require('../lib/prisma')
const { onFail } = require('../lib/utils')

module.exports = class DeviceNetworkTypeLink {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
  }

  async create (deviceId, networkTypeId, deviceProfileId, networkSettings, validateCompanyId, { remoteOrigin = false } = {}) {
    try {
      await this.validateCompanyForDevice(validateCompanyId, deviceId)
      const data = formatInputData({
        deviceId,
        networkTypeId,
        deviceProfileId,
        networkSettings: JSON.stringify(networkSettings)
      })
      const rec = await prisma.createDeviceNetworkTypeLink(data).$fragment(fragments.basic)
      if (!remoteOrigin) {
        var logs = await this.modelAPI.networkTypeAPI.addDevice(networkTypeId, deviceId, networkSettings)
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
      if (data.networkSettings) {
        data.networkSettings = JSON.stringify(data.networkSettings)
      }
      data = formatInputData(data)
      const rec = await prisma.updateDeviceNetworkTypeLink({ data, where: { id } }).$fragment(fragments.basic)
      var logs = await this.modelAPI.networkTypeAPI.pushDevice(rec.networkType.id, rec, rec.networkSettings)
      rec.remoteAccessLogs = logs
      return rec
    }
    catch (err) {
      appLogger.log('Error updating deviceNetworkTypeLink: ' + err)
      throw err
    }
  }

  async load (id) {
    const rec = await onFail(400, () => prisma.deviceNetworkTypeLink({ id }).$fragment(fragments.basic))
    if (!rec) throw httpError(404, 'DeviceNetworkTypeLink not found')
    return rec
  }

  async list ({ limit, offset, ...where } = {}) {
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

  async remove (id, validateCompanyId) {
    try {
      const rec = await this.load(id)
      await this.validateCompanyForDeviceNetworkTypeLink(validateCompanyId, id)
      // Don't delete the local record until the remote operations complete.
      var logs = await this.modelAPI.networkTypeAPI.deleteDevice(rec.networkType.id, rec.device.id)
      await onFail(400, () => prisma.deleteDeviceNetworkTypeLink({ id }))
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
