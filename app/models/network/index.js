const R = require('ramda')
// const httpError = require('http-errors')
const { renameKeys } = require('../../lib/utils')
const { encrypt, decrypt, genKey } = require('../../lib/crypto')
const { listAll } = require('../model-lib')

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicNetwork on Network {
    id
    name
    enabled
    baseUrl
    securityData
    networkProtocol {
      id
    }
    networkType {
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
  let record = await ctx.db.create({ data })
  if (record.securityData) {
    await ctx.$m.protocolData.upsert([record, genNwkKey(record.id), k])
    record.securityData = decrypt(record.securityData, k)
    let { securityData } = await ctx.$self.authorizeAndTest(record)
    securityData = encrypt(securityData, k)
    await ctx.db.update({ where: { id: record.id }, data: { securityData } })
  }
  return ctx.$self.load({ where: { id: record.id } })
}

async function list (ctx, { where = {}, ...opts }) {
  let [ records, totalCount ] = await ctx.db.list({ where: renameQueryKeys(where), ...opts })
  records = await Promise.all(records.map(async rec => {
    if (!rec.securityData) return rec
    let k = await ctx.$m.protocolData.loadValue([rec, genNwkKey(rec.id)])
    const securityData = await decrypt(rec.securityData, k)
    return { ...rec, securityData }
  }))
  return [records, totalCount]
}

async function load (ctx, args) {
  const rec = await ctx.db.load(args)
  if (rec.securityData) {
    let k = await ctx.$m.protocolData.loadValue([rec, genNwkKey(rec.id)])
    rec.securityData = await decrypt(rec.securityData, k)
  }
  return rec
}

async function update (ctx, { where, data }) {
  const old = await ctx.db.load({ where })
  const k = await ctx.$m.protocolData.loadValue([old, genNwkKey(old.id)])
  const candidate = R.merge(old, data)
  let { securityData } = await ctx.$self.authorizeAndTest(candidate)
  if (data.securityData) {
    data.securityData = encrypt(securityData, k)
  }
  await ctx.db.update({ where, data })
  return ctx.$self.load({ where })
}

async function remove (ctx, id) {
  let old = await ctx.db.load({ where: { id } })
  await ctx.$m.protocolData.clearProtocolData({
    networkId: id,
    networkProtocolId: old.networkProtocol.id,
    keyStartsWith: genNwkKey(id)
  })
  await ctx.db.remove(id)
}

async function authorizeAndTest (ctx, network) {
  if (network.securityData.authorized) {
    return network
  }
  try {
    await ctx.$m.networkProtocols.connect({ network })
    network.securityData.authorized = true
    try {
      await ctx.$m.networkProtocols.test({ network })
      ctx.log.info('Network Test Success', { network: network.name })
      network.securityData.message = 'ok'
    }
    catch (err) {
      ctx.log.error(`Network Test Failure: ${err}`, { network: network.name, error: err })
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
    let result = await ctx.$m.networkProtocols.pullNetwork({ network })
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
    let result = await ctx.$m.networkProtcols.pushNetwork({ network })
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
    for await (let state of ctx.$self.listAll({ where: { networkTypeId } })) {
      let networks = state.records.filter(R.path(['securityData', 'authorized']))
      await Promise.all(networks.map(network => ctx.$m.networkProtcols.pushNetwork({ network })))
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
