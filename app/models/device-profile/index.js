// var httpError = require('http-errors')
const { load, list } = require('../model-lib')

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicDeviceProfile on DeviceProfile {
    id
    name
    description
    networkSettings
    networkType {
      id
    }
  }`
}

// ******************************************************************************
// Model Functions
// ******************************************************************************
async function create (ctx, { data, remoteOrigin = false }) {
  try {
    const rec = await ctx.db.create({ data })
    if (!remoteOrigin) {
      rec.remoteAccessLogs = await ctx.$m.networkTypes.forAllNetworks({
        networkTypeId: data.networkTypeId,
        op: network => ctx.$m.networkProtocols.addDeviceProfile({ network, deviceProfileId: rec.id })
      })
    }
    return rec
  }
  catch (err) {
    ctx.log.error('Failed to create deviceProfile:', err)
    throw err
  }
}

async function update (ctx, args) {
  try {
    const rec = await ctx.db.update(args)
    rec.remoteAccessLogs = await ctx.$m.networkTypes.forAllNetworks({
      networkTypeId: rec.networkType.id,
      op: network => ctx.$m.networkProtocols.pushDeviceProfile({ network, deviceProfileId: rec.id })
    })
    return rec
  }
  catch (err) {
    ctx.log.error('Error updating deviceProfile:', err)
    throw err
  }
}

async function remove (ctx, id) {
  try {
    var rec = await ctx.db.load({ where: { id } })
    // Don't delete the local record until the remote operations complete.
    const logs = await ctx.$m.networkTypes.forAllNetworks({
      networkTypeId: rec.networkType.id,
      op: network => ctx.$m.networkProtocols.deleteDeviceProfile({ network, deviceProfileId: id })
    })
    await ctx.db.remove(id)
    return logs
  }
  catch (err) {
    ctx.log.error('Error deleting deviceProfile: ', err)
    throw err
  }
}

async function pushDeviceProfile (ctx, id) {
  try {
    var rec = await ctx.db.load({ where: { id } })
    const logs = await ctx.$m.networkTypes.forAllNetworks({
      networkTypeId: rec.networkType.id,
      op: network => ctx.$m.networkProtocols.pushDeviceProfile({ network, deviceProfileId: id })
    })
    return logs
  }
  catch (err) {
    ctx.log.error('Error pushing deviceProfile:', err)
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
    load,
    update,
    remove,
    pushDeviceProfile
  },
  fragments
}
