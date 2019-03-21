const LoraOpenSource = require('../LoraOpenSource')
const appLogger = require('../../lib/appLogger.js')

module.exports = class LoraOpenSourceV1 extends LoraOpenSource {
  async register (networkProtocolModel) {
    appLogger.log('LoraOpenSource:register')
    await networkProtocolModel.upsertNetworkProtocol({
      name: 'LoRa Server',
      networkTypeId: 1,
      protocolHandler: 'LoRaOpenSource_1.js',
      networkProtocolVersion: '1.0'
    })
  }

  buildDefaultOrgUser (creds, organizationID) {
    
  }

  buildDefaultServiceProfile (networkServerID, organizationID) {
    return {
      name: 'defaultForLPWANServer',
      networkServerID,
      organizationID,
      serviceProfile: {
        addGWMetadata: true,
        devStatusReqFreq: 1,
        dlBucketSize: 0,
        ulRate: 100000,
        dlRate: 100000,
        dlRatePolicy: 'DROP',
        ulRatePolicy: 'DROP',
        drMax: 3,
        drMin: 0,
        reportDevStatusBattery: true,
        reportDevStatusMargin: true
      }
    }
  }
}
