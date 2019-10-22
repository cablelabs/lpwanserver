// var httpError = require('http-errors')
const { load, list } = require('../model-lib')
const R = require('ramda')
const { getUpdates } = require('../../lib/utils')

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
async function create (ctx, { data, origin }) {
  try {
    const rec = await ctx.db.create({ data })
    await ctx.$m.networkType.forAllNetworks({
      networkTypeId: data.networkTypeId,
      op: network => {
        const isOrigin = origin && origin.network.id === network.id
        const meta = { isOrigin }
        if (isOrigin) meta.remoteId = origin.remoteId
        return ctx.$m.networkDeployment.create({
          data: {
            status: 'CREATED',
            type: 'DEVICE_PROFILE',
            meta,
            network: { id: network.id },
            deviceProfile: { id: rec.id }
          }
        })
      }
    })
    return rec
  }
  catch (err) {
    ctx.log.error('Failed to create deviceProfile:', err)
    throw err
  }
}

async function update (ctx, { where, data, origin }) {
  try {
    const rec = await ctx.db.update({ where, data })
    await ctx.$m.networkType.forAllNetworks({
      networkTypeId: rec.networkType.id,
      op: async network => ctx.$m.networkDeployment.updateByQuery({
        where: { network: { id: network.id }, deviceProfile: { id: rec.id } },
        data: {
          status: origin && origin.network.id === network.id ? 'SYNCED' : 'UPDATED'
        }
      })
    })
    return rec
  }
  catch (err) {
    ctx.log.error('Error updating deviceProfile:', err)
    throw err
  }
}

async function upsert (ctx, { data, ...args }) {
  let rec = await ctx.$self.load({ where: { name: data.name } })
  if (!rec) return ctx.$self.create({ ...args, data })
  data = getUpdates(rec, data)
  return R.empty(data) ? rec : ctx.$self.update({ ...args, where: { id: rec.id }, data })
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
          status: 'REMOVED'
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
    upsert,
    remove,
    pushDeviceProfile
  },
  fragments
}
