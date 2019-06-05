const appLogger = require('../lib/appLogger.js')
const NetworkProtocolDataAccess = require('../networkProtocols/networkProtocolDataAccess.js')
const { prisma, formatInputData, formatRelationshipsIn, loadRecord } = require('../lib/prisma')
var httpError = require('http-errors')
const { onFail, renameKeys } = require('../lib/utils')
const R = require('ramda')

class Application {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
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
      prisma.applications(query).$fragment(fragments.basic),
      prisma.applicationsConnection({ where }).aggregate().count()
    ])
    records = records.map(renameEnabledToRunning)
    return { totalCount, records }
  }

  async load (id, fragment) {
    const app = await loadApplication({ id }, fragment)
    try {
      const { records } = await this.modelAPI.applicationNetworkTypeLinks.list({ applicationId: id })
      if (records.length) {
        app.networks = records.map(x => x.networkType.id)
      }
    }
    catch (err) {
      // ignore
    }
    return renameEnabledToRunning(app)
  }

  create (data) {
    if (data.running) {
      data.enabled = data.running
      delete data.running
    }
    data = formatInputData(data)
    return prisma.createApplication(data).$fragment(fragments.basic)
  }

  update ({ id, ...data }) {
    // Throw away running prop, if present
    if (!id) throw httpError(400, 'No existing Application ID')
    data = formatInputData(R.omit(['running'], data))
    return prisma.updateApplication({ data, where: { id } }).$fragment(fragments.basic)
  }

  async remove (id) {
    // Delete devices
    try {
      let { records } = await this.modelAPI.devices.list({ applicationId: id })
      await Promise.all(records.map(x => this.modelAPI.devices.remove(x.id)))
    }
    catch (err) {
      appLogger.log(`Error deleting application's devices: ${err}`, 'error')
    }
    // Delete applicationNetworkTypeLinks
    try {
      let { records } = await this.modelAPI.applicationNetworkTypeLinks.list({ applicationId: id })
      await Promise.all(records.map(x => this.modelAPI.applicationNetworkTypeLinks.remove(x.id)))
    }
    catch (err) {
      appLogger.log(`Error deleting application's networkTypeLinks: ${err}`, 'error')
    }
    const app = await loadApplication({ id })
    // Kill the application if it's running.
    if (app.enabled) await this.stopApplication(id, false)
    // Delete application record
    return onFail(400, () => prisma.deleteApplication({ id }))
  }

  async startApplication (id) {
    // Ensure app has baseUrl
    let app = await loadApplication({ id })
    if (!app.baseUrl) {
      throw httpError(400, 'Base URL required to start application.')
    }
    app = await prisma.updateApplication({ data: { enabled: true }, where: { id } }).$fragment(fragments.basic)
    // Call startApplication on NetworkTypes
    let { records } = await this.modelAPI.applicationNetworkTypeLinks.list({ application: { id } })
    const logs = await Promise.all(records.map(x => this.modelAPI.networkTypeAPI.startApplication(x.networkType.id, id)))
    return R.flatten(logs)
  }

  async stopApplication (id, update = true) {
    if (update) await prisma.updateApplication({ data: { enabled: false }, where: { id } })
    // Call stopApplication on NetworkTypes
    let { records } = await this.modelAPI.applicationNetworkTypeLinks.list({ application: { id } })
    const logs = await Promise.all(records.map(x => this.modelAPI.networkTypeAPI.stopApplication(x.networkType.id, id)))
    return R.flatten(logs)
  }

  async testApplication (id, data) {
    try {
      const app = await loadApplication({ id })
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
    const app = await loadApplication({ id })
    if (!app.enabled) return
    // Ensure network is enabled
    const network = await this.modelAPI.networks.load(networkId)
    if (!network.securityData.enabled) return
    // Ensure applicationNetworkTypeLink exists
    const appNtlQuery = { application: { id }, networkType: { id: network.networkType.id }, limit: 1 }
    let { records } = await this.modelAPI.applicationNetworkTypeLinks.list(appNtlQuery)
    if (!records.length) return
    // Pass data
    let proto = await this.modelAPI.networkProtocolAPI.getProtocol(network)
    let dataAPI = new NetworkProtocolDataAccess(this.modelAPI, 'ReportingProtocol')
    await proto.passDataToApplication(network, id, data, dataAPI)
  }
}

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
// Helpers
// ******************************************************************************
const renameEnabledToRunning = renameKeys({ enabled: 'running' })

const loadApplication = loadRecord('application', fragments, 'basic')

//* *****************************************************************************
// Exports
//* *****************************************************************************
module.exports = {
  Application
}
