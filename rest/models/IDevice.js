const appLogger = require('../lib/appLogger.js')
const { prisma, formatInputData, formatRelationshipsIn, loadRecord } = require('../lib/prisma')
var httpError = require('http-errors')
const { onFail } = require('../lib/utils')
const R = require('ramda')
const Joi = require('@hapi/joi')

module.exports = class Device {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
  }

  create (name, description, applicationId, deviceModel) {
    appLogger.log(`IDevice ${name}, ${description}, ${applicationId}, ${deviceModel}`)
    const data = formatInputData({
      name,
      description,
      applicationId,
      deviceModel
    })
    return prisma.createDevice(data).$fragment(fragments.basic)
  }

  async load (id) {
    const dvc = await loadDevice({ id })
    try {
      const { records } = await this.modelAPI.deviceNetworkTypeLinks.list({ deviceId: id })
      if (records.length) {
        dvc.networks = records.map(x => x.networkType.id)
      }
    }
    catch (err) {
      // ignore
    }
    return dvc
  }

  async list ({ limit, offset, ...where } = {}) {
    where = formatRelationshipsIn(where)
    if (where.search) {
      where.name_contains = where.search
      delete where.search
    }
    const query = { where }
    if (limit) query.first = limit
    if (offset) query.skip = offset
    const [records, totalCount] = await Promise.all([
      prisma.devices(query).$fragment(fragments.basic),
      prisma.devicesConnection({ where }).aggregate().count()
    ])
    return { totalCount, records }
  }

  update ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing Device ID')
    data = formatInputData(data)
    return prisma.updateDevice({ data, where: { id } }).$fragment(fragments.basic)
  }

  async remove (id) {
    // Delete my deviceNetworkTypeLinks first.
    try {
      let { records } = await this.modelAPI.deviceNetworkTypeLinks.list({ deviceId: id })
      await Promise.all(records.map(x => this.modelAPI.deviceNetworkTypeLinks.remove(x.id)))
    }
    catch (err) {
      appLogger.log(`Error deleting device-dependant networkTypeLinks: ${err}`)
    }
    return onFail(400, () => prisma.deleteDevice({ id }))
  }

  async passDataToDevice (id, data) {
    // check for required fields
    let { error } = Joi.validate(data, unicastDownlinkSchema)
    if (error) throw httpError(400, error.message)
    const device = await loadDevice({ id })
    const app = await this.modelAPI.applications.load(device.application.id)
    if (!app.running) return
    // Get all device networkType links
    const devNtlQuery = { device: { id } }
    let { records } = await this.modelAPI.deviceNetworkTypeLinks.list(devNtlQuery)
    const logs = await Promise.all(records.map(x => this.modelAPI.networkTypeAPI.passDataToDevice(x.networkType.id, app.id, id, data)))
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
      const dev = await this.load(parseInt(req.params.id, 10))
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
      const app = await this.modelAPI.applications.load(parseInt(req.body.applicationId, 10))
      req.application = app
      next()
    }
    catch (err) {
      res.status(400)
      res.end()
    }
  }

  async receiveIpDeviceUplink (devEUI, data) {
    // Get IP Network Type
    let nwkType = await this.modelAPI.networkTypes.loadByName('IP')
    // Ensure a deviceNTL exists
    const devNTLQuery = { networkType: { id: nwkType.id }, networkSettings_contains: devEUI }
    let { records: devNTLs } = await this.modelAPI.deviceNetworkTypeLinks.list(devNTLQuery)
    if (!devNTLs.length) return
    // Get device
    const device = await this.modelAPI.devices.load(devNTLs[0].device.id)
    // Get application
    const app = await this.modelAPI.applications.load(device.application.id)
    // Ensure application is enabled
    if (!app.enabled) return
    // Update device's location in redis
    // Pass data
    let { records: nwkProtos } = await this.modelAPI.networkProtocols.list({ networkType: { id: nwkType.id } })
    const ipProtoHandler = await this.modelAPI.networkProtocols.getHandler(nwkProtos[0].id)
    await ipProtoHandler.passDataToApplication(app, device, devEUI, data)
  }
}

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
const loadDevice = loadRecord('device', fragments, 'basic')

const unicastDownlinkSchema = Joi.object().keys({
  fCnt: Joi.number().integer().min(0).required(),
  fPort: Joi.number().integer().min(1).required(),
  data: Joi.string().when('jsonData', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
  jsonData: Joi.object().optional()
})
