const { prisma } = require('../lib/prisma')
const R = require('ramda')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const { redisClient } = require('../lib/redis')
const { stringifyProp, parseProp } = require('../lib/utils')

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

// ******************************************************************************
// Database Client
// ******************************************************************************
const DB = new CacheFirstStrategy({
  name: 'companyNetworkTypeLink',
  pluralName: 'companyNetworkTypeLinks',
  fragments,
  defaultFragmentKey: 'basic',
  prisma,
  redis: redisClient,
  log: logger.info.bind(logger)
})

// ******************************************************************************
// Helpers
// ******************************************************************************
const parseNetworkSettings = parseProp('networkSettings')
const stringifyNetworkSettings = stringifyProp('networkSettings')

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = class CompanyNetworkTypeLink {
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

  async create (companyId, networkTypeId, networkSettings, { remoteOrigin = false } = {}) {
    try {
      const data = { companyId, networkTypeId, networkSettings }
      const rec = await DB.create(stringifyNetworkSettings(data))
      if (!remoteOrigin) {
        var logs = await this.modelAPI.networkTypeAPI.addCompany(networkTypeId, companyId, networkSettings)
        rec.remoteAccessLogs = logs
      }
      return parseNetworkSettings(rec)
    }
    catch (err) {
      logger.error('Error creating companyNetworkTypeLink:', err)
      throw err
    }
  }



  async update ({ id, ...data }, { remoteOrigin = false } = {}) {
    try {
      const rec = await DB.update({ id }, stringifyNetworkSettings(data))
      if (!remoteOrigin) {
        var logs = await this.modelAPI.networkTypeAPI.pushCompany(rec.networkType.id, rec.company.id, rec.networkSettings)
        rec.remoteAccessLogs = logs
      }
      return parseNetworkSettings(rec)
    }
    catch (err) {
      logger.error('Error updating companyNetworkTypeLink: ', err)
      throw err
    }
  }

  async remove (id) {
    try {
      var rec = await this.load(id)
      // Delete applicationNetworkTypeLinks
      let [ records ] = await this.modelAPI.applicationNetworkTypeLinks.list({ companyId: rec.company.id })
      await Promise.all(records.map(x => this.modelAPI.applicationNetworkTypeLinks.remove(x.id)))
      // Don't delete the local record until the remote operations complete.
      var logs = await this.modelAPI.networkTypeAPI.deleteCompany(rec.networkType.id, rec.company.id)
      await DB.remove({ id })
      return logs
    }
    catch (err) {
      logger.error('Error deleting companyNetworkTypeLink: ', err)
      throw err
    }
  }

  async pushCompanyNetworkTypeLink (id) {
    try {
      var rec = await this.load(id)
      // push applicationNetworkTypeLinks
      let [ records ] = await this.modelAPI.applicationNetworkTypeLinks.list({ companyId: rec.company.id })
      await Promise.all(records.map(x => this.modelAPI.applicationNetworkTypeLinks.pushApplicationNetworkTypeLink(x.id)))
      var logs = await this.modelAPI.networkTypeAPI.pushCompany(rec.networkType.id, rec.company.id, rec.networkSettings)
      rec.remoteAccessLogs = logs
      return rec
    }
    catch (err) {
      logger.error('Error updating companyNetworkTypeLink: ', err)
      throw err
    }
  }

  async pullCompanyNetworkTypeLink (networkTypeId) {
    let existingCompany
    try {
      var logs = await this.modelAPI.networkTypeAPI.pullCompany(networkTypeId)
      let companies = JSON.parse(logs[Object.keys(logs)[0]].logs)
      let nsCoId = []
      let localCoId = []
      for (var index in companies.result) {
        let company = companies.result[index]
        // Mapping of Org Ids to Company Ids
        nsCoId.push(company.id)

        // see if it exists first
        let [existingCompanies] = await this.modelAPI.companies.list({ search: company.name })
        if (!existingCompanies.length) {
          existingCompany = existingCompanies[0]
          localCoId.push(existingCompany.id)
        }
        else {
          existingCompany = await this.modelAPI.companies.create(company.name, this.modelAPI.companies.COMPANY_VENDOR)
          localCoId.push(existingCompany.id)
        }
        // see if it exists first
        let [ctls] = await this.list({ companyId: existingCompany.id }, { limit: 1 })
        if (!ctls.length) {
          this.modelAPI.companyNetworkTypeLinks.create(existingCompany.id, networkTypeId, { region: '' })
        }
      }
      logs = await this.modelAPI.networkTypeAPI.pullApplication(networkTypeId)
      let applications = JSON.parse(logs[Object.keys(logs)[0]].logs)
      let nsAppId = []
      let localAppId = []
      for (var index in applications.result) {
        let application = applications.result[index]
        nsAppId.push(application.id)

        // see if it exists first
        let existingApplication
        let [appList] = await this.modelAPI.applications.list({ search: application.name })
        if (appList.length) {
          existingApplication = appList[0]
          localAppId.push(existingApplication.id)
        }
        else {
          let coIndex = nsCoId.indexOf(application.organizationID)
          const { records: reportingProtos } = await this.modelAPI.reportingProtos.list()
          existingApplication = await this.modelAPI.applications.create({
            ...R.pick(['name', 'description'], application),
            companyId: localCoId[coIndex],
            reportingProtocolId: reportingProtos[0].id,
            baseUrl: 'http://set.me.to.your.real.url:8888'
          })
          localAppId.push(existingApplication.id)
        }
        // see if it exists first
        let [ existingApps ] = await this.modelAPI.applicationNetworkTypeLinks.list({ applicationId: existingApplication.id })
        if (!existingApps.length) {
          const appNtlData = { applicationId: existingApplication.id, networkTypeId, networkSettings: {} }
          this.modelAPI.applicationNetworkTypeLinks.create(appNtlData, { companyId: existingApplication.company.id })
        }
      }

      logs = await this.modelAPI.networkTypeAPI.pullDeviceProfiles(networkTypeId)
      let deviceProfiles = JSON.parse(logs[Object.keys(logs)[0]].logs)
      let nsDpId = []
      let localDpId = []
      for (var index in deviceProfiles.result) {
        let existingDeviceProfile
        let deviceProfile = deviceProfiles.result[index]
        nsDpId.push(deviceProfile.deviceProfileID)
        let networkSettings = await this.modelAPI.networkTypeAPI.pullDeviceProfile(networkTypeId, deviceProfile.deviceProfileID)
        networkSettings = JSON.parse(networkSettings[Object.keys(logs)[0]].logs)
        networkSettings = networkSettings.deviceProfile

        // see if it exists first
        let [ existingDeviceProfiles ] = await this.modelAPI.deviceProfiles.list({ search: deviceProfile.name, limit: 1 })
        if (existingDeviceProfiles.length) {
          existingDeviceProfile = existingDeviceProfiles[0]
          localDpId.push(existingDeviceProfile.id)
          existingDeviceProfile.networkSettings = networkSettings
          await this.modelAPI.deviceProfiles.update(existingDeviceProfile)
        }
        else {
          let coIndex = nsCoId.indexOf(deviceProfile.organizationID)
          existingDeviceProfile = await this.modelAPI.deviceProfiles.create(networkTypeId, localCoId[coIndex], deviceProfile.name, deviceProfile.description, networkSettings)
          localDpId.push(existingDeviceProfile.id)
        }
      }

      for (var appIndex in nsAppId) {
        let existingDevice
        logs = await this.modelAPI.networkTypeAPI.pullDevices(networkTypeId, nsAppId[appIndex])
        let devices = JSON.parse(logs[Object.keys(logs)[0]].logs)
        for (var index in devices.result) {
          let device = devices.result[index]

          // see if it exists first
          let [ existingDevices ] = await this.modelAPI.devices.list({ search: device.name })
          if (existingDevices.length) {
            existingDevice = existingDevices[0]
            await existingDevice.updateDevice(existingDevice)
          }
          else {
            let appIndex = nsAppId.indexOf(device.applicationID)
            const devData = { ...R.pick(['name', 'description'], device), applicationId: localAppId[appIndex] }
            existingDevice = await this.modelAPI.devices.create(devData)
          }

          let [ devNtls ] = await this.modelAPI.deviceNetworkTypeLinks.list({ deviceId: existingDevice.id })
          if (!devNtls.length) {
            let dpIndex = nsDpId.indexOf(device.deviceProfileID)
            // let coId = protocolDataAccess.prototype.getCompanyByApplicationId(existingDevice.applicationId);

            let tempApp = await this.modelAPI.applications.load(localAppId[appIndex])
            let coId = tempApp.company.id
            let devNtlData = {
              deviceId: existingDevice.id,
              networkTypeId,
              deviceProfileId: localDpId[dpIndex],
              networkSettings: device
            }
            this.modelAPI.deviceNetworkTypeLinks.create(devNtlData, { validateCompanyId: coId })
          }
        }
      }

      return logs
    }
    catch (err) {
      throw err
    }
  }
}
