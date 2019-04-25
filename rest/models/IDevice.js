const appLogger = require('../lib/appLogger.js')
const { prisma, formatInputData, formatRelationshipsIn } = require('../lib/prisma')
var httpError = require('http-errors')
const { onFail } = require('../lib/utils')

module.exports = class Device {
  constructor (modelAPI) {
    this.modelAPI = modelAPI
  }

  createDevice (name, description, applicationId, deviceModel) {
    appLogger.log(`IDevice ${name}, ${description}, ${applicationId}, ${deviceModel}`)
    const data = formatInputData({
      name,
      description,
      applicationId,
      deviceModel
    })
    return prisma.createDevice(data).$fragment(fragments.basic)
  }

  async retrieveDevice (id) {
    const dvc = await loadDevice({ id })
    try {
      const { records } = await this.modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks({ deviceId: id })
      if (records.length) {
        dvc.networks = records.map(x => x.networkType.id)
      }
    }
    catch (err) {
      // ignore
    }
    return dvc
  }

  async retrieveDevices ({ limit, offset, ...where } = {}) {
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

  updateDevice ({ id, ...data }) {
    if (!id) throw httpError(400, 'No existing Device ID')
    data = formatInputData(data)
    return prisma.updateDevice({ data, where: { id } }).$fragment(fragments.basic)
  }

  async deleteDevice (id) {
    // Delete my deviceNetworkTypeLinks first.
    try {
      let { records } = await this.modelAPI.deviceNetworkTypeLinks.retrieveDeviceNetworkTypeLinks({ deviceId: id })
      await Promise.all(records.map(x => this.modelAPI.deviceNetworkTypeLinks.deleteDeviceNetworkTypeLink(x.id)))
    }
    catch (err) {
      appLogger.log('Error deleting device-dependant networkTypeLinks: ',err)
    }
    return onFail(400, () => prisma.deleteDevice({ id }))
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
      const dev = await this.retrieveDevice(parseInt(req.params.id, 10))
      req.device = dev
      const app = await this.modelAPI.applications.retrieveApplication(dev.application.id)
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
      const app = await this.modelAPI.applications.retrieveApplication(parseInt(req.body.applicationId, 10))
      req.application = app
      next()
    }
    catch (err) {
      res.status(400)
      res.end()
    }
  }
}

// ******************************************************************************
// Helpers
// ******************************************************************************
async function loadDevice (uniqueKeyObj, fragementKey = 'basic') {
  const rec = await onFail(400, () => prisma.device(uniqueKeyObj).$fragment(fragments[fragementKey]))
  if (!rec) throw httpError(404, 'Device not found')
  return rec
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
