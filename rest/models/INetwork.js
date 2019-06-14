const NetworkProtocolDataAccess = require('../networkProtocols/networkProtocolDataAccess')
const appLogger = require('../lib/appLogger')
const R = require('ramda')
const { prisma } = require('../lib/prisma')
const httpError = require('http-errors')
const { renameKeys } = require('../lib/utils')
const { encrypt, decrypt, genKey } = require('../lib/crypto')
const { redisClient } = require('../lib/redis')
const CacheFirstStrategy = require('../../lib/prisma-cache/src/cache-first-strategy')

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
// Database Client
// ******************************************************************************
const DB = new CacheFirstStrategy({
  name: 'network',
  pluralName: 'networks',
  fragments,
  defaultFragmentKey: 'basic',
  prisma,
  redis: redisClient,
  log: appLogger.log.bind(appLogger)
})

// ******************************************************************************
// Helpers
// ******************************************************************************
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

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = class Network {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
  }

  async load (id) {
    const rec = await DB.load({ id })
    if (rec.securityData) {
      let k = await this.modelAPI.protocolData.loadValue(rec, genNwkKey(id))
      rec.securityData = await decrypt(rec.securityData, k)
      let networkProtocol = await this.modelAPI.networkProtocols.load(rec.networkProtocol.id)
      rec.masterProtocol = networkProtocol.masterProtocol
    }
    return rec
  }

  async list (query = {}, opts) {
    if (query.search) {
      query = renameKeys({ search: 'name_contains' }, query)
    }
    let [ records, totalCount ] = await DB.list(query, opts)
    records = await Promise.all(records.map(async rec => {
      if (!rec.securityData) return rec
      let k = await this.modelAPI.protocolData.loadValue(rec, genNwkKey(rec.id))
      const securityData = await decrypt(rec.securityData, k)
      return { ...rec, securityData }
    }))
    return [records, totalCount]
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
    let record = await DB.create(data)
    if (record.securityData) {
      await this.modelAPI.protocolData.upsert(record, genNwkKey(record.id), k)
      record.securityData = decrypt(record.securityData, k)
      let { securityData } = await authorizeAndTest(record, this.modelAPI, k, this, dataAPI)
      securityData = encrypt(securityData, k)
      await DB.update({ id: record.id }, { securityData })
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
    await DB.update({ id }, data)
    return this.load(id)
  }

  async remove (id) {
    let dataAPI = new NetworkProtocolDataAccess(this.modelAPI, 'INetwork Delete')
    let old = await DB.load({ id })
    await dataAPI.deleteProtocolDataForKey(id,
      old.networkProtocol.id,
      genNwkKey(id))
    await DB.remove({ id })
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
      let networkType = await this.modelAPI.networkTypes.load(network.networkType.id)
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
      let [ records ] = await this.list({ networkTypeId })
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
