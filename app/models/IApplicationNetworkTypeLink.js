const { logger } = require('../log')
var httpError = require('http-errors')
const { prisma } = require('../lib/prisma')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const { redisClient } = require('../lib/redis')
const { parseProp, stringifyProp } = require('../lib/utils')

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

// ******************************************************************************
// Database Client
// ******************************************************************************
const DB = new CacheFirstStrategy({
  name: 'applicationNetworkTypeLink',
  pluralName: 'applicationNetworkTypeLinks',
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
module.exports = class ApplicationNetworkTypeLink {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
  }

  async load (id, opts) {
    return parseNetworkSettings(await DB.load({ id }, opts))
  }

  async list (...args) {
    let [ records, totalCount ] = await DB.list(...args)
    return [ records.map(parseNetworkSettings), totalCount ]
  }

  async create (data, { companyId, remoteOrigin = false } = {}) {
    try {
      if (companyId) {
        await this.validateCompanyForApplication(companyId, data.applicationId)
      }
      const rec = await DB.create(stringifyNetworkSettings(data))
      if (!remoteOrigin) {
        const logs = await this.modelAPI.networkTypeAPI.addApplication(rec.networkType.id, rec.application.id, data.networkSettings)
        rec.remoteAccessLogs = logs
      }
      return rec
    }
    catch (err) {
      logger.error('Error creating applicationNetworkTypeLink:', err)
      throw err
    }
  }

  async update ({ id, ...data }, { companyId, remoteOrigin = false } = {}) {
    try {
      await this.validateCompanyForApplicationNetworkTypeLink(companyId, id)
      const rec = await DB.update({ id }, stringifyNetworkSettings(data))
      if (!remoteOrigin) {
        const app = await this.modelAPI.applications.load(rec.application.id)
        var logs = await this.modelAPI.networkTypeAPI.pushApplication(rec.networkType.id, app)
        rec.remoteAccessLogs = logs
      }
      return rec
    }
    catch (err) {
      logger.error('Error updating applicationNetworkTypeLink:', err)
      throw err
    }
  }

  async remove (id, { companyId } = {}) {
    await this.validateCompanyForApplicationNetworkTypeLink(companyId, id)
    try {
      var rec = await DB.load({ id })
      // Delete devicenetworkTypeLinks
      const [ devices ] = await this.modelAPI.devices.list({ applicationId: rec.application.id })
      const dntlQuery = { device: { id_in: devices.map(x => x.id) } }
      let [ deviceNtls ] = await this.modelAPI.deviceNetworkTypeLinks.list(dntlQuery)
      await Promise.all(deviceNtls.map(x => this.modelAPI.deviceNetworkTypeLinks.remove(x.id)))

      // Don't delete the local record until the remote operations complete.
      var logs = await this.modelAPI.networkTypeAPI.deleteApplication(rec.networkType.id, rec.application.id)
      await DB.remove({ id })
      return logs
    }
    catch (err) {
      logger.error('Error deleting applicationNetworkTypeLink:', err)
      throw err
    }
  }

  async pushApplicationNetworkTypeLink (id) {
    try {
      var rec = await this.load(id)
      // push devicenetworkTypeLinks
      let [ deviceNtls ] = await this.modelAPI.deviceNetworkTypeLinks.list({ applicationId: rec.application.id })
      await Promise.all(deviceNtls.map(x => this.modelAPI.deviceNetworkTypeLinks.pushDeviceNetworkTypeLink(x.id)))
      var logs = await this.modelAPI.networkTypeAPI.pushApplication(rec.networkType.id, rec.application.id, rec.networkSettings)
      rec.remoteAccessLogs = logs
      return rec
    }
    catch (err) {
      logger.error('Error updating applicationNetworkTypeLink:', err)
      throw err
    }
  }

  async pullApplicationNetworkTypeLink () {
  }

  async validateCompanyForApplication (companyId, applicationId) {
    if (!companyId) return
    try {
      const application = await this.modelAPI.applications.load(applicationId)
      if (application.company.id !== companyId) {
        throw new httpError.Unauthorized()
      }
    }
    catch (err) {
      logger.debug('Error validating company ' + companyId + ' for ' + 'application ' + applicationId + '.')
      throw err
    }
  }

  async validateCompanyForApplicationNetworkTypeLink (companyId, antlId) {
    if (!companyId) return
    try {
      var antl = await this.load(antlId)
      await this.validateCompanyForApplication(companyId, antl.application.id)
    }
    catch (err) {
      logger.debug('Error validating company ' + companyId + ' for ' + 'applicationNetworkLink ' + antlId + '.')
      throw err
    }
  }
}
