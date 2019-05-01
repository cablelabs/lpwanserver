const LoraOpenSource = require('../LoraOpenSource')
const appLogger = require('../../../../lib/appLogger')
const ApiClient = require('./client')
const R = require('ramda')

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

  buildRemoteDevice (device, deviceNtl, deviceProfile, remoteAppId, remoteDeviceProfileId) {
    const result = super.buildRemoteDevice(device, deviceNtl, deviceProfile, remoteAppId, remoteDeviceProfileId)
    if (deviceNtl.networkSettings.deviceKeys) {
      result.deviceKeys = {
        devEUI: deviceNtl.networkSettings.devEUI,
        appKey: deviceNtl.networkSettings.deviceKeys.appKey
      }
    }
    else if (deviceNtl.networkSettings.deviceActivation && deviceProfile.networkSettings.macVersion.slice(0, 3) === '1.0') {
      result.deviceActivation = {
        devEUI: deviceNtl.networkSettings.devEUI,
        ...R.pick(['appSKey', 'devAddr', 'fCntUp'], deviceNtl.networkSettings.deviceActivation),
        fCntDwn: deviceNtl.networkSettings.deviceActivation.nFCntDown,
        nwkSKey: deviceNtl.networkSettings.deviceActivation.fNwkSIntKey
      }

      Object.assign(result.deviceActivation, deviceNtl.networkSettings.deviceActivation)
    }
    return result
  }
}
