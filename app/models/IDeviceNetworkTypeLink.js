const { logger } = require('../log')
const { prisma } = require('../lib/prisma')
const { normalizeDevEUI } = require('../lib/utils')
const { redisClient } = require('../lib/redis')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const R = require('ramda')
const httpError = require('http-errors')
const { createModel, load, list, removeMany } = require('./Model')

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicDeviceNetworkTypeLink on DeviceNetworkTypeLink {
    id
    settings
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
// Model Context
// ******************************************************************************
const modelContext = {
  DB: new CacheFirstStrategy({
    name: 'deviceNetworkTypeLink',
    pluralName: 'deviceNetworkTypeLinks',
    fragments,
    defaultFragmentKey: 'basic',
    prisma,
    redis: redisClient,
    log: logger.info.bind(logger)
  })
}

// ******************************************************************************
// Model API
// ******************************************************************************
async function create (ctx, { data, remoteOrigin = false }) {
  try {
    if (data.settings && data.settings.devEUI) {
      data = R.assocPath(['settings', 'devEUI'], normalizeDevEUI(data.settings.devEUI), data)
    }
    const rec = await ctx.DB.create({ data })
    if (!remoteOrigin) {
      var logs = await ctx.$models.networkTypeAPI.addDevice(data)
      rec.remoteAccessLogs = logs
    }
    return rec
  }
  catch (err) {
    logger.error('Error creating deviceNetworkTypeLink: ', err)
    throw err
  }
}

async function update (ctx, { where, data }) {
  try {
    // No changing the application or the network.
    if (data.applicationId || data.networkTypeId) {
      throw httpError(403, 'Cannot change link targets')
    }
    if (data.settings && data.settings.devEUI) {
      data.settings.devEUI = normalizeDevEUI(data.settings.devEUI)
    }
    const rec = await ctx.DB.update({ where, data })
    const device = await ctx.$models.devices.load({ where: rec.device })
    var logs = await ctx.$models.networkTypeAPI.pushDevice(rec.networkType.id, device)
    rec.remoteAccessLogs = logs
    return rec
  }
  catch (err) {
    logger.error('Error updating deviceNetworkTypeLink: ', err)
    throw err
  }
}

async function remove (ctx, id) {
  try {
    const rec = await ctx.DB.load({ where: { id } })
    // Don't delete the local record until the remote operations complete.
    var logs = await ctx.$models.networkTypeAPI.deleteDevice({
      networkTypeId: rec.networkType.id,
      deviceId: rec.device.id
    })
    await ctx.DB.remove(id)
    return logs
  }
  catch (err) {
    logger.error('Error deleting deviceNetworkTypeLink: ', err)
    throw err
  }
}

async function pushDeviceNetworkTypeLink (ctx, id) {
  try {
    var rec = await ctx.DB.load({ where: { id } })
    var logs = await ctx.$models.networkTypeAPI.pushDevice({
      networkTypeId: rec.networkType.id,
      deviceId: rec.device.id,
      settings: rec.settings
    })
    rec.remoteAccessLogs = logs
    return rec
  }
  catch (err) {
    logger.error('Error updating deviceNetworkTypeLink: ', err)
    throw err
  }
}

async function findByDevEUI (ctx, { devEUI, networkTypeId }) {
  let devNtl
  // Check cache for devNtl ID
  let devNtlId = await redisClient.getAsync(`ip-devNtl-${devEUI}`)
  if (devNtlId) {
    devNtl = await ctx.DB.load({ id: devNtlId })
    if (!devNtl) await redisClient.delAsync(`ip-devNtl-${devEUI}`)
  }
  else {
    const devNTLQuery = { networkType: { id: networkTypeId }, settings_contains: devEUI }
    let [ devNtls ] = await ctx.DB.list(devNTLQuery)
    devNtl = devNtls[0]
    if (devNtl) await redisClient.setAsync(`ip-devNtl-${devEUI}`, devNtl.id)
  }
  return devNtl
}

// ******************************************************************************
// Model
// ******************************************************************************
const model = createModel(
  modelContext,
  {
    create,
    list,
    load,
    update,
    remove,
    removeMany,
    pushDeviceNetworkTypeLink,
    findByDevEUI
  }
)

module.exports = {
  model,
  create,
  list,
  load,
  update,
  remove,
  pushDeviceNetworkTypeLink,
  findByDevEUI
}
