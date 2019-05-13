const NetworkProtocolDataAccess = require('../networkProtocols/networkProtocolDataAccess')
const appLogger = require('../lib/appLogger')
const R = require('ramda')
const { prisma, formatRelationshipsIn, formatInputData } = require('../lib/prisma')
const httpError = require('http-errors')
const { onFail } = require('../lib/utils')
const { encrypt, decrypt, genKey } = require('../lib/crypto')

module.exports = class Network {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
  }

  async create (data) {
    let dataAPI = new NetworkProtocolDataAccess(this.modelAPI, 'INetwork Create')
    let k = genKey()
    if (data.securityData) {
      const securityDataDefaults = {
        authorized: false,
        message: 'Pending Authorization',
        enabled: true
      }
      data.securityData = R.merge(securityDataDefaults, data.securityData)
      data.securityData = encrypt(data.securityData, k)
    }
    data = formatInputData(data)
    let record = await prisma.createNetwork(data).$fragment(fragments.basic)
    if (record.securityData) {
      await this.modelAPI.protocolData.upsert(record, genNwkKey(record.id), k)
      record.securityData = decrypt(record.securityData, k)
      let { securityData } = await authorizeAndTest(record, this.modelAPI, k, this, dataAPI)
      securityData = encrypt(securityData, k)
      await prisma.updateNetwork({ data: { securityData }, where: { id: record.id } }).$fragment(fragments.basic)
    }
    return this.load(record.id)
  }

  async update ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing Network ID')
    let dataAPI = new NetworkProtocolDataAccess(this.modelAPI, 'INetwork Update')
    const old = await this.load(id)
    const k = await this.modelAPI.protocolData.loadValue(old, genNwkKey(id))
    const candidate = R.merge(old, data)
    let { securityData } = await authorizeAndTest(candidate, this.modelAPI, k, this, dataAPI)
    if (data.securityData) {
      data.securityData = encrypt(securityData, k)
    }
    data = formatInputData(data)
    await prisma.updateNetwork({ data, where: { id } }).$fragment(fragments.basic)
    return this.load(id)
  }

  async load (id) {
    const rec = await load({ id })
    if (rec.securityData) {
      let k = await this.modelAPI.protocolData.loadValue(rec, genNwkKey(id))
      rec.securityData = await decrypt(rec.securityData, k)
      let networkProtocol = await this.modelAPI.networkProtocols.load(rec.networkProtocol.id)
      rec.masterProtocol = networkProtocol.masterProtocol
    }
    return rec
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
      prisma.networks(query).$fragment(fragments.basic),
      prisma.networksConnection({ where }).aggregate().count()
    ])
    records = await Promise.all(records.map(async rec => {
      if (!rec.securityData) return rec
      let k = await this.modelAPI.protocolData.loadValue(rec, genNwkKey(rec.id))
      const securityData = await decrypt(rec.securityData, k)
      return { ...rec, securityData }
    }))
    return { totalCount, records }
  }

  async remove (id) {
    let dataAPI = new NetworkProtocolDataAccess(this.modelAPI, 'INetwork Delete')
    let old = await load({ id })
    await dataAPI.deleteProtocolDataForKey(id,
      old.networkProtocol.id,
      genNwkKey(id))
    return onFail(400, () => prisma.deleteNetwork({ id }))
  }

  async pullNetwork (id) {
    try {
      let network = await this.load(id)
      if (!network.securityData.authorized) {
        throw new Error('Network is not authorized.  Cannot pull')
      }
      let networkType = await this.modelAPI.networkTypes.load(network.networkType.id)
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
      let network = await this.load(id)
      let networkType = await this.modelAPI.networkTypes.list(network.networkType.id)
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
      let { records } = await this.list({ networkTypeId })
      let networkType = await this.modelAPI.networkTypes.load(networkTypeId)
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
async function load (uniqueKeyObj, fragementKey = 'basic') {
  const rec = await onFail(400, () => prisma.network(uniqueKeyObj).$fragment(fragments[fragementKey]))
  if (!rec) throw httpError(404, 'Network not found')
  return rec
}

const genNwkKey = function (networkId) {
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
