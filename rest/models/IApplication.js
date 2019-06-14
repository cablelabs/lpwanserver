const appLogger = require('../lib/appLogger.js')
const NetworkProtocolDataAccess = require('../networkProtocols/networkProtocolDataAccess.js')
const { prisma } = require('../lib/prisma')
var httpError = require('http-errors')
const { renameKeys } = require('../lib/utils')
const R = require('ramda')
const CacheFirstStrategy = require('../../lib/prisma-cache/src/cache-first-strategy')
const { redisClient } = require('../lib/redis')

// ******************************************************************************
// Fragments for how the data should be returned from Prisma.
// ******************************************************************************
const fragments = {
  basic: `fragment BasicApplication on Application {
    id
    name
    description
    baseUrl
    enabled
    company {
      id
    }
    reportingProtocol {
      id
    }
  }`,
  id: `fragment ApplicationId on Application {
    id
  }`
}

// ******************************************************************************
// Database Client
// ******************************************************************************
const DB = new CacheFirstStrategy({
  name: 'application',
  pluralName: 'applications',
  fragments,
  defaultFragmentKey: 'basic',
  prisma,
  redis: redisClient,
  log: appLogger.log.bind(appLogger)
})

// ******************************************************************************
// Helpers
// ******************************************************************************
const renameEnabledToRunning = renameKeys({ enabled: 'running' })
const renameRunningToEnabled = renameKeys({ running: 'enabled' })

// ******************************************************************************
// Model
// ******************************************************************************
class Application {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
  }

  async load (id, opts) {
    const app = await DB.load({ id }, opts)
    try {
      const [ records ] = await this.modelAPI.applicationNetworkTypeLinks.list({ applicationId: id })
      if (records.length) {
        app.networks = records.map(x => x.networkType.id)
      }
    }
    catch (err) {
      // ignore
    }
    return renameEnabledToRunning(app)
  }

  async list (query = {}, opts) {
    if (query.search) {
      query = renameKeys({ search: 'name_contains' }, query)
    }
    let [ records, totalCount ] = await DB.list(query, opts)
    return [ records.map(renameEnabledToRunning), totalCount ]
  }

  create (data) {
    return DB.create(renameRunningToEnabled(data))
  }

  update ({ id, ...data }, opts) {
    // Throw away running prop, if present
    if (!id) throw httpError(400, 'No existing Application ID')
    return DB.update({ id }, R.omit(['running', 'enabled'], data), opts)
  }

  async remove (id) {
    // Delete devices
    try {
      let [ records ] = await this.modelAPI.devices.list({ applicationId: id })
      await Promise.all(records.map(x => this.modelAPI.devices.remove(x.id)))
    }
    catch (err) {
      appLogger.log(`Error deleting application's devices: ${err}`, 'error')
    }
    // Delete applicationNetworkTypeLinks
    try {
      let [ records ] = await this.modelAPI.applicationNetworkTypeLinks.list({ applicationId: id })
      await Promise.all(records.map(x => this.modelAPI.applicationNetworkTypeLinks.remove(x.id)))
    }
    catch (err) {
      appLogger.log(`Error deleting application's networkTypeLinks: ${err}`, 'error')
    }
    const app = DB.load({ id })
    // Kill the application if it's running.
    if (app.enabled) await this.stopApplication(id, false)
    // Delete application record
    await DB.remove({ id })
  }

  async startApplication (id) {
    // Ensure app has baseUrl
    let app = await DB.load({ id })
    if (!app.baseUrl) {
      throw httpError(400, 'Base URL required to start application.')
    }
    await DB.update({ id }, { enabled: true })
    // Call startApplication on NetworkTypes
    let [ records ] = await this.modelAPI.applicationNetworkTypeLinks.list({ application: { id } })
    const logs = await Promise.all(records.map(x => this.modelAPI.networkTypeAPI.startApplication(x.networkType.id, id)))
    return R.flatten(logs)
  }

  async stopApplication (id, update = true) {
    if (update) await DB.update({ id }, { enabled: false })
    // Call stopApplication on NetworkTypes
    let [ records ] = await this.modelAPI.applicationNetworkTypeLinks.list({ application: { id } })
    const logs = await Promise.all(records.map(x => this.modelAPI.networkTypeAPI.stopApplication(x.networkType.id, id)))
    return R.flatten(logs)
  }

  async testApplication (id, data) {
    try {
      const app = await DB.load({ id })
      const reportingProtocol = await this.modelAPI.reportingProtocols.getHandler(app.reportingProtocol.id)
      let response = await reportingProtocol.report(data, app.baseUrl, app.name)
      return response.statusCode
    }
    catch (err) {
      appLogger.log('Failed test, error = ' + err)
      throw err
    }
  }

  async passDataToApplication (id, networkId, data) {
    // Ensure application is running
    const app = await DB.load({ id })
    if (!app.enabled) return
    // Ensure network is enabled
    const network = await this.modelAPI.networks.load(networkId)
    if (!network.securityData.enabled) return
    // Ensure applicationNetworkTypeLink exists
    const appNtlQuery = { application: { id }, networkType: { id: network.networkType.id }, limit: 1 }
    let [ records ] = await this.modelAPI.applicationNetworkTypeLinks.list(appNtlQuery)
    if (!records.length) return
    // Pass data
    let proto = await this.modelAPI.networkProtocolAPI.getProtocol(network)
    let dataAPI = new NetworkProtocolDataAccess(this.modelAPI, 'ReportingProtocol')
    await proto.passDataToApplication(network, id, data, dataAPI)
  }
}

//* *****************************************************************************
// Exports
//* *****************************************************************************
module.exports = {
  Application
}
