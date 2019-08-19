const { logger } = require('../log')
var httpError = require('http-errors')
const { prisma } = require('../lib/prisma')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const { redisClient } = require('../lib/redis')
const { createModel, list, listAll, load, removeMany } = require('./Model')
const R = require('ramda')

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicApplicationNetworkTypeLink on ApplicationNetworkTypeLink {
    id
    settings
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
// Model Context
// ******************************************************************************
const modelContext = {
  DB: new CacheFirstStrategy({
    name: 'applicationNetworkTypeLink',
    pluralName: 'applicationNetworkTypeLinks',
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
    const rec = await ctx.DB.create({ data })
    if (!remoteOrigin) {
      const logs = await ctx.$models.networkTypeAPI.addApplication({
        networkTypeId: rec.networkType.id,
        applicationId: rec.application.id,
        settings: data.settings
      })
      rec.remoteAccessLogs = logs
    }
    return rec
  }
  catch (err) {
    logger.error('Error creating applicationNetworkTypeLink:', err)
    throw err
  }
}

async function update (ctx, { where, data, remoteOrigin = false }) {
  try {
    // No changing the application or the network.
    if (data.applicationId || data.networkTypeId) {
      throw httpError(403, 'Cannot change link targets')
    }
    const rec = await ctx.DB.update({ where, data })
    if (!remoteOrigin) {
      const app = await ctx.$models.applications.load({ where: rec.application })
      var logs = await ctx.$models.networkTypeAPI.pushApplication({
        networkTypeId: rec.networkType.id,
        application: app
      })
      rec.remoteAccessLogs = logs
    }
    return rec
  }
  catch (err) {
    logger.error('Error updating applicationNetworkTypeLink:', err)
    throw err
  }
}

async function remove (ctx, id) {
  try {
    var rec = await ctx.DB.load({ where: { id } })

    // Delete deviceNetworkTypeLinks
    for await (let devState of ctx.$models.devices.listAll({ where: { application: rec.application } })) {
      let ids = devState.records.map(R.prop('id'))
      for await (let _ of ctx.$models.deviceNetworkTypeLinks.removeMany({ where: { device: { id_in: ids } } })) {
      }
    }

    var logs = await ctx.$models.networkTypeAPI.deleteApplication({
      networkTypeId: rec.networkType.id,
      applicationId: rec.application.id
    })
    await ctx.DB.remove(id)
    return logs
  }
  catch (err) {
    logger.error('Error deleting applicationNetworkTypeLink:', err)
    throw err
  }
}

async function pushApplicationNetworkTypeLink (ctx, id) {
  try {
    var rec = await ctx.DB.load({ where: { id } })

    // Push deviceNetworkTypeLinks
    for await (let devState of ctx.$models.devices.listAll({ where: { application: { id } } })) {
      let ids = devState.records.map(R.prop('id'))
      for await (let devNtlState of ctx.$models.deviceNetworkTypeLinks.listAll({ where: { device: { id_in: ids } } })) {
        let ids = devNtlState.map(R.prop('id'))
        await Promise.all(ids.map(ctx.$models.deviceNetworkTypeLinks.pushDeviceNetworkTypeLink))
      }
    }

    var logs = await ctx.$models.networkTypeAPI.pushApplication({
      networkTypeId: rec.networkType.id,
      applicationId: rec.application.id,
      settings: rec.settings
    })
    rec.remoteAccessLogs = logs
    return rec
  }
  catch (err) {
    logger.error('Error updating applicationNetworkTypeLink:', err)
    throw err
  }
}

// ******************************************************************************
// Model
// ******************************************************************************
const model = createModel(
  modelContext,
  {
    create,
    list,
    listAll,
    load,
    update,
    remove,
    removeMany,
    pushApplicationNetworkTypeLink
  }
)

module.exports = {
  model,
  create,
  list,
  load,
  update,
  remove,
  pushApplicationNetworkTypeLink
}
