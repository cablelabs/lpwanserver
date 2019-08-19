const { logger } = require('../log')
const { prisma } = require('../lib/prisma')
// var httpError = require('http-errors')
const { redisClient } = require('../lib/redis')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const { createModel, load, list } = require('./Model')

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
// Model Context
// ******************************************************************************
const modelContext = {
  DB: new CacheFirstStrategy({
    name: 'deviceProfile',
    pluralName: 'deviceProfiles',
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
async function create (ctx, { data, remoteOrigin = false } = {}) {
  try {
    const rec = await ctx.DB.create(data)
    if (!remoteOrigin) {
      var logs = await ctx.$models.networkTypeAPI.addDeviceProfile({
        networkTypeId: data.networkTypeId,
        deviceProfileId: rec.id
      })
      rec.remoteAccessLogs = logs
    }
    return rec
  }
  catch (err) {
    logger.error('Failed to create deviceProfile:', err)
    throw err
  }
}

async function update (ctx, args) {
  try {
    const rec = await ctx.DB.update(args)
    var logs = await ctx.$models.networkTypeAPI.pushDeviceProfile(rec.networkType.id, rec.id)
    rec.remoteAccessLogs = logs
    return rec
  }
  catch (err) {
    logger.error('Error updating deviceProfile:', err)
    throw err
  }
}

async function remove (ctx, id) {
  try {
    var rec = await ctx.DB.load({ where: { id } })
    // Don't delete the local record until the remote operations complete.
    var logs = await ctx.$models.networkTypeAPI.deleteDeviceProfile(rec.networkType.id, id)
    await ctx.DB.remove(id)
    return logs
  }
  catch (err) {
    logger.error('Error deleting deviceProfile: ', err)
    throw err
  }
}

async function pushDeviceProfile (ctx, id) {
  try {
    var rec = await ctx.DB.load({ where: { id } })
    var logs = await ctx.$models.networkTypeAPI.pushDeviceProfile({
      networkTypeId: rec.networkType.id,
      deviceProfileId: id
    })
    rec.remoteAccessLogs = logs
    return rec
  }
  catch (err) {
    logger.error('Error pushing deviceProfile:', err)
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
    load,
    update,
    remove,
    pushDeviceProfile
  }
)

module.exports = {
  model,
  create,
  list,
  load,
  update,
  remove,
  pushDeviceProfile
}
