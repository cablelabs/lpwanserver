const R = require('ramda')
// const httpError = require('http-errors')
const { renameKeys } = require('../../lib/utils')
const { encrypt, decrypt } = require('../../lib/crypto')
const { listAll } = require('../model-lib')
const uuidv4 = require('uuid/v4')

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicNetwork on Network {
    id
    name
    enabled
    baseUrl
    meta
    networkSettings
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
const omitSecurityData = R.omit(['securityData'])
const mapSecurityData = (decryptSc, config) => rec => !rec.securityData || !decryptSc
  ? omitSecurityData(rec)
  : {
    ...rec,
    securityData: decrypt(rec.securityData, config.security_data_secret)
  }

// ******************************************************************************
// Model Functions
// ******************************************************************************
async function create (ctx, { data }) {
  const { security_data_secret: sdSecret } = ctx.config
  data = {
    enabled: true,
    networkSettings: {},
    ...data,
    securityData: encrypt(
      R.merge({ uplinkApiKey: uuidv4() }, data.securityData),
      sdSecret
    ),
    meta: { authorized: false, message: 'Not Authorized' }
  }
  let network = await ctx.db.create({ data })
  network.securityData = decrypt(network.securityData, sdSecret)
  network = await ctx.$self.authorizeAndTest({ network })
  await ctx.$self.pullNetwork({ id: network.id }).catch(() => {})
  await ctx.$m.networkType
    .forAllNetworks({
      networkTypeId: network.networkType.id,
      op: network => ctx.$self.pushNetwork({ id: network.id })
    })
    .catch(() => {})
  return omitSecurityData(network)
}

async function list (ctx, { where = {}, ...args }) {
  let [ records, totalCount ] = await ctx.db.list({ where: renameQueryKeys(where), ...args })
  records = records.map(mapSecurityData(args.decryptSecurityData, ctx.config))
  return [records, totalCount]
}

async function load (ctx, args) {
  const rec = await ctx.db.load(args)
  return mapSecurityData(args.decryptSecurityData, ctx.config)(rec)
}

async function update (ctx, { where, data, ...args }) {
  const { security_data_secret: sdSecret } = ctx.config
  let rec
  if (data.securityData) {
    rec = await ctx.$self.load({ where, decryptSecurityData: true })
    data.securityData = encrypt(
      R.merge(R.pick(['uplinkApiKey'], rec.securityData), data.securityData),
      sdSecret
    )
  }
  rec = await ctx.db.update({ where, data })
  if (!data.baseUrl && !data.securityData) {
    return mapSecurityData(args.decryptSecurityData, ctx.config)(rec)
  }
  rec = await ctx.$self.authorizeAndTest({
    network: mapSecurityData(true, ctx.config)(rec)
  })
  return args.decryptSecurityData ? rec : omitSecurityData(rec)
}

async function remove (ctx, { id }) {
  for await (let state of ctx.$m.networkDeployment.listAll({ where: { network: { id } } })) {
    await Promise.all(state.records.map(rec => ctx.$m.networkDeployment.remove(rec)))
  }
  await ctx.db.remove(id)
}

async function connect (ctx, { network }) {
  const { security_data_secret: sdSecret } = ctx.config
  if (network.meta.authorized) return network
  let authorized = false
  let message
  try {
    await ctx.$m.networkProtocol.connect({ network })
    authorized = true
    message = 'Authorized'
  }
  catch (err) {
    ctx.log.debug(`Connection of ${network.name} failed: ${err}`)
    if (err === 301 || err === 405 || err === 404) {
      message = 'Invalid URI to the ' + network.name + ' Network: "' + network.baseUrl + '"'
    }
    else if (err === 401) {
      message = 'Authentication not recognized for the ' + network.name + ' Network'
    }
    else {
      message = 'Server Error on ' + network.name + ' Network:'
    }
  }
  network = await ctx.db.update({
    where: { id: network.id },
    data: { meta: { ...network.meta, authorized, message } }
  })
  return { ...network, securityData: decrypt(network.securityData, sdSecret) }
}

async function authorizeAndTest (ctx, { network }) {
  const { security_data_secret: sdSecret } = ctx.config
  if (network.meta.authorized) return network
  network = await ctx.$self.connect({ network })
  try {
    if (network.meta.authorized) await ctx.$m.networkProtocol.test({ network })
    return network
  }
  catch (err) {
    ctx.log.debug(`Network Test Failure: ${err}`, { network: network.name, error: err })
    network = await ctx.db.update({
      where: { id: network.id },
      data: { meta: { ...network.meta, authorized: false, message: err.toString() } }
    })
    return { ...network, securityData: decrypt(network.securityData, sdSecret) }
  }
}

async function pullNetwork (ctx, { id }) {
  try {
    let network = await ctx.$self.load({ where: { id } })
    if (!network.meta.authorized) {
      throw new Error('Network is not authorized.  Cannot pull')
    }
    let result = await ctx.$m.networkProtocol.pullNetwork({ network })
    ctx.log.verbose('Success pulling from Network : ' + id)
    return result
  }
  catch (err) {
    ctx.log.error(`Failed to pull network: ${err}`)
    throw err
  }
}

async function pushNetwork (ctx, { id }) {
  try {
    let network = await ctx.$self.load({ where: { id } })
    let result = await ctx.$m.networkProtocol.pushNetwork({ network })
    ctx.log.info('Success pushing to Network : ' + id)
    return result
  }
  catch (err) {
    ctx.log.error(`Failed to push network: ${err}`)
    throw err
  }
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
    connect,
    authorizeAndTest,
    pullNetwork,
    pushNetwork
  },
  fragments
}
