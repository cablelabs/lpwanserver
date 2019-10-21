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
    await ctx.$m.networkType.forAllNetworks({
      networkTypeId: data.networkTypeId,
      op: network => ctx.$m.networkDeployment.create({
        data: {
          status: remoteOrigin ? 'SYNCED' : 'CREATED',
          type: 'DEVICE_PROFILE',
          network: { id: network.id },
          deviceProfile: { id: rec.id }
        }
      })
    })
    return rec
  }
  catch (err) {
    ctx.log.error('Failed to create deviceProfile:', err)
    throw err
  }
}

async function update (ctx, { where, data, remoteOrigin = false }) {
  try {
    const rec = await ctx.db.update({ where, data })
    await ctx.$m.networkType.forAllNetworks({
      networkTypeId: rec.networkType.id,
      op: async network => ctx.$m.networkDeployment.updateByQuery({
        where: { network: { id: network.id }, deviceProfile: { id: rec.id } },
        data: {
          status: remoteOrigin ? 'SYNCED' : 'UPDATED',
          logs: []
        }
      })
      // op: network => ctx.$m.networkProtocol.pushDeviceProfile({ network, deviceProfileId: rec.id })
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
    await ctx.$m.networkType.forAllNetworks({
      networkTypeId: rec.networkType.id,
      op: async network => ctx.$m.networkDeployment.updateByQuery({
        where: { network: { id: network.id }, deviceProfile: { id: rec.id } },
        data: {
          status: 'REMOVED',
          logs: []
        }
      })
      // op: network => ctx.$m.networkProtocol.deleteDeviceProfile({ network, deviceProfileId: id })
    })
    await ctx.db.remove(id)
  }
  catch (err) {
    ctx.log.error('Error deleting deviceProfile: ', err)
    throw err
  }
}

async function pushDeviceProfile (ctx, id) {
  try {
    var rec = await ctx.db.load({ where: { id } })
    const logs = await ctx.$m.networkType.forAllNetworks({
      networkTypeId: rec.networkType.id,
      op: network => ctx.$m.networkProtocol.pushDeviceProfile({ network, deviceProfileId: id })
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
  role: 'deviceProfile',
  publicApi: {
    create,
    list,
    load,
    update,
    remove,
    pushDeviceProfile
  },
  fragments
}
