const LoraOpenSource = require('../LoraOpenSource')
const appLogger = require('../../lib/appLogger.js')

module.exports = class LoraOpenSourceV2 extends LoraOpenSource {
  async register (networkProtocolModel) {
    appLogger.log('LoraOpenSource:register', 'warn')
    let me = {
      name: 'LoRa Server',
      networkTypeId: 1,
      protocolHandler: 'LoRaOpenSource/v2',
      networkProtocolVersion: '2.0'
    }
    try {
      const { records } = await networkProtocolModel.retrieveNetworkProtocols({ search: me.name, networkProtocolVersion: '1.0' })
      console.log('REGISTER LORA 2: RECORDS', JSON.stringify(records))
      if (records.length) {
        me.masterProtocol = records[0].id
      }
    }
    catch (err) {
      // ignore error
    }
    await networkProtocolModel.upsertNetworkProtocol(me)
  }
}
