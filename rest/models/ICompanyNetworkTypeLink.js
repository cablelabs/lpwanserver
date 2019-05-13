var appLogger = require('../lib/appLogger.js')
const { prisma, formatInputData, formatRelationshipsIn } = require('../lib/prisma')
const { onFail } = require('../lib/utils')
var httpError = require('http-errors')

// var protocolDataAccess = require('../networkProtocols/networkProtocolDataAccess')

const R = require('ramda')

module.exports = class CompanyNetworkTypeLink {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
  }

  async create (companyId, networkTypeId, networkSettings, { remoteOrigin = false } = {}) {
    try {
      const data = formatInputData({
        companyId,
        networkTypeId,
        networkSettings: networkSettings && JSON.stringify(networkSettings)
      })
      const rec = await prisma.createCompanyNetworkTypeLink(data).$fragment(fragments.basic)
      if (!remoteOrigin) {
        var logs = await this.modelAPI.networkTypeAPI.addCompany(networkTypeId, companyId, networkSettings)
        rec.remoteAccessLogs = logs
      }
      return parseNetworkSettings(rec)
    }
    catch (err) {
      appLogger.log('Error creating companyNetworkTypeLink: ' + err)
      throw err
    }
  }

  async load (id) {
    const rec = await onFail(400, () => prisma.companyNetworkTypeLink({ id }).$fragment(fragments.basic))
    if (!rec) throw httpError(404, 'CompanyNetworkTypeLink not found')
    return parseNetworkSettings(rec)
  }

  async update ({ id, ...data }, { remoteOrigin = false } = {}) {
    try {
      if (data.networkSettings) {
        data.networkSettings = JSON.stringify(data.networkSettings)
      }
      data = formatInputData(data)
      const rec = await prisma.updateCompanyNetworkTypeLink({ data, where: { id } }).$fragment(fragments.basic)
      if (!remoteOrigin) {
        var logs = await this.modelAPI.networkTypeAPI.pushCompany(rec.networkType.id, rec.company.id, rec.networkSettings)
        rec.remoteAccessLogs = logs
      }
      return parseNetworkSettings(rec)
    }
    catch (err) {
      appLogger.log('Error updating companyNetworkTypeLink: ' + err)
      throw err
    }
  }

  async remove (id) {
    try {
      var rec = await this.load(id)
      // Delete applicationNetworkTypeLinks
      let { records } = await this.modelAPI.applicationNetworkTypeLinks.list({ companyId: rec.company.id })
      await Promise.all(records.map(x => this.modelAPI.applicationNetworkTypeLinks.remove(x.id)))
      // Don't delete the local record until the remote operations complete.
      var logs = await this.modelAPI.networkTypeAPI.deleteCompany(rec.networkType.id, rec.company.id)
      await onFail(400, () => prisma.deleteCompanyNetworkTypeLink({ id }))
      return logs
    }
    catch (err) {
      appLogger.log('Error deleting companyNetworkTypeLink: ' + err)
      throw err
    }
  }

  async pushCompanyNetworkTypeLink (id) {
    try {
      var rec = await this.load(id)
      // push applicationNetworkTypeLinks
      let { records } = await this.modelAPI.applicationNetworkTypeLinks.list({ companyId: rec.company.id })
      await Promise.all(records.map(x => this.modelAPI.applicationNetworkTypeLinks.pushApplicationNetworkTypeLink(x.id)))
      var logs = await this.modelAPI.networkTypeAPI.pushCompany(rec.networkType.id, rec.company.id, rec.networkSettings)
      rec.remoteAccessLogs = logs
      return rec
    }
    catch (err) {
      appLogger.log('Error updating companyNetworkTypeLink: ' + err)
      throw err
    }
  }

  async list ({ limit, offset, ...where } = {}) {
    where = formatRelationshipsIn(where)
    const query = { where }
    if (limit) query.first = limit
    if (offset) query.skip = offset
    const [records, totalCount] = await Promise.all([
      prisma.companyNetworkTypeLinks(query).$fragment(fragments.basic),
      prisma.companyNetworkTypeLinksConnection({ where }).aggregate().count()
    ])
    return { totalCount, records: records.map(parseNetworkSettings) }
  }

  async pullCompanyNetworkTypeLink (networkTypeId) {
    try {
      var logs = await this.modelAPI.networkTypeAPI.pullCompany(networkTypeId)
      let companies = JSON.parse(logs[Object.keys(logs)[0]].logs)
      appLogger.log(companies)
      let nsCoId = []
      let localCoId = []
      for (var index in companies.result) {
        let company = companies.result[index]
        // Mapping of Org Ids to Company Ids
        nsCoId.push(company.id)

        // see if it exists first
        let existingCompany = await this.modelAPI.companies.list({ search: company.name })
        if (existingCompany.totalCount > 0) {
          existingCompany = existingCompany.records[0]
          appLogger.log(company.name + ' already exists')
          localCoId.push(existingCompany.id)
        }
        else {
          appLogger.log('creating ' + company.name)
          existingCompany = await this.modelAPI.companies.create(company.name, this.modelAPI.companies.COMPANY_VENDOR)
          localCoId.push(existingCompany.id)
        }
        // see if it exists first
        let existingCompanyNTL = await this.modelAPI.companyNetworkTypeLinks.list({ companyId: existingCompany.id })
        if (existingCompanyNTL.totalCount > 0) {
          appLogger.log(company.name + ' link already exists')
        }
        else {
          appLogger.log('creating Network Link for ' + company.name)
          this.modelAPI.companyNetworkTypeLinks.create(existingCompany.id, networkTypeId, { region: '' })
        }
      }
      logs = await this.modelAPI.networkTypeAPI.pullApplication(networkTypeId)
      let applications = JSON.parse(logs[Object.keys(logs)[0]].logs)
      appLogger.log(applications)
      let nsAppId = []
      let localAppId = []
      for (var index in applications.result) {
        let application = applications.result[index]
        nsAppId.push(application.id)

        // see if it exists first
        let existingApplication = await this.modelAPI.applications.list({ search: application.name })
        if (existingApplication.totalCount > 0) {
          existingApplication = existingApplication.records[0]
          localAppId.push(existingApplication.id)
          appLogger.log(application.name + ' already exists')
        }
        else {
          appLogger.log('creating ' + JSON.stringify(application))
          let coIndex = nsCoId.indexOf(application.organizationID)
          existingApplication = await this.modelAPI.applications.create({
            ...R.pick(['name', 'description'], application),
            companyId: localCoId[coIndex],
            reportingProtocolId: 1,
            baseUrl: 'http://set.me.to.your.real.url:8888'
          })
          localAppId.push(existingApplication.id)
        }
        // see if it exists first
        let existingApplicationNTL = await this.modelAPI.applicationNetworkTypeLinks.list({ applicationId: existingApplication.id })
        if (existingApplicationNTL.totalCount > 0) {
          appLogger.log(application.name + ' link already exists')
        }
        else {
          appLogger.log('creating Network Link for ' + application.name)
          const appNtlData = { applicationId: existingApplication.id, networkTypeId, networkSettings: {} }
          this.modelAPI.applicationNetworkTypeLinks.create(appNtlData, { companyId: existingApplication.company.id })
        }
      }

      logs = await this.modelAPI.networkTypeAPI.pullDeviceProfiles(networkTypeId)
      let deviceProfiles = JSON.parse(logs[Object.keys(logs)[0]].logs)
      appLogger.log(JSON.stringify(deviceProfiles))
      let nsDpId = []
      let localDpId = []
      for (var index in deviceProfiles.result) {
        let deviceProfile = deviceProfiles.result[index]
        nsDpId.push(deviceProfile.deviceProfileID)
        let networkSettings = await this.modelAPI.networkTypeAPI.pullDeviceProfile(networkTypeId, deviceProfile.deviceProfileID)
        networkSettings = JSON.parse(networkSettings[Object.keys(logs)[0]].logs)
        networkSettings = networkSettings.deviceProfile

        // see if it exists first
        let existingDeviceProfile = await this.modelAPI.deviceProfiles.list({ search: deviceProfile.name })
        if (existingDeviceProfile.totalCount > 0) {
          existingDeviceProfile = existingDeviceProfile.records[0]
          localDpId.push(existingDeviceProfile.id)
          appLogger.log(deviceProfile.name + ' ' + existingDeviceProfile.id + ' already exists')
          appLogger.log(JSON.stringify(existingDeviceProfile))
          existingDeviceProfile.networkSettings = networkSettings
          appLogger.log(JSON.stringify(existingDeviceProfile))
          await this.modelAPI.deviceProfiles.update(existingDeviceProfile)
        }
        else {
          appLogger.log('creating ' + deviceProfile.name)
          let coIndex = nsCoId.indexOf(deviceProfile.organizationID)
          appLogger.log(networkTypeId, localCoId[coIndex], deviceProfile.name, networkSettings)
          existingDeviceProfile = await this.modelAPI.deviceProfiles.create(networkTypeId, localCoId[coIndex], deviceProfile.name, deviceProfile.description, networkSettings)
          localDpId.push(existingDeviceProfile.id)
        }
      }

      for (var appIndex in nsAppId) {
        logs = await this.modelAPI.networkTypeAPI.pullDevices(networkTypeId, nsAppId[appIndex])
        let devices = JSON.parse(logs[Object.keys(logs)[0]].logs)
        appLogger.log(JSON.stringify(devices))
        for (var index in devices.result) {
          let device = devices.result[index]

          // see if it exists first
          let existingDevice = await this.modelAPI.devices.list({ search: device.name })
          if (existingDevice.totalCount > 0) {
            existingDevice = existingDevice.records[0]
            appLogger.log(device.name + ' already exists')
            await existingDevice.updateDevice(existingDevice)
          }
          else {
            appLogger.log('creating ' + JSON.stringify(device))
            let appIndex = nsAppId.indexOf(device.applicationID)
            appLogger.log('localAppId[' + appIndex + '] = ' + localAppId[appIndex])
            existingDevice = await this.modelAPI.devices.create(device.name, device.description, localAppId[appIndex])
          }

          let existingDeviceNTL = await this.modelAPI.deviceNetworkTypeLinks.list({ deviceId: existingDevice.id })
          if (existingDeviceNTL.totalCount > 0) {
            appLogger.log(device.name + ' link already exists')
          }
          else {
            appLogger.log('creating Network Link for ' + device.name)
            let dpIndex = nsDpId.indexOf(device.deviceProfileID)
            // let coId = protocolDataAccess.prototype.getCompanyByApplicationId(existingDevice.applicationId);

            let tempApp = await this.modelAPI.applications.load(localAppId[appIndex])
            let coId = tempApp.company.id

            this.modelAPI.deviceNetworkTypeLinks.create(existingDevice.id, networkTypeId, localDpId[dpIndex], device, coId)
          }
        }
      }

      return logs
    }
    catch (err) {
      appLogger.log('Error pulling from Network : ' + networkTypeId + ' ' + err)
      throw err
    }
  }
}

// ******************************************************************************
// Helpers
// ******************************************************************************
function parseNetworkSettings (x) {
  return typeof x.networkSettings === 'string'
    ? { ...x, networkSettings: JSON.parse(x.networkSettings) }
    : x
}

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicCompanyNetworkTypeLink on CompanyNetworkTypeLink {
    id
    networkSettings
    company {
      id
    }
    networkType {
      id
    }
  }`
}
