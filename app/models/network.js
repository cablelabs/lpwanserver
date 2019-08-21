const NetworkProtocolDataAccess = require('../networkProtocols/networkProtocolDataAccess')
const R = require('ramda')
// const httpError = require('http-errors')
const { renameKeys } = require('../lib/utils')
const { encrypt, decrypt, genKey } = require('../lib/crypto')
const { listAll } = require('./Model')

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
// Helpers
// ******************************************************************************
const genNwkKey = function (networkId) {
  return 'nk' + networkId
}

const renameQueryKeys = renameKeys({ search: 'name_contains' })

// ******************************************************************************
// Model Functions
// ******************************************************************************
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
    await ctx.$m.protocolData.upsert(record, genNwkKey(record.id), k)
    record.securityData = decrypt(record.securityData, k)
    let { securityData } = await ctx.$self.authorizeAndTest(record)
    securityData = encrypt(securityData, k)
    await ctx.DB.update({ where: { id: record.id }, data: { securityData } })
  }
  return ctx.$self.load({ where: { id: record.id } })
}

async function list (ctx, { where = {}, ...opts }) {
  let [ records, totalCount ] = await ctx.DB.list({ where: renameQueryKeys(where), ...opts })
  records = await Promise.all(records.map(async rec => {
    if (!rec.securityData) return rec
    let k = await ctx.$m.protocolData.loadValue(rec, genNwkKey(rec.id))
    const securityData = await decrypt(rec.securityData, k)
    return { ...rec, securityData }
  }))
  return [records, totalCount]
}

async function load (ctx, args) {
  const rec = await ctx.DB.load(args)
  if (rec.securityData) {
    let k = await ctx.$m.protocolData.loadValue(rec, genNwkKey(rec.id))
    rec.securityData = await decrypt(rec.securityData, k)
  }
  return rec
}

async function update (ctx, { where, data }) {
  const old = await ctx.DB.load({ where })
  const k = await ctx.$m.protocolData.loadValue({
    network: old,
    dataIdentifier: genNwkKey(old.id)
  })
  const candidate = R.merge(old, data)
  let { securityData } = await ctx.$self.authorizeAndTest(candidate)
  if (data.securityData) {
    data.securityData = encrypt(securityData, k)
  }
  await ctx.DB.update({ where, data })
  return ctx.$self.load({ where })
}

async function remove (ctx, id) {
  let old = await ctx.DB.load({ where: { id } })
  await ctx.$m.protocolData.clearProtocolData({
    networkId: id,
    networkProtocolId: old.networkProtocol.id,
    keyStartsWith: genNwkKey(id)
  })
  await ctx.DB.remove(id)
}

async function authorizeAndTest (ctx, network) {
  if (network.securityData.authorized) {
    return network
  }
  try {
    await ctx.$m.networkProtocolAPI.connect(network)
    network.securityData.authorized = true
    try {
      await ctx.$m.networkProtocolAPI.test(network)
      ctx.log.info('Test Success ' + network.name, 'info')
      network.securityData.message = 'ok'
    }
    catch (err) {
      ctx.log.error('Test of ' + network.name + ':', err)
      network.securityData.authorized = false
      network.securityData.message = err.toString()
    }
    return network
  }
  catch (err) {
    if (err.code === 42) return network
    ctx.log.error('Connection of ' + network.name + ' Failed:', err)
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
    let network = await ctx.$self.load({ where: { id } })
    if (!network.securityData.authorized) {
      throw new Error('Network is not authorized.  Cannot pull')
    }
    let networkType = await ctx.$m.networkTypes.load({ id: network.networkType.id })
    var npda = new NetworkProtocolDataAccess(ctx.$m, 'Pull Network')
    npda.initLog(networkType, network)
    let result = await ctx.$m.networkProtocolAPI.pullNetwork({ npda, network })
    ctx.log.info('Success pulling from Network : ' + id)
    return result
  }
  catch (err) {
    ctx.log.error('Error pulling from Network : ' + id + ':', err)
    throw err
  }
}

async function pushNetwork (ctx, id) {
  try {
    let network = await ctx.$self.load({ where: { id } })
    let networkType = await ctx.$m.networkTypes.load({ id: network.networkType.id })
    var npda = new NetworkProtocolDataAccess(this.$m, 'Push Network')
    npda.initLog(networkType, network)
    let result = await ctx.$m.networkProtocolAPI.pushNetwork({ npda, network })
    ctx.log.info('Success pushing to Network : ' + id)
    return result
  }
  catch (err) {
    ctx.log.error('Error pushing to Network : ' + id + ':', err)
    throw err
  }
}

async function pushNetworks (ctx, networkTypeId) {
  try {
    let networkType = await ctx.$m.networkTypes.load({ id: networkTypeId })
    var npda = new NetworkProtocolDataAccess(ctx.$m, 'Push Network')
    for await (let state of ctx.$self.listAll({ where: { networkTypeId } })) {
      npda.initLog(networkType, state.records)
      let records = state.records.filter(R.path(['securityData', 'authorized']))
      await Promise.all(records.map(rec => ctx.$m.networkProtocolAPI.pushNetwork({ npda, rec })))
    }
    ctx.log.info('Success pushing to Networks')
  }
  catch (err) {
    ctx.log.error('Error pushing to Networks : ' + ':', err)
    throw err
  }
}

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = {
  api: {
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
  },
  fragments
}
