const NetworkProtocol = require('../../NetworkProtocol')
const httpError = require('http-errors')

module.exports = class IPNetworkProtocol extends NetworkProtocol {
  async passDataToDevice (devNTL, body) {
    if (!devNTL.networkSettings.devEUI) {
      throw httpError(400, `Error passing message to device ${devNTL.device.id}: no known devEUI.`)
    }
    await this.modelAPI.devices.pushIpDeviceDownlink(devNTL.networkSettings.devEUI, body)
  }
}
