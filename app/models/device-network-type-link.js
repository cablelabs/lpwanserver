const { normalizeDevEUI } = require('../lib/utils')
const R = require('ramda')
const httpError = require('http-errors')
const { load, list, removeMany } = require('./model-lib')

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
// Model Functions
// ******************************************************************************
async function create (ctx, { data, remoteOrigin = false }) {
  try {
    if (data.settings && data.settings.devEUI) {
      data = R.assocPath(['settings', 'devEUI'], normalizeDevEUI(data.settings.devEUI), data)
    }
    const rec = await ctx.DB.create({ data })
    if (!remoteOrigin) {
      var logs = await ctx.$m.networkTypeAPI.addDevice(data)
      rec.remoteAccessLogs = logs
    }
    return rec
  }
  catch (err) {
    ctx.log.error('Error creating deviceNetworkTypeLink: ', err)
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
    const device = await ctx.$m.devices.load({ where: rec.device })
    var logs = await ctx.$m.networkTypeAPI.pushDevice(rec.networkType.id, device)
    rec.remoteAccessLogs = logs
    return rec
  }
  catch (err) {
    ctx.log.error('Error updating deviceNetworkTypeLink: ', err)
    throw err
  }
}

async function remove (ctx, id) {
  try {
    const rec = await ctx.DB.load({ where: { id } })
    // Don't delete the local record until the remote operations complete.
    var logs = await ctx.$m.networkTypeAPI.deleteDevice({
      networkTypeId: rec.networkType.id,
      deviceId: rec.device.id
    })
    await ctx.DB.remove(id)
    return logs
  }
  catch (err) {
    ctx.log.error('Error deleting deviceNetworkTypeLink: ', err)
    throw err
  }
}

async function pushDeviceNetworkTypeLink (ctx, id) {
  try {
    var rec = await ctx.DB.load({ where: { id } })
    var logs = await ctx.$m.networkTypeAPI.pushDevice({
      networkTypeId: rec.networkType.id,
      deviceId: rec.device.id,
      settings: rec.settings
    })
    rec.remoteAccessLogs = logs
    return rec
  }
  catch (err) {
    ctx.log.error('Error updating deviceNetworkTypeLink: ', err)
    throw err
  }
}

async function findByDevEUI (ctx, { devEUI, networkTypeId }) {
  let devNtl
  // Check cache for devNtl ID
  let devNtlId = await ctx.redis.keyval.getAsync(`ip-devNtl-${devEUI}`)
  if (devNtlId) {
    devNtl = await ctx.DB.load({ id: devNtlId })
    if (!devNtl) await ctx.redis.keyval.delAsync(`ip-devNtl-${devEUI}`)
  }
  else {
    const devNTLQuery = { networkType: { id: networkTypeId }, settings_contains: devEUI }
    let [ devNtls ] = await ctx.DB.list(devNTLQuery)
    devNtl = devNtls[0]
    if (devNtl) await ctx.redis.keyval.setAsync(`ip-devNtl-${devEUI}`, devNtl.id)
  }
  return devNtl
}

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = {
  api: {
    create,
    list,
    load,
    update,
    remove,
    removeMany,
    pushDeviceNetworkTypeLink,
    findByDevEUI
  },
  fragments
}
