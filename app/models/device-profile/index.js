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
    settings
    networkType {
      id
    }
  }`
}

// ******************************************************************************
// Model Functions
// ******************************************************************************
async function create (ctx, { data, remoteOrigin = false } = {}) {
  try {
    const rec = await ctx.DB.create(data)
    if (!remoteOrigin) {
      var logs = await ctx.$m.networkTypeAPI.addDeviceProfile({
        networkTypeId: data.networkTypeId,
        deviceProfileId: rec.id
      })
      rec.remoteAccessLogs = logs
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
    const rec = await ctx.DB.update(args)
    var logs = await ctx.$m.networkTypeAPI.pushDeviceProfile(rec.networkType.id, rec.id)
    rec.remoteAccessLogs = logs
    return rec
  }
  catch (err) {
    ctx.log.error('Error updating deviceProfile:', err)
    throw err
  }
}

async function remove (ctx, id) {
  try {
    var rec = await ctx.DB.load({ where: { id } })
    // Don't delete the local record until the remote operations complete.
    var logs = await ctx.$m.networkTypeAPI.deleteDeviceProfile(rec.networkType.id, id)
    await ctx.DB.remove(id)
    return logs
  }
  catch (err) {
    ctx.log.error('Error deleting deviceProfile: ', err)
    throw err
  }
}

async function pushDeviceProfile (ctx, id) {
  try {
    var rec = await ctx.DB.load({ where: { id } })
    var logs = await ctx.$m.networkTypeAPI.pushDeviceProfile({
      networkTypeId: rec.networkType.id,
      deviceProfileId: id
    })
    rec.remoteAccessLogs = logs
    return rec
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
