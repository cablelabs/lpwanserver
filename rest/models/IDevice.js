const appLogger = require('../lib/appLogger.js')
const { prisma } = require('../lib/prisma')
var httpError = require('http-errors')
const { normalizeDevEUI, renameKeys } = require('../lib/utils')
const R = require('ramda')
const Joi = require('@hapi/joi')
const { redisClient, redisPub } = require('../lib/redis')
const CacheFirstStrategy = require('../../lib/prisma-cache/src/cache-first-strategy')

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
// Database Client
// ******************************************************************************
const DB = new CacheFirstStrategy({
  name: 'device',
  pluralName: 'devices',
  fragments,
  defaultFragmentKey: 'basic',
  prisma,
  redis: redisClient,
  log: appLogger.log.bind(appLogger)
})

// ******************************************************************************
// Helpers
// ******************************************************************************
const unicastDownlinkSchema = Joi.object().keys({
  fCnt: Joi.number().integer().min(0).required(),
  fPort: Joi.number().integer().min(1).required(),
  data: Joi.string().when('jsonData', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
  jsonData: Joi.object().optional()
})

const renameQueryKeys = renameKeys({ search: 'name_contains' })

// ******************************************************************************
// Model
// ******************************************************************************
module.exports = class Device {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
  }

  async load (id) {
    const dvc = await DB.load({ id })
    try {
      const [ devNtls ] = await this.modelAPI.deviceNetworkTypeLinks.list({ deviceId: id })
      if (devNtls.length) {
        dvc.networks = devNtls.map(x => x.networkType.id)
      }
    }
    catch (err) {
      // ignore
    }
    return dvc
  }


  async list (query = {}, opts) {
    return DB.list(renameQueryKeys(query), opts)
  }

  create (data) {
    return DB.create(data)
  }

  update ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing Device ID')
    return DB.update({ id }, data)
  }

  async remove (id) {
    // Delete my deviceNetworkTypeLinks first.
    try {
      let [ devNtls ] = await this.modelAPI.deviceNetworkTypeLinks.list({ deviceId: id })
      await Promise.all(devNtls.map(x => this.modelAPI.deviceNetworkTypeLinks.remove(x.id)))
    }
    catch (err) {
      appLogger.log(`Error deleting device-dependant networkTypeLinks: ${err}`)
    }
    return DB.remove({ id })
  }

  async passDataToDevice (id, data) {
    // check for required fields
    let { error } = Joi.validate(data, unicastDownlinkSchema)
    if (error) throw httpError(400, error.message)
    const device = await DB.load({ id })
    const app = await this.modelAPI.applications.load(device.application.id)
    if (!app.running) return
    // Get all device networkType links
    const devNtlQuery = { device: { id } }
    let [ devNtls ] = await this.modelAPI.deviceNetworkTypeLinks.list(devNtlQuery)
    const logs = await Promise.all(devNtls.map(x => this.modelAPI.networkTypeAPI.passDataToDevice(x, app.id, id, data)))
    return R.flatten(logs)
  }

  // Since device access often depends on the user's company, we'll often have to
  // do a check.  But this makes the code very convoluted with promises and
  // callbacks.  Eaiser to do this as a validation step.
  //
  // If called, req.params.id MUST exist, and we assume this is an existing
  // device id if this function is called.  We then use this to get the device
  // and the device's application, and put them into the req object for use by
  // the REST code.  This means that the REST code can easily check ownership,
  // and it keeps all of that validation in one place, not requiring promises in
  // some cases but not others (e.g., when the user is part of an admin company).
  async fetchDeviceApplication (req, res, next) {
    try {
      const dev = await this.load(req.params.id)
      req.device = dev
      const app = await this.modelAPI.applications.load(dev.application.id)
      req.application = app
      next()
    }
    catch (err) {
      res.status(err.status || 400)
      res.end()
    }
  }

  // This is similar to the previous method, except it looks for the
  // applicationId in the request body to get the application for the device we
  // want to create.
  async fetchApplicationForNewDevice (req, res, next) {
    try {
      const app = await this.modelAPI.applications.load(req.body.applicationId)
      req.application = app
      next()
    }
    catch (err) {
      res.status(400)
      res.end()
    }
  }

  async receiveIpDeviceUplink (devEUI, data) {
    devEUI = normalizeDevEUI(devEUI)
    let nwkType = await this.modelAPI.networkTypes.loadByName('IP')
    const devNtl = await this.modelAPI.deviceNetworkTypeLinks.findByDevEUI(devEUI, nwkType.id)
    if (!devNtl) return
    // Get device
    const device = await this.load(devNtl.device.id)
    // Get application
    const app = await this.modelAPI.applications.load(device.application.id)
    // Ensure application is enabled
    if (!app.running) return
    // Pass data
    let [ nwkProtos ] = await this.modelAPI.networkProtocols.list({ networkType: { id: nwkType.id }, limit: 1 })
    const ipProtoHandler = await this.modelAPI.networkProtocols.getHandler(nwkProtos[0].id)
    await ipProtoHandler.passDataToApplication(app, device, devEUI, data)
  }

  async pushIpDeviceDownlink (devEUI, data) {
    devEUI = normalizeDevEUI(devEUI)
    data = JSON.stringify(data)
    const result = await redisClient.rpushAsync(`ip_downlinks:${devEUI}`, data)
    redisPub.publish(`downlink_received:${devEUI}`, '')
    return result
  }

  async listIpDeviceDownlinks (devEUI) {
    devEUI = normalizeDevEUI(devEUI)
    let key = `ip_downlinks:${devEUI}`
    const len = await redisClient.llenAsync(key)
    if (!len) return []
    let msgs = await redisClient.lrangeAsync(key, 0, len)
    await redisClient.del(key)
    return msgs.map(JSON.parse)
  }

  async importDevices ({ applicationId, deviceProfileId, devices }) {
    // ensure app exists
    await this.modelAPI.applications.load(applicationId)
    // Load device profile
    const deviceProfile = await this.modelAPI.deviceProfiles.load(deviceProfileId)
    // Catch all errors and return array
    return Promise.all(devices.map(async ({ name, description, deviceModel, devEUI }) => {
      try {
        if (!devEUI) {
          throw new Error('devEUI required for each imported device.')
        }
        const device = await this.create({ name: name || devEUI, applicationId, description, deviceModel })
        await this.modelAPI.deviceNetworkTypeLinks.create({
          deviceId: device.id,
          networkTypeId: deviceProfile.networkType.id,
          deviceProfileId,
          networkSettings: { devEUI }
        })
        return { status: 'OK', deviceId: device.id, devEUI }
      }
      catch (err) {
        return { status: 'ERROR', error: { ...err }, devEUI }
      }
    }))
  }
}
