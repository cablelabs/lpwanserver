var httpError = require('http-errors')
const { normalizeDevEUI } = require('../../lib/utils')
const R = require('ramda')
const Joi = require('@hapi/joi')
const { create, list, listAll, load, removeMany } = require('../model-lib')
const { getUpdates } = require('../../lib/utils')

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
// Helpers
// ******************************************************************************
const unicastDownlinkSchema = Joi.object().keys({
  fCnt: Joi.number().integer().min(0).required(),
  fPort: Joi.number().integer().min(1).required(),
  data: Joi.string().when('jsonObject', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
  jsonObject: Joi.object().optional()
})

// ******************************************************************************
// Model Functions
// ******************************************************************************
async function update (ctx, { where, data, origin }) {
  if (!where) throw httpError(400, 'No record identifier "where"')
  const rec = await ctx.db.update({ where, data })
  // if certain props updated, set status on deployment record
  if (data.name || data.description) {
    const [devNwkTypeLinks] = await ctx.$m.deviceNetworkTypeLink.list({
      where: { device: { id: rec.id } }
    })
    await Promise.all(devNwkTypeLinks.map(devNwkTypeLink => {
      return ctx.$m.networkType.forAllNetworks({
        networkTypeId: devNwkTypeLink.networkType.id,
        op: network => {
          if (origin && origin.network.id === network.id) return Promise.resolve()
          return ctx.$m.networkDeployment.updateByQuery({
            where: { network: { id: network.id }, device: { id: rec.id } },
            data: { status: 'UPDATED' }
          })
        }
      })
    }))
  }
}

async function upsert (ctx, { data, ...args }) {
  try {
    let rec = await ctx.$self.load({ where: { name: data.name } })
    data = getUpdates(rec, data)
    return R.empty(data) ? rec : ctx.$self.update({ ...args, where: { id: rec.id }, data })
  }
  catch (err) {
    if (err.statusCode === 404) return ctx.$self.create({ ...args, data })
    throw err
  }
}

async function remove (ctx, { id }) {
  // Delete my deviceNetworkTypeLinks first.
  try {
    for await (let state of ctx.$m.deviceNetworkTypeLink.removeMany({ where: { device: { id } } })) {
    }
  }
  catch (err) {
    ctx.log.error('Error deleting device-dependant networkTypeLinks:', err)
    throw err
  }
  return ctx.db.remove(id)
}

async function passDataToDevice (ctx, { deviceId: id, data }) {
  // check for required fields
  let { error } = Joi.validate(data, unicastDownlinkSchema)
  if (error) throw httpError(400, error.message)
  const device = await ctx.db.load({ where: { id } })
  const app = await ctx.$m.application.load({ where: { id: device.application.id } })
  // Get all device networkType links
  let [ devNtls ] = await ctx.$m.deviceNetworkTypeLink.list({ where: { device: { id } } })

  const logs = await Promise.all(devNtls.map(
    devNtl => {
      if (!devNtl.enabled) return Promise.resolve()
      return ctx.$m.networkType.forAllNetworks({
        networkTypeId: devNtl.networkType.id,
        op: async network => {
          const nwkProto = await ctx.$m.networkProtocol.load({ where: network.networkProtocol })
          if (nwkProto.name !== 'IP') {
            return ctx.$m.networkProtocol.passDataToDevice({ network, applicationId: app.id, deviceId: id, data })
          }
          return ctx.$self.pushIpDeviceDownlink({ devEUI: devNtl.networkSettings.devEUI, data })
        }
      })
    }
  ))
  return R.flatten(logs)
}

async function receiveIpDeviceUplink (ctx, { devEUI, data }) {
  devEUI = normalizeDevEUI(devEUI)
  let nwkType = await ctx.$m.networkType.load({ where: { name: 'IP' } })
  const devNtl = await ctx.$m.deviceNetworkTypeLink.findByDevEUI({ devEUI, networkTypeId: nwkType.id })
  if (!devNtl) return
  let nwkProto = await ctx.$m.networkProtocol.loadByQuery({ where: { networkType: { id: nwkType.id } } })
  const device = await ctx.$self.load({ where: { id: devNtl.device.id } })
  return ctx.$m.networkProtocol.relayUplink({
    network: {
      networkProtocol: { id: nwkProto.id },
      networkType: { id: nwkType.id },
      enabled: true
    },
    applicationId: device.application.id,
    devEUI,
    data
  })
}

async function pushIpDeviceDownlink (ctx, { devEUI, data }) {
  devEUI = normalizeDevEUI(devEUI)
  data = JSON.stringify(data)
  ctx.log.debug('pushIpDeviceDownlink', { devEUI, data })
  const result = await ctx.redis.keyval.rpushAsync(`ip_downlinks:${devEUI}`, data)
  ctx.redis.pub.publish(`downlink_received:${devEUI}`, '')
  return result
}

async function listIpDeviceDownlinks (ctx, { devEUI }) {
  devEUI = normalizeDevEUI(devEUI)
  let key = `ip_downlinks:${devEUI}`
  const len = await ctx.redis.keyval.llenAsync(key)
  ctx.log.debug('listIpDeviceDownlinks', { devEUI, len })
  if (!len) return []
  let msgs = await ctx.redis.keyval.lrangeAsync(key, 0, len)
  await ctx.redis.keyval.del(key)
  return msgs.map(JSON.parse)
}

async function importDevices (ctx, { applicationId, deviceProfileId, devices }) {
  // ensure app exists
  await ctx.$m.application.load({ where: { id: applicationId } })
  // Load device profile
  const deviceProfile = await ctx.$m.deviceProfile.load({ where: { id: deviceProfileId } })
  const nwkType = await ctx.$m.networkType.load({ where: { id: deviceProfile.networkType.id } })
  if (!nwkType.name === 'IP') {
    throw httpError(400, 'Device import currently only supports IP devices.')
  }
  // Catch all errors and return array
  return Promise.all(devices.map(async ({ name, description, deviceModel, devEUI }, row) => {
    try {
      if (!devEUI) {
        throw new Error('devEUI required for each imported device.')
      }
      const device = await ctx.db.create({ data: {
        name: name || devEUI,
        applicationId,
        description,
        deviceModel
      } })
      await ctx.$m.deviceNetworkTypeLink.create({ data: {
        deviceId: device.id,
        networkTypeId: deviceProfile.networkType.id,
        deviceProfileId,
        networkSettings: { devEUI }
      } })
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
module.exports = {
  role: 'device',
  publicApi: {
    create,
    list,
    listAll,
    load,
    update,
    upsert,
    remove,
    removeMany,
    passDataToDevice,
    receiveIpDeviceUplink,
    pushIpDeviceDownlink,
    listIpDeviceDownlinks,
    importDevices
  },
  fragments
}
