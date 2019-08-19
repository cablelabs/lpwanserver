const NetworkProtocolDataAccess = require('../networkProtocols/networkProtocolDataAccess')
const { logger } = require('../log')
const R = require('ramda')
const { prisma } = require('../lib/prisma')
// const httpError = require('http-errors')
const { renameKeys } = require('../lib/utils')
const { encrypt, decrypt, genKey } = require('../lib/crypto')
const { redisClient } = require('../lib/redis')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const { createModel, listAll } = require('./Model')

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicNetwork on Network {
    id
    name
    enabled
    settings
    securityData
    networkProtocol {
      id
    }
  }`
}

// ******************************************************************************
// Model Context
// ******************************************************************************
const modelContext = {
  DB: new CacheFirstStrategy({
    name: 'network',
    pluralName: 'networks',
    fragments,
    defaultFragmentKey: 'basic',
    prisma,
    redis: redisClient,
    log: logger.info.bind(logger)
  })
}

// ******************************************************************************
// Helpers
// ******************************************************************************
const genNwkKey = function (networkId) {
  return 'nk' + networkId
}

const renameQueryKeys = renameKeys({ search: 'name_contains' })

// ******************************************************************************
// Model API
// ******************************************************************************
async function load (ctx, args) {
  const rec = await ctx.DB.load(args)
  if (rec.securityData) {
    let k = await ctx.$models.protocolData.loadValue(rec, genNwkKey(rec.id))
    rec.securityData = await decrypt(rec.securityData, k)
    let networkProtocol = await ctx.$models.networkProtocols.load({ where: rec.networkProtocol })
    rec.masterProtocol = networkProtocol.masterProtocol
  }
  return rec
}

async function list (ctx, { where = {}, ...opts }) {
  let [ records, totalCount ] = await ctx.DB.list({ where: renameQueryKeys(where), ...opts })
  records = await Promise.all(records.map(async rec => {
    if (!rec.securityData) return rec
    let k = await ctx.$models.protocolData.loadValue(rec, genNwkKey(rec.id))
    const securityData = await decrypt(rec.securityData, k)
    return { ...rec, securityData }
  }))
  return [records, totalCount]
}

async function create (ctx, { data }) {
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
  let record = await ctx.DB.create({ data })
  if (record.securityData) {
    await ctx.$models.protocolData.upsert(record, genNwkKey(record.id), k)
    record.securityData = decrypt(record.securityData, k)
    let { securityData } = await this.authorizeAndTest(ctx, record)
    securityData = encrypt(securityData, k)
    await ctx.DB.update({ id: record.id }, { securityData })
  }
  return this.load(ctx, { where: { id: record.id } })
}

async function update (ctx, { where, data }) {
  const old = await ctx.DB.load({ where })
  const k = await ctx.$models.protocolData.loadValue({
    network: old,
    dataIdentifier: genNwkKey(old.id)
  })
  const candidate = R.merge(old, data)
  let { securityData } = await this.authorizeAndTest(ctx, candidate)
  if (data.securityData) {
    data.securityData = encrypt(securityData, k)
  }
  await ctx.DB.update({ where, data })
  return this.load(ctx, { where })
}

async function remove (ctx, id) {
  let old = await ctx.DB.load({ where: { id } })
  await ctx.$models.protocolData.clearProtocolData({
    networkId: id,
    networkProtocolIda: old.networkProtocol.id,
    keyStartsWith: genNwkKey(id)
  })
  await ctx.DB.remove(id)
}

async function authorizeAndTest (ctx, network) {
  if (network.securityData.authorized) {
    return network
  }
  try {
    await ctx.$models.networkProtocolAPI.connect(network)
    network.securityData.authorized = true
    try {
      await ctx.$models.networkProtocolAPI.test(network)
      logger.info('Test Success ' + network.name, 'info')
      network.securityData.message = 'ok'
    }
    catch (err) {
      logger.error('Test of ' + network.name + ':', err)
      network.securityData.authorized = false
      network.securityData.message = err.toString()
    }
    return network
  }
  catch (err) {
    if (err.code === 42) return network
    logger.error('Connection of ' + network.name + ' Failed:', err)
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

async function pullNetwork (ctx, id) {
  try {
    let network = await this.load(ctx, { where: { id } })
    if (!network.securityData.authorized) {
      throw new Error('Network is not authorized.  Cannot pull')
    }
    let networkType = await ctx.$models.networkTypes.load({ id: network.networkType.id })
    var npda = new NetworkProtocolDataAccess(ctx.$models, 'Pull Network')
    npda.initLog(networkType, network)
    let result = await ctx.$models.networkProtocolAPI.pullNetwork({ npda, network })
    logger.info('Success pulling from Network : ' + id)
    return result
  }
  catch (err) {
    logger.error('Error pulling from Network : ' + id + ':', err)
    throw err
  }
}

async function pushNetwork (ctx, id) {
  try {
    let network = await this.load(ctx, { where: { id } })
    let networkType = await ctx.$models.networkTypes.load({ id: network.networkType.id })
    var npda = new NetworkProtocolDataAccess(this.$models, 'Push Network')
    npda.initLog(networkType, network)
    let result = await ctx.$models.networkProtocolAPI.pushNetwork({ npda, network })
    logger.info('Success pushing to Network : ' + id)
    return result
  }
  catch (err) {
    logger.error('Error pushing to Network : ' + id + ':', err)
    throw err
  }
}

async function pushNetworks (ctx, networkTypeId) {
  try {
    let networkType = await ctx.$models.networkTypes.load({ id: networkTypeId })
    var npda = new NetworkProtocolDataAccess(ctx.$models, 'Push Network')
    for await (let state of this.listAll(ctx, { where: { networkTypeId } })) {
      npda.initLog(networkType, state.records)
      let records = state.records.filter(R.path(['securityData', 'authorized']))
      await Promise.all(records.map(rec => ctx.$models.networkProtocolAPI.pushNetwork({ npda, rec })))
    }
    logger.info('Success pushing to Networks')
  }
  catch (err) {
    logger.error('Error pushing to Networks : ' + ':', err)
    throw err
  }
}

// ******************************************************************************
// Model
// ******************************************************************************
const model = createModel(
  modelContext,
  {
    create,
    list,
    listAll,
    load,
    update,
    remove,
    authorizeAndTest,
    pullNetwork,
    pushNetwork,
    pushNetworks
  }
)

module.exports = {
  model,
  create,
  list,
  load,
  update,
  remove,
  authorizeAndTest,
  pullNetwork,
  pushNetwork,
  pushNetworks
}
