const R = require('ramda')
// const httpError = require('http-errors')
const { renameKeys } = require('../../lib/utils')
const { encrypt, decrypt } = require('../../lib/crypto')
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
const renameQueryKeys = renameKeys({ search: 'name_contains' })

// ******************************************************************************
// Model Functions
// ******************************************************************************
async function create (ctx, { data }) {
  const { security_data_secret: sdSecret } = ctx.config
  data = { enabled: true, ...data }
  if (data.securityData) {
    const securityDataDefaults = {
      authorized: false,
      message: 'Pending Authorization'
    }
    data.securityData = R.merge(securityDataDefaults, data.securityData)
    data.securityData = encrypt(data.securityData, sdSecret)
  }
  let record = await ctx.db.create({ data })
  if (record.securityData) {
    record.securityData = decrypt(record.securityData, sdSecret)
    let { securityData } = await ctx.$self.authorizeAndTest(record)
    securityData = encrypt(securityData, sdSecret)
    await ctx.db.update({ where: { id: record.id }, data: { securityData } })
    await ctx.$self.pullNetwork({ id: record.id })
  }
  await ctx.$m.networkType.forAllNetworks({
    networkTypeId: record.networkType.id,
    op: network => ctx.$self.pushNetwork({ id: network.id })
  })
  return ctx.$self.load({ where: { id: record.id } })
}

async function list (ctx, { where = {}, ...opts }) {
  const { security_data_secret: sdSecret } = ctx.config
  let [ records, totalCount ] = await ctx.db.list({ where: renameQueryKeys(where), ...opts })
  records = await Promise.all(records.map(async rec => {
    if (!rec.securityData) return rec
    const securityData = await decrypt(rec.securityData, sdSecret)
    return { ...rec, securityData }
  }))
  return [records, totalCount]
}

async function load (ctx, args) {
  const { security_data_secret: sdSecret } = ctx.config
  const rec = await ctx.db.load(args)
  if (rec.securityData) {
    rec.securityData = await decrypt(rec.securityData, sdSecret)
  }
  return rec
}

async function update (ctx, { where, data }) {
  const { security_data_secret: sdSecret } = ctx.config
  const old = await ctx.db.load({ where })
  const candidate = R.merge(old, data)
  let { securityData } = await ctx.$self.authorizeAndTest(candidate)
  if (data.securityData) {
    data.securityData = encrypt(securityData, sdSecret)
  }
  await ctx.db.update({ where, data })
  return ctx.$self.load({ where })
}

async function remove (ctx, id) {
  await ctx.db.remove(id)
}

async function authorizeAndTest (ctx, network) {
  if (network.securityData.authorized) {
    return network
  }
  try {
    await ctx.$m.networkProtocol.connect({ network })
    network.securityData.authorized = true
    try {
      await ctx.$m.networkProtocol.test({ network })
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

async function pullNetwork (ctx, { id }) {
  let network = await ctx.$self.load({ where: { id } })
  if (!network.securityData.authorized) {
    throw new Error('Network is not authorized.  Cannot pull')
  }
  let result = await ctx.$m.networkProtocol.pullNetwork({ network })
  ctx.log.info('Success pulling from Network : ' + id)
  return result
}

async function pushNetwork (ctx, { id }) {
  let network = await ctx.$self.load({ where: { id } })
  let result = await ctx.$m.networkProtcols.pushNetwork({ network })
  ctx.log.info('Success pushing to Network : ' + id)
  return result
}

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = {
  role: 'network',
  publicApi: {
    create,
    list,
    listAll,
    load,
    update,
    remove,
    authorizeAndTest,
    pullNetwork,
    pushNetwork
  },
  fragments
}
