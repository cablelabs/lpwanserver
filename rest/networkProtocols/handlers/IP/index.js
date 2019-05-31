const NetworkProtocol = require('../../NetworkProtocol')
const IpDeviceRestClient = require('./IPRestClient')
const R = require('ramda')
const appLogger = require('../../../lib/appLogger')

module.exports = class LoraOpenSource extends NetworkProtocol {
  constructor (opts) {
    super(opts)
    this.client = new IpDeviceRestClient()
  }

  // Pass data to application
  async passDataToApplication (app, device, devEUI, data) {
    const reportingAPI = this.modelAPI.reportingProtocols.getHandler(app.reportingProtocol.id)
    data.deviceInfo = {
      ...R.pick(['name', 'description'], device),
      model: device.deviceModel,
      devEUI
    }
    data.applicationInfo = { name: app.name }
    await reportingAPI.report(data, app.baseUrl, app.name)
  }

  async passDataToDevice (devNTL, deviceId, body, cache, checkDuration = true) {
    appLogger.log(`PASS DATA TO DEVICE: ${JSON.stringify({ devNTL, deviceId, body, cache, checkDuration })}`)
    // ensure cache exists
    if (!cache) {
      throw new Error(`No known address and port for IP device of deviceId=${deviceId}`)
    }
    const send = () => this.client.createDeviceMessage(cache, body)
    if (!checkDuration) return send()
    const deviceProfile = await this.modelAPI.deviceProfiles.load(devNTL.deviceProfile.id)
    // Ensure that deviceProfile.networkSettings.connectionDuration has not exceeded
    let { connectionDuration } = deviceProfile.networkSettings
    if (!connectionDuration) return send()
    // Connection duration is in seconds
    connectionDuration = parseInt(connectionDuration, 10)
    // If connectionDuration window open, send message
    if ((connectionDuration * 1000 + cache.updatedAt) >= Date.now()) {
      return send()
    }
    await this.modelAPI.pushIpDeviceMessage(deviceId, body)
  }
}
