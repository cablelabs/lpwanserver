var appLogger = require('../lib/appLogger.js')
var httpError = require('http-errors')
const { prisma, formatInputData, formatRelationshipsIn } = require('../lib/prisma')
const { onFail } = require('../lib/utils')

module.exports = class ApplicationNetworkTypeLink {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
  }

  async createApplicationNetworkTypeLink (data, { companyId, remoteOrigin = false } = {}) {
    try {
      if (companyId) {
        await this.validateCompanyForApplication(companyId, data.applicationId)
      }
      const recData = formatInputData({
        ...data,
        networkSettings: JSON.stringify(data.networkSettings)
      })
      const rec = await prisma.createApplicationNetworkTypeLink(recData).$fragment(fragments.basic)
      if (!remoteOrigin) {
        const logs = await this.modelAPI.networkTypeAPI.addApplication(rec.networkType.id, rec.application.id, data.networkSettings)
        rec.remoteAccessLogs = logs
      }
      return rec
    }
    catch (err) {
      appLogger.log('Error creating applicationNetworkTypeLink: ' + err)
      throw err
    }
  }

  async retrieveApplicationNetworkTypeLink (id) {
    const rec = await onFail(400, () => prisma.applicationNetworkTypeLink({ id }).$fragment(fragments.basic))
    if (!rec) throw httpError(404, 'ApplicationNetworkTypeLink not found')
    return { ...rec, networkSettings: JSON.parse(rec.networkSettings) }
  }

  async retrieveApplicationNetworkTypeLinks ({ limit, offset, ...where } = {}) {
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

  async updateApplicationNetworkTypeLink ({ id, ...data }, { companyId, remoteOrigin = false } = {}) {
    try {
      await this.validateCompanyForApplicationNetworkTypeLink(companyId, id)
      if (typeof data.networkSettings !== 'string') {
        data.networkSettings = JSON.stringify(data.networkSettings)
      }
      data = formatInputData(data)
      const rec = await prisma.updateApplicationNetworkTypeLink({ data, where: { id } }).$fragment(fragments.basic)
      if (!remoteOrigin) {
        var logs = await this.modelAPI.networkTypeAPI.pushApplication(rec.networkType.id, rec, rec.networkSettings)
        rec.remoteAccessLogs = logs
      }
      return rec
    }
    catch (err) {
      appLogger.log('Error updating applicationNetworkTypeLink: ' + err)
      throw err
    }
  }

  async deleteApplicationNetworkTypeLink (id, { companyId } = {}) {
    await this.validateCompanyForApplicationNetworkTypeLink(companyId, id)
    try {
      var rec = await this.retrieveApplicationNetworkTypeLink(id)
      // Delete devicenetworkTypeLinks
      const { records: devices } = await this.modelAPI.devices.retrieveDevices({ applicationId: rec.application.id })
      const dntlQuery = { device: { id_in: devices.map(x => x.id) } }
      let { records: deviceNtls } = await this.modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks(dntlQuery)
      await Promise.all(deviceNtls.map(x => this.modelAPI.deviceNetworkTypeLinks.deleteApplicationNetworkTypeLink(x.id)))

      // Don't delete the local record until the remote operations complete.
      var logs = await this.modelAPI.networkTypeAPI.deleteApplication(rec.networkType.id, rec.application.id)
      await onFail(400, () => prisma.deleteApplicationNetworkTypeLink({ id }))
      return logs
    }
    catch (err) {
      appLogger.log('Error deleting applicationNetworkTypeLink: ' + err)
      throw err
    }
  }

  async pushApplicationNetworkTypeLink (id) {
    try {
      var rec = await this.retrieveApplicationNetworkTypeLink(id)
      // push devicenetworkTypeLinks
      let { records: deviceNtls } = await this.modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks({ applicationId: rec.application.id })
      await Promise.all(deviceNtls.map(x => this.modelAPI.deviceNetworkTypeLinks.pushDeviceNetworkTypeLink(x.id)))
      var logs = await this.modelAPI.networkTypeAPI.pushApplication(rec.networkType.id, rec.application.id, rec.networkSettings)
      rec.remoteAccessLogs = logs
      return rec
    }
    catch (err) {
      appLogger.log('Error updating applicationNetworkTypeLink: ' + err)
      throw err
    }
  }

  async pullApplicationNetworkTypeLink () {
  }

  async validateCompanyForApplication (companyId, applicationId) {
    if (!companyId) return
    try {
      const application = await this.modelAPI.applications.retrieveApplication(applicationId)
      if (application.company.id !== companyId) {
        throw new httpError.Unauthorized()
      }
    }
    catch (err) {
      appLogger.log('Error validating company ' + companyId + ' for ' + 'application ' + applicationId + '.')
      throw err
    }
  }

  async validateCompanyForApplicationNetworkTypeLink (companyId, antlId) {
    if (!companyId) return
    try {
      var antl = await this.retrieveApplicationNetworkTypeLink(antlId)
      await this.validateCompanyForApplication(companyId, antl.application.id)
    }
    catch (err) {
      appLogger.log('Error validating company ' + companyId + ' for ' + 'applicationNetworkLink ' + antlId + '.')
      throw err
    }
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
