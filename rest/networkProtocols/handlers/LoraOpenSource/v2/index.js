const LoraOpenSource = require('../LoraOpenSource')
const appLogger = require('../../../../lib/appLogger')
const ApiClient = require('./client')

module.exports = class LoraOpenSourceV2 extends LoraOpenSource {
  constructor () {
    super()
    this.client = new ApiClient()
  }

  async register (networkProtocolModel) {
    appLogger.log('LoraOpenSource:register', 'warn')
    let me = {
      name: 'LoRa Server',
      networkTypeId: 1,
      protocolHandler: 'LoraOpenSource/v2',
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

  buildRemoteDevice (device, deviceNtl, deviceProfile, remoteAppId, remoteDeviceProfileId) {
    const result = super.buildRemoteDevice(device, deviceNtl, deviceProfile, remoteAppId, remoteDeviceProfileId)
    if (deviceNtl.networkSettings.deviceKeys) {
      result.deviceKeys = { devEUI: deviceNtl.networkSettings.devEUI }
      Object.assign(result.deviceKeys, deviceNtl.networkSettings.deviceKeys)
      if (!result.deviceKeys.nwkKey) {
        result.deviceKeys.nwkKey = result.deviceKeys.appKey
      }
    }
    else if (deviceNtl.networkSettings.deviceActivation && deviceProfile.networkSettings.macVersion.slice(0, 3) === '1.1') {
      result.deviceActivation = { devEUI: deviceNtl.networkSettings.devEUI }
      Object.assign(result.deviceActivation, deviceNtl.networkSettings.deviceActivation)
    }
    return result
  }
}
