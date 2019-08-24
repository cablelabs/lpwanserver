const { normalizeDevEUI } = require('../../lib/utils')
const R = require('ramda')
const httpError = require('http-errors')
const { load, list, removeMany } = require('../model-lib')

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
// Model Functions
// ******************************************************************************
async function create (ctx, { data, remoteOrigin = false }) {
  try {
    if (data.networkSettings && data.networkSettings.devEUI) {
      data = R.assocPath(['networkSettings', 'devEUI'], normalizeDevEUI(data.networkSettings.devEUI), data)
    }
    const rec = await ctx.db.create({ data: { enabled: true, ...data } })
    if (!remoteOrigin) {
      rec.remoteAccessLogs = await ctx.$.m.networkTypes.forAllNetworks({
        networkTypeId: rec.networkType.id,
        op: network => ctx.$m.networkProtocols.addDevice({ network, deviceNetworkTypeLink: rec })
      })
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
    if (data.networkSettings && data.networkSettings.devEUI) {
      data.networkSettings.devEUI = normalizeDevEUI(data.networkSettings.devEUI)
    }
    const rec = await ctx.db.update({ where, data })
    const device = await ctx.$m.devices.load({ where: rec.device })
    rec.remoteAccessLogs = await ctx.$.m.networkTypes.forAllNetworks({
      networkTypeId: rec.networkType.id,
      op: network => ctx.$m.networkProtocols.pushDevice({ network, device })
    })
    return rec
  }
  catch (err) {
    ctx.log.error('Error updating deviceNetworkTypeLink: ', err)
    throw err
  }
}

async function remove (ctx, id) {
  try {
    const rec = await ctx.db.load({ where: { id } })
    // Don't delete the local record until the remote operations complete.
    const logs = await ctx.$.m.networkTypes.forAllNetworks({
      networkTypeId: rec.networkType.id,
      op: network => ctx.$m.networkProtocols.deleteDevice({ network, deviceId: rec.device.id })
    })
    await ctx.db.remove(id)
    return logs
  }
  catch (err) {
    ctx.log.error('Error deleting deviceNetworkTypeLink: ', err)
    throw err
  }
}

async function pushDeviceNetworkTypeLink (ctx, id) {
  try {
    var rec = await ctx.db.load({ where: { id } })
    rec.remoteAccessLogs = await ctx.$.m.networkTypes.forAllNetworks({
      networkTypeId: rec.networkType.id,
      op: network => ctx.$m.networkProtocols.pushDevice({
        network,
        deviceId: rec.device.id,
        networkSettings: rec.networkSettings
      })
    })
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
