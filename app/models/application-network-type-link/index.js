var httpError = require('http-errors')
const { list, listAll, load, removeMany } = require('../model-lib')
const R = require('ramda')

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicApplicationNetworkTypeLink on ApplicationNetworkTypeLink {
    id
    networkSettings
    enabled
    application {
      id
    }
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
    const rec = await ctx.db.create({ data: { enabled: true, ...data } })
    if (!remoteOrigin) {
      rec.remoteAccessLogs = ctx.$.m.networkTypes.forAllNetworks({
        networkTypeId: rec.networkType.id,
        op: network => ctx.$m.networkProtocol.addApplication({
          network,
          applicationId: rec.application.id,
          networkSettings: data.networkSettings
        })
      })
    }
    return rec
  }
  catch (err) {
    ctx.log.error('Error creating applicationNetworkTypeLink:', err)
    throw err
  }
}

async function update (ctx, { where, data, remoteOrigin = false }) {
  try {
    // No changing the application or the network.
    if (data.applicationId || data.networkTypeId) {
      throw httpError(403, 'Cannot change link targets')
    }
    const rec = await ctx.db.update({ where, data })
    if (!remoteOrigin) {
      const application = await ctx.$m.application.load({ where: rec.application })
      rec.remoteAccessLogs = ctx.$.m.networkTypes.forAllNetworks({
        networkTypeId: rec.networkType.id,
        op: network => ctx.$m.networkProtocol.pushApplication({ network, application })
      })
    }
    return rec
  }
  catch (err) {
    ctx.log.error('Error updating applicationNetworkTypeLink:', err)
    throw err
  }
}

async function remove (ctx, id) {
  try {
    var rec = await ctx.db.load({ where: { id } })

    // Delete deviceNetworkTypeLinks
    for await (let devState of ctx.$m.device.listAll({ where: { application: rec.application } })) {
      let ids = devState.records.map(R.prop('id'))
      for await (let state of ctx.$m.deviceNetworkTypeLink.removeMany({ where: { device: { id_in: ids } } })) {
      }
    }

    const logs = ctx.$.m.networkTypes.forAllNetworks({
      networkTypeId: rec.networkType.id,
      op: network => ctx.$m.networkProtocol.deleteApplication({ network, applicationId: rec.application.id })
    })

    await ctx.db.remove(id)
    return logs
  }
  catch (err) {
    ctx.log.error('Error deleting applicationNetworkTypeLink:', err)
    throw err
  }
}

async function pushApplicationNetworkTypeLink (ctx, id) {
  try {
    var rec = await ctx.db.load({ where: { id } })

    // Push deviceNetworkTypeLinks
    for await (let devState of ctx.$m.device.listAll({ where: { application: { id } } })) {
      let ids = devState.records.map(R.prop('id'))
      for await (let devNtlState of ctx.$m.deviceNetworkTypeLink.listAll({ where: { device: { id_in: ids } } })) {
        let ids = devNtlState.map(R.prop('id'))
        await Promise.all(ids.map(ctx.$m.deviceNetworkTypeLink.pushDeviceNetworkTypeLink))
      }
    }

    rec.remoteAccessLogs = ctx.$.m.networkTypes.forAllNetworks({
      networkTypeId: rec.networkType.id,
      op: network => ctx.$m.networkProtocol.pushApplication({
        network,
        applicationId: rec.application.id,
        networkSettings: rec.networkSettings
      })
    })

    return rec
  }
  catch (err) {
    ctx.log.error('Error updating applicationNetworkTypeLink:', err)
    throw err
  }
}

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = {
  role: 'applicationNetworkTypeLink',
  publicApi: {
    create,
    list,
    listAll,
    load,
    update,
    remove,
    removeMany,
    pushApplicationNetworkTypeLink
  },
  fragments
}
