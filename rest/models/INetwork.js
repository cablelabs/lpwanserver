const NetworkProtocolDataAccess = require('../networkProtocols/networkProtocolDataAccess')
const appLogger = require('../lib/appLogger')
const R = require('ramda')
const { prisma, formatRelationshipsIn, formatInputData } = require('../lib/prisma')
const httpError = require('http-errors')
const { onFail } = require('../lib/utils')

module.exports = class Network {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
  }

  async createNetwork (data) {
    let dataAPI = new NetworkProtocolDataAccess(this.modelAPI, 'INetwork Create')
    let k = dataAPI.genKey()
    if (data.securityData) {
      const securityDataDefaults = {
        authorized: false,
        message: 'Pending Authorization',
        enabled: true
      }
      data.securityData = R.merge(securityDataDefaults, data.securityData)
      data.securityData = dataAPI.hide(null, data.securityData, k)
    }
    data = formatInputData(data)
    let record = await prisma.createNetwork(data).$fragment(fragments.basic)
    if (record.securityData) {
      dataAPI.putProtocolDataForKey(record.id, record.networkProtocol.id, genKey(record.id), k)
      record.securityData = dataAPI.access(null, record.securityData, k)
      let { securityData } = await authorizeAndTest(record, this.modelAPI, k, this, dataAPI)
      securityData = dataAPI.hide(null, securityData, k)
      record = await prisma.updateNetwork({ data: { securityData }, where: { id: record.id } }).$fragment(fragments.basic)
      record.securityData = dataAPI.access(null, record.securityData, k)
    }
    return this.retrieveNetwork(record.id)
  }

  async updateNetwork ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing Network ID')
    let dataAPI = new NetworkProtocolDataAccess(this.modelAPI, 'INetwork Update')
    const old = await this.retrieveNetwork(id)
    const k = await dataAPI.getProtocolDataForKey(id, old.networkProtocol.id, genKey(id))
    const candidate = R.merge(old, data)
    let { securityData } = await authorizeAndTest(candidate, this.modelAPI, k, this, dataAPI)
    if (data.securityData) {
      data.securityData = dataAPI.hide(null, securityData, k)
    }
    data = formatInputData(data)
    await prisma.updateNetwork({ data, where: { id } }).$fragment(fragments.basic)
    return this.retrieveNetwork(id)
  }

  async retrieveNetwork (id) {
    const rec = await loadNetwork({ id })
    if (rec.securityData) {
      let dataAPI = new NetworkProtocolDataAccess(this.modelAPI, 'INetwork Retrieve')
      let k = await dataAPI.getProtocolDataForKey(id,
        rec.networkProtocol.id,
        genKey(id))
      rec.securityData = await dataAPI.access(rec, rec.securityData, k)
      let networkProtocol = await this.modelAPI.networkProtocols.retrieveNetworkProtocol(rec.networkProtocol.id)
      rec.masterProtocol = networkProtocol.masterProtocol
    }
    return rec
  }

  async retrieveNetworks ({ limit, offset, ...where } = {}) {
    where = formatRelationshipsIn(where)
    if (where.search) {
      where.name_contains = where.search
      delete where.search
    }
    const query = { where }
    if (limit) query.first = limit
    if (offset) query.skip = offset
    let [records, totalCount] = await Promise.all([
      prisma.networks(query).$fragment(fragments.basic),
      prisma.networksConnection({ where }).aggregate().count()
    ])
    let dataAPI = new NetworkProtocolDataAccess(this.modelAPI, 'INetwork Retrieve bulk')
    records = await Promise.all(records.map(async rec => {
      if (!rec.securityData) return rec
      let k = await dataAPI.getProtocolDataForKey(
        rec.id,
        rec.networkProtocol.id,
        genKey(rec.id))
      const securityData = await dataAPI.access(rec, rec.securityData, k)
      return { ...rec, securityData }
    }))
    return { totalCount, records }
  }

  async deleteNetwork (id) {
    let dataAPI = new NetworkProtocolDataAccess(this.modelAPI, 'INetwork Delete')
    let old = await loadNetwork({ id })
    await dataAPI.deleteProtocolDataForKey(id,
      old.networkProtocol.id,
      genKey(id))
    return onFail(400, () => prisma.deleteNetwork({ id }))
  }

  async pullNetwork (id) {
    try {
      let network = await this.retrieveNetwork(id)
      if (!network.securityData.authorized) {
        throw new Error('Network is not authorized.  Cannot pull')
      }
      let networkType = await this.modelAPI.networkTypes.retrieveNetworkType(network.networkType.id)
      var npda = new NetworkProtocolDataAccess(this.modelAPI, 'Pull Network')
      npda.initLog(networkType, network)
      appLogger.log(network)
      let result = await this.modelAPI.networkProtocolAPI.pullNetwork(npda, network, this.modelAPI)
      appLogger.log('Success pulling from Network : ' + id)
      return result
    }
    catch (err) {
      appLogger.log('Error pulling from Network : ' + id + ' ' + err)
      throw err
    }
  }

  async pushNetwork (id) {
    try {
      let network = await this.retrieveNetwork(id)
      let networkType = await this.modelAPI.networkTypes.retrieveNetworkTypes(network.networkType.id)
      var npda = new NetworkProtocolDataAccess(this.modelAPI, 'Push Network')
      npda.initLog(networkType, network)
      appLogger.log(network)
      let result = await this.modelAPI.networkProtocolAPI.pushNetwork(npda, network, this.modelAPI)
      appLogger.log('Success pushing to Network : ' + id)
      return result
    }
    catch (err) {
      appLogger.log('Error pushing to Network : ' + id + ' ' + err)
      throw err
    }
  }

  async pushNetworks (networkTypeId) {
    try {
      let { records } = await this.retrieveNetworks({ networkTypeId })
      let networkType = await this.modelAPI.networkTypes.retrieveNetworkType(networkTypeId)
      var npda = new NetworkProtocolDataAccess(this.modelAPI, 'Push Network')
      npda.initLog(networkType, records)
      records = records.filter(R.path(['securityData', 'authorized']))
      await Promise.all(records.map(rec => this.modelAPI.networkProtocolAPI.pushNetwork(npda, rec, this.modelAPI)))
      appLogger.log('Success pushing to Networks')
    }
    catch (err) {
      appLogger.log('Error pushing to Networks : ' + ' ' + err)
      throw err
    }
  }
}

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicNetwork on Network {
    id
    name
    baseUrl
    securityData
    networkProvider {
      id
    }
    networkType {
      id
    }
    networkProtocol {
      id
    }
  }`
}

// ******************************************************************************
// Helpers
// ******************************************************************************
async function loadNetwork (uniqueKeyObj, fragementKey = 'basic') {
  const rec = await onFail(400, () => prisma.network(uniqueKeyObj).$fragment(fragments[fragementKey]))
  if (!rec) throw httpError(404, 'Network not found')
  return rec
}

const genKey = function (networkId) {
  return 'nk' + networkId
}

async function authorizeAndTest (network, modelAPI) {
  if (network.securityData.authorized) {
    return network
  }
  try {
    await modelAPI.networkProtocolAPI.connect(network)
    network.securityData.authorized = true
    try {
      await modelAPI.networkProtocolAPI.test(network)
      appLogger.log('Test Success ' + network.name, 'info')
      network.securityData.message = 'ok'
    }
    catch (err) {
      appLogger.log('Test of ' + network.name + ': ' + err)
      network.securityData.authorized = false
      network.securityData.message = err.toString()
    }
    return network
  }
  catch (err) {
    if (err.code === 42) return network
    appLogger.log('Connection of ' + network.name + ' Failed: ' + err)
    let errorMessage = {}
    if (err === 301 || err === 405 || err === 404) {
      errorMessage = new Error('Invalid URI to the ' + network.name + ' Network: "' + network.baseUrl + '"')
    }
    else if (err === 401) {
      errorMessage = new Error('Authentication not recognized for the ' + network.name + ' Network')
    }
    else {
      errorMessage = new Error('Server Error on ' + network.name + ' Network:')
    }
    network.securityData.authorized = false
    network.securityData.message = errorMessage.toString()
    return network
  }
}
