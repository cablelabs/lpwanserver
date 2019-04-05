const appLogger = require('../lib/appLogger.js')
const NetworkProtocolDataAccess = require('../networkProtocols/networkProtocolDataAccess.js')
const reportingProtocol = require('../reportingProtocols/postHandler')
const { prisma, formatInputData, formatRelationshipsIn } = require('../lib/prisma')
var httpError = require('http-errors')
const { onFail } = require('../lib/utils')

class Application {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
    this.running = new Map()
  }

  async retrieveApplications ({ limit, offset, ...where } = {}) {
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
    records = records.map(x => ({ ...x, running: this.running.has(x.id) }))
    return { totalCount, records }
  }

  async retrieveApplication (id, fragment) {
    const app = await loadApplication({ id }, fragment)
    app.running = this.running.has(id)
    try {
      const { records } = await this.modelAPI.
        applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLinks({ applicationId: id })
      if (records.length) {
        app.networks = records.map(x => x.networkType.id)
      }
    }
    catch (err) {
      // ignore
    }
    return app
  }

  createApplication (data) {
    data = formatInputData(data)
    return prisma.createApplication(data).$fragment(fragments.basic)
  }

  updateApplication ({ id, running, ...data }) {
    // Throw away running prop, if present
    if (!id) throw httpError(400, 'No existing Application ID')
    data = formatInputData(data)
    return prisma.updateApplication({ data, where: { id } }).$fragment(fragments.basic)
  }

  async deleteApplication (id) {
    // Delete devices
    try {
      let { records } = await this.modelAPI.devices.retrieveDevices({ applicationId: id })
      await Promise.all(records.map(x => this.modelAPI.devices.deleteDevice(x.id)))
    }
    catch (err) {
      appLogger.log(`Error deleting application's devices: ${err}`, 'error')
    }
    // Delete applicationNetworkTypeLinks
    try {
      let { records } = await this.modelAPI.applicationNetworkTypeLinks.retrieveApplicationNetworkTypeLinks({ applicationId: id })
      await Promise.all(records.map(x => this.modelAPI.applicationNetworkTypeLinks.deleteApplicationNetworkTypeLink(x.id)))
    }
    catch (err) {
      appLogger.log(`Error deleting application's networkTypeLinks: ${err}`, 'error')
    }
    // Kill the application if it's running.
    if (this.running.has(id)) await this.stopApplication(id)
    // Delete application record
    return onFail(400, () => prisma.deleteApplication({ id }))
  }

  async startApplication (id) {
    this.running.set(id, true)
    return ({})
  }

  async stopApplication (id) {
    this.running.set(id, false)
  }

  async testApplication (id, data) {
    try {
      const app = await loadApplication({ id })
      let response = await reportingProtocol.report(data, app.baseUrl, app.name)
      return response.statusCode
    }
    catch (err) {
      appLogger.log('Failed test, error = ' + err)
      throw err
    }
  }

  async passDataToApplication (id, networkId, data) {
    let network = await this.modelAPI.networks.retrieveNetwork(networkId)
    let proto = await this.modelAPI.networkProtocolAPI.getProtocol(network)
    let dataAPI = new NetworkProtocolDataAccess(modelAPI, 'ReportingProtocol')
    await proto.api.passDataToApplication(network, id, data, dataAPI)
    return 204
  }

  async startApplications () {
    try {
      const recs = await prisma.applications().$fragment(fragments.id)
      await Promise.all(recs.map(x => this.startApplication(x.id)))
    }
    catch (err) {
      appLogger.log('Failed to start applications: ' + err, 'error')
      throw err
    }
  }
}

async function loadApplication (uniqueKeyObj, fragement = 'basic') {
  const rec = await onFail(400, () => prisma.application(uniqueKeyObj).$fragment(fragments[fragement]))
  if (!rec) throw httpError(404, 'Application not found')
  return rec
}

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicApplication on Application {
    id
    name
    description
    baseUrl
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

//* *****************************************************************************
// Exports
//* *****************************************************************************
module.exports = {
  Application
}
