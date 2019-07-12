const LoraOpenSource = require('../LoraOpenSource')
const ApiClient = require('./client')
const R = require('ramda')
const { renameKeys } = require('../../../../lib/utils')

const renameAppKey = renameKeys({ appKey: 'nwkKey' })

module.exports = class LoraOpenSourceV1 extends LoraOpenSource {
  constructor (opts) {
    super(opts)
    this.client = new ApiClient()
  }

  buildDeviceNetworkSettings (remoteDevice) {
    const result = super.buildDeviceNetworkSettings(remoteDevice)
    return result.deviceKeys
      ? { ...result, deviceKeys: renameAppKey(result.deviceKeys) }
      : result
  }

  buildRemoteDevice (device, deviceNtl, deviceProfile, remoteAppId, remoteDeviceProfileId) {
    const result = super.buildRemoteDevice(device, deviceNtl, deviceProfile, remoteAppId, remoteDeviceProfileId)
    if (deviceNtl.networkSettings.deviceKeys) {
      result.deviceKeys = {
        devEUI: deviceNtl.networkSettings.devEUI,
        appKey: deviceNtl.networkSettings.deviceKeys.nwkKey
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
