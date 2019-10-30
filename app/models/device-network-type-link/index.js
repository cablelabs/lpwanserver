const { normalizeDevEUI, validateSchema, getUpdates } = require('../../lib/utils')
const R = require('ramda')
const httpError = require('http-errors')
const { load, list, removeMany, loadByQuery } = require('../model-lib')
const { prune } = require('dead-leaves')

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicDeviceNetworkTypeLink on DeviceNetworkTypeLink {
    id
    networkSettings
    enabled
    device {
      id
    }
    networkType {
      id
    }
    deviceProfile {
      id
    }
  }`
}

// ******************************************************************************
// Helpers
// ******************************************************************************
const validateNwkSettings = validateSchema(
  'DeviceNetworkTypeLink.networkSettings failed validation',
  require('./nwk-settings-schema.json')
)
const devEUILens = R.lensPath(['networkSettings', 'devEUI'])

// ******************************************************************************
// Model Functions
// ******************************************************************************
async function create (ctx, { data, origin }) {
  data = R.evolve({
    networkSettings: R.compose(
      R.evolve({ devEUI: normalizeDevEUI }),
      prune,
      R.defaultTo({})
    )
  }, { enabled: true, ...data })
  validateNwkSettings(data.networkSettings)
  const rec = await ctx.db.create({ data })
  await ctx.$m.networkType.forAllNetworks({
    networkTypeId: rec.networkType.id,
    op: network => {
      const isOrigin = origin && origin.network.id === network.id
      const meta = { isOrigin }
      if (isOrigin) meta.remoteId = origin.remoteId
      return ctx.$m.networkDeployment.create({
        data: {
          status: 'CREATED',
          type: 'DEVICE',
          meta,
          network: { id: network.id },
          device: rec.device
        }
      })
    }
  })
  return rec
}

async function update (ctx, { where, data, origin }) {
  // No changing the application or the network.
  if (data.applicationId || data.networkTypeId) {
    throw httpError(403, 'Cannot change link targets')
  }
  if (data.networkSettings) {
    data = {
      ...R.set(devEUILens, normalizeDevEUI(R.view(devEUILens, data)), data),
      networkSettings: prune(data.networkSettings)
    }
    validateNwkSettings(data.networkSettings)
  }
  const rec = await ctx.db.update({ where, data })
  await ctx.$m.networkType.forAllNetworks({
    networkTypeId: rec.networkType.id,
    op: async network => ctx.$m.networkDeployment.updateByQuery({
      where: { network: { id: network.id }, device: rec.device },
      data: {
        status: origin && origin.network.id === network.id ? 'SYNCED' : 'UPDATED'
      }
    })
  })
  return rec
}

async function upsert (ctx, { data, ...args }) {
  try {
    let rec = await ctx.$self.loadByQuery({ where: R.pick(['networkType', 'device'], data) })
    data = getUpdates(rec, data)
    return R.empty(data) ? rec : ctx.$self.update({ ...args, where: { id: rec.id }, data })
  }
  catch (err) {
    if (err.statusCode === 404) return ctx.$self.create({ ...args, data })
    throw err
  }
}

async function remove (ctx, { id }) {
  const rec = await ctx.db.load({ where: { id } })
  await ctx.$m.networkType.forAllNetworks({
    networkTypeId: rec.networkType.id,
    op: async network => {
      let where = { network: { id: network.id }, device: rec.device }
      for await (let state of ctx.$m.networkDeployment.listAll({ where })) {
        await Promise.all(state.records.map(rec => ctx.$m.networkDeployment.remove(rec)))
      }
    }
  })
  await ctx.db.remove(id)
}

async function pushDeviceNetworkTypeLink (ctx, id) {
  var rec = await ctx.db.load({ where: { id } })
  rec.remoteAccessLogs = await ctx.$m.networkType.forAllNetworks({
    networkTypeId: rec.networkType.id,
    op: network => ctx.$m.networkProtocol.pushDevice({
      network,
      deviceId: rec.device.id,
      networkSettings: rec.networkSettings
    })
  })
  return rec
}

async function findByDevEUI (ctx, { devEUI, networkTypeId }) {
  let devNtl
  // Check cache for devNtl ID
  let devNtlId = await ctx.redis.keyval.getAsync(`ip-devNtl-${devEUI}`)
  if (devNtlId) {
    devNtl = await ctx.db.load({ id: devNtlId })
    if (!devNtl) await ctx.redis.keyval.delAsync(`ip-devNtl-${devEUI}`)
  }
  else {
    const devNTLQuery = { networkType: { id: networkTypeId }, networkSettings_contains: devEUI }
    let [ devNtls ] = await ctx.db.list({ where: devNTLQuery })
    devNtl = devNtls[0]
    if (devNtl) await ctx.redis.keyval.setAsync(`ip-devNtl-${devEUI}`, devNtl.id)
  }
  return devNtl
}

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = {
  role: 'deviceNetworkTypeLink',
  publicApi: {
    create,
    list,
    load,
    loadByQuery,
    update,
    upsert,
    remove,
    removeMany,
    pushDeviceNetworkTypeLink,
    findByDevEUI
  },
  fragments
}
