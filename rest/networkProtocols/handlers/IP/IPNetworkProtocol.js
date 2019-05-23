const NetworkProtocol = require('../../NetworkProtocol')

module.exports = class LoraOpenSource extends NetworkProtocol {
  // Pass data to application
  passDataToApplication (app, device, devEUI, data) {
    const reportingAPI = this.modelAPI.reportingProtocols.getHandler(app.reportingProtocol.id)
    data.deviceInfo = {
      ...R.pick(['name', 'description'], device),
      model: device.deviceModel,
      devEUI
    }
    data.applicationInfo = { name: app.name }
    await reportingAPI.report(data, app.baseUrl, app.name)
  }

  async passDataToDevice (network, appId, deviceId, body) {
    // Ensure network is enabled
    if (!network.securityData.enabled) return
    const devNwkId = await this.modelAPI.protocolData.loadValue(network, makeDeviceDataKey(deviceId, 'devNwkId'))
    return this.client.createDeviceMessage(network, devNwkId, { ...body, devEUI: devNwkId })
  }
}
