const { normalizeDevEUI, validateSchema, getUpdates, renameKeys } = require('../../lib/utils')
const R = require('ramda')
const httpError = require('http-errors')
const { removeMany } = require('../model-lib')
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
const renameQueryKeys = renameKeys({ search: 'name_contains' })

const validateNwkSettings = validateSchema(
  'DeviceNetworkTypeLink.networkSettings failed validation',
  require('./nwk-settings-schema.json')
)

const parseNwkSettings = data => !data.networkSettings || typeof data.networkSettings !== 'string'
  ? data
  : { ...data, networkSettings: JSON.parse(data.networkSettings) }

const serializeNwkSettings = data => !data.networkSettings || typeof data.networkSettings === 'string'
  ? data
  : { ...data, networkSettings: JSON.stringify(data.networkSettings) }

// ******************************************************************************
// Model Functions
// ******************************************************************************
async function load (ctx, args) {
  return parseNwkSettings(await ctx.db.load(args))
}

async function list (ctx, { where = {}, ...opts } = {}) {
  const [recs, total] = await ctx.db.list({ where: renameQueryKeys(where), ...opts })
  return [recs.map(parseNwkSettings), total]
}

async function loadByQuery (ctx, args) {
  let [recs] = await ctx.db.list({ ...args, limit: 1 })
  if (!recs.length) throw new httpError.NotFound()
  return parseNwkSettings(recs[0])
}

async function create (ctx, { data, origin }) {
  data = R.evolve({
    networkSettings: R.compose(
      R.evolve({ devEUI: normalizeDevEUI }),
      prune,
      R.defaultTo({})
    )
  }, { enabled: true, ...data })
  validateNwkSettings(data.networkSettings)
  const rec = await ctx.db.create({ data: serializeNwkSettings(data) })
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
  return parseNwkSettings(rec)
}

async function update (ctx, { where, data, origin }) {
  // No changing the application or the network.
  if (data.applicationId || data.networkTypeId) {
    throw httpError(403, 'Cannot change link targets')
  }
  if (data.networkSettings) {
    data = R.evolve({
      networkSettings: R.compose(
        R.evolve({ devEUI: normalizeDevEUI }),
        prune
      )
    }, data)
    validateNwkSettings(data.networkSettings)
    data = serializeNwkSettings(data)
  }
  const rec = await ctx.db.update({ where, data })
  if (origin) {
    await ctx.$m.networkDeployment.updateByQuery({
      where: { network: { id: origin.network.id }, device: { id: rec.id } },
      data: { status: 'SYNCED' }
    })
  }
  await ctx.$self.push({
    deviceNetworkTypeLink: rec,
    omitNetworks: origin ? [origin.network.id] : []
  })
  return parseNwkSettings(rec)
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
      ctx.log.debug('DeviceNetworkTypeLink:remove:where', { where, rec, network })
      for await (let state of ctx.$m.networkDeployment.listAll({ where })) {
        ctx.log.debug('DeviceNetworkTypeLink:remove:state', { state })
        await Promise.all(state.records.map(rec => ctx.$m.networkDeployment.remove(rec)))
      }
    }
  })
  await ctx.db.remove(id)
}

async function pushDeviceNetworkTypeLink (ctx, { id, deviceNetworkTypeLink: rec, omitNetworks = [] }) {
  if (!rec) {
    rec = await ctx.db.load({ where: { id } })
  }
  await ctx.$m.networkType.forAllNetworks({
    networkTypeId: rec.networkType.id,
    op: async network => {
      if (omitNetworks.includes(network.id)) return
      return ctx.$m.networkProtocol.pushDevice({ network, deviceId: rec.id })
    }
  })
}

async function findByDevEUI (ctx, { devEUI, networkTypeId }) {
  let devNtl
  // Check cache for devNtl ID
  let devNtlId = await ctx.redis.keyval.getAsync(`ip-devNtl-${devEUI}`)
  if (devNtlId) {
    devNtl = await ctx.db.load({ where: { id: devNtlId } })
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
    push: pushDeviceNetworkTypeLink,
    findByDevEUI
  },
  fragments
}
