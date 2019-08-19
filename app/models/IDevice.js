const { logger } = require('../log')
const { prisma } = require('../lib/prisma')
var httpError = require('http-errors')
const { normalizeDevEUI } = require('../lib/utils')
const R = require('ramda')
const Joi = require('@hapi/joi')
const { redisClient, redisPub } = require('../lib/redis')
const CacheFirstStrategy = require('../lib/prisma-cache/src/cache-first-strategy')
const { createModel, create, list, listAll, load, removeMany } = require('./Model')

//* *****************************************************************************
// Fragments for how the data should be returned from Prisma.
//* *****************************************************************************
const fragments = {
  basic: `fragment BasicDevice on Device {
    id
    name
    description
    deviceModel
    application {
      id
    }
  }`
}

// ******************************************************************************
// Model Context
// ******************************************************************************
const modelContext = {
  DB: new CacheFirstStrategy({
    name: 'device',
    pluralName: 'devices',
    fragments,
    defaultFragmentKey: 'basic',
    prisma,
    redis: redisClient,
    log: logger.info.bind(logger)
  })
}

// ******************************************************************************
// Helpers
// ******************************************************************************
const unicastDownlinkSchema = Joi.object().keys({
  fCnt: Joi.number().integer().min(0).required(),
  fPort: Joi.number().integer().min(1).required(),
  data: Joi.string().when('jsonData', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
  jsonData: Joi.object().optional()
})

// ******************************************************************************
// Model API
// ******************************************************************************
async function update (ctx, { where, data }) {
  if (!where) throw httpError(400, 'No record identifier "where"')
  let appId = R.either(R.prop('applicationId'), R.path(['application', 'id']))
  if (ctx.user && appId(data)) {
    const device = await ctx.$models.devices.load({ where })
    if (appId(data) !== device.application.id && ctx.user.role !== 'ADMIN') {
      throw new httpError.Forbidden()
    }
  }
  return ctx.DB.update({ where, data })
}

async function remove (ctx, id) {
  // Delete my deviceNetworkTypeLinks first.
  try {
    for await (let state of ctx.$models.deviceNetworkTypeLinks.removeMany({ where: { device: { id } } })) {
    }
  }
  catch (err) {
    logger.error('Error deleting device-dependant networkTypeLinks:', err)
  }
  return ctx.DB.remove({ id })
}

async function passDataToDevice (ctx, { id, data }) {
  // check for required fields
  let { error } = Joi.validate(data, unicastDownlinkSchema)
  if (error) throw httpError(400, error.message)
  const device = await ctx.DB.load({ id })
  const app = await ctx.$models.applications.load({ id: device.application.id })
  if (!app.enabled) return
  // Get all device networkType links
  const devNtlQuery = { device: { id } }
  let [ devNtls ] = await ctx.$models.deviceNetworkTypeLinks.list({ query: devNtlQuery })
  const logs = await Promise.all(devNtls.map(x => ctx.$models.networkTypeAPI.passDataToDevice(x, app.id, id, data)))
  return R.flatten(logs)
}

async function receiveIpDeviceUplink (ctx, { devEUI, data }) {
  devEUI = normalizeDevEUI(devEUI)
  let nwkType = await ctx.$models.networkTypes.load({ name: 'IP' })
  const devNtl = await ctx.$models.deviceNetworkTypeLinks.findByDevEUI({ devEUI, networkTypeId: nwkType.id })
  if (!devNtl) return
  // Get device
  const device = await this.load(devNtl.device.id)
  // Get application
  const app = await ctx.$models.applications.load(device.application.id)
  // Ensure application is enabled
  if (!app.running) return
  // Pass data
  let [ nwkProtos ] = await ctx.$models.networkProtocols.list({ networkType: { id: nwkType.id }, limit: 1 })
  const ipProtoHandler = await ctx.$models.networkProtocols.getHandler(nwkProtos[0].id)
  await ipProtoHandler.passDataToApplication(app, device, devEUI, data)
}

async function pushIpDeviceDownlink (ctx, { devEUI, data }) {
  devEUI = normalizeDevEUI(devEUI)
  data = JSON.stringify(data)
  const result = await redisClient.rpushAsync(`ip_downlinks:${devEUI}`, data)
  redisPub.publish(`downlink_received:${devEUI}`, '')
  return result
}

async function listIpDeviceDownlinks (ctx, { devEUI }) {
  devEUI = normalizeDevEUI(devEUI)
  let key = `ip_downlinks:${devEUI}`
  const len = await redisClient.llenAsync(key)
  if (!len) return []
  let msgs = await redisClient.lrangeAsync(key, 0, len)
  await redisClient.del(key)
  return msgs.map(JSON.parse)
}

async function importDevices (ctx, { applicationId, deviceProfileId, devices }) {
  // ensure app exists
  await ctx.$models.applications.load({ id: applicationId })
  // Load device profile
  const deviceProfile = await ctx.$models.deviceProfiles.load({ id: deviceProfileId })
  const nwkType = await ctx.$models.networkTypes.load({ id: deviceProfile.networkType.id })
  if (!nwkType.name === 'IP') {
    throw httpError(400, 'Device import currently only supports IP devices.')
  }
  // Catch all errors and return array
  return Promise.all(devices.map(async ({ name, description, deviceModel, devEUI }, row) => {
    try {
      if (!devEUI) {
        throw new Error('devEUI required for each imported device.')
      }
      const device = await ctx.DB.create({
        name: name || devEUI,
        applicationId,
        description,
        deviceModel
      })
      await ctx.$models.deviceNetworkTypeLinks.create({
        deviceId: device.id,
        networkTypeId: deviceProfile.networkType.id,
        deviceProfileId,
        networkSettings: { devEUI }
      })
      return { status: 'OK', deviceId: device.id, devEUI, row }
    }
    catch (err) {
      return { status: 'ERROR', error: err.message, devEUI, row }
    }
  }))
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
    passDataToDevice,
    receiveIpDeviceUplink,
    pushIpDeviceDownlink,
    listIpDeviceDownlinks,
    importDevices
  }
)

module.exports = {
  model,
  create,
  list,
  load,
  update,
  remove,
  passDataToDevice,
  receiveIpDeviceUplink,
  pushIpDeviceDownlink,
  listIpDeviceDownlinks,
  importDevices
}
