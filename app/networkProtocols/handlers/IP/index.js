const NetworkProtocol = require('../../NetworkProtocol')
const R = require('ramda')
const httpError = require('http-errors')

module.exports = class LoraOpenSource extends NetworkProtocol {
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

  async passDataToDevice (devNTL, body) {
    if (!devNTL.networkSettings.devEUI) {
      throw httpError(400, `Error passing message to device ${devNTL.device.id}: no known devEUI.`)
    }
    await this.modelAPI.devices.pushIpDeviceDownlink(devNTL.networkSettings.devEUI, body)
  }
}
