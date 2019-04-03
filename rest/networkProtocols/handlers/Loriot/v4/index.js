const Loriot = require('../Loriot')
const appLogger = require('../../../../lib/appLogger')
const ApiClient = require('./client')

module.exports = class LoriotV4 extends Loriot {
  constructor () {
    super()
    this.client = new ApiClient()
  }

  async register (networkProtocolModel) {
    appLogger.log('Loriotv4:register', 'warn')
    return networkProtocolModel.upsertNetworkProtocol({
      name: 'Loriot',
      networkTypeId: 1,
      protocolHandler: 'Loriot/v4',
      networkProtocolVersion: '4.0'
    })
  }
}
