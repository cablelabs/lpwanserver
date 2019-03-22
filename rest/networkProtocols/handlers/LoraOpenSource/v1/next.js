const LoraOpenSource = require('../LoraOpenSource')
const appLogger = require('../../lib/appLogger.js')

module.exports = class LoraOpenSourceV1 extends LoraOpenSource {
  async register (networkProtocolModel) {
    appLogger.log('LoraOpenSource:register')
    await networkProtocolModel.upsertNetworkProtocol({
      name: 'LoRa Server',
      networkTypeId: 1,
      protocolHandler: 'LoRaOpenSource/v1',
      networkProtocolVersion: '1.0'
    })
  }
}
