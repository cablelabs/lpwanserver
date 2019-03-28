const LoraOpenSource = require('../LoraOpenSource')
const appLogger = require('../../../../lib/appLogger')
const ApiClient = require('./client')

module.exports = class LoraOpenSourceV1 extends LoraOpenSource {
  constructor () {
    super()
    this.client = new ApiClient()
  }

  async register (networkProtocolModel) {
    appLogger.log('LoraOpenSource:register')
    await networkProtocolModel.upsertNetworkProtocol({
      name: 'LoRa Server',
      networkTypeId: 1,
      protocolHandler: 'LoraOpenSource/v1',
      networkProtocolVersion: '1.0'
    })
  }
}
