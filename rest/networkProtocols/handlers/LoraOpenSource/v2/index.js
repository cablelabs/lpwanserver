const LoraOpenSource = require('../LoraOpenSource')
const appLogger = require('../../../../lib/appLogger')
const ApiClient = require('./client')
const R = require('ramda')

module.exports = class LoraOpenSourceV2 extends LoraOpenSource {
  constructor (opts) {
    super(opts)
    this.client = new ApiClient()
  }

  buildRemoteDevice (device, deviceNtl, deviceProfile, remoteAppId, remoteDeviceProfileId) {
    const result = super.buildRemoteDevice(device, deviceNtl, deviceProfile, remoteAppId, remoteDeviceProfileId)
    const NS = deviceNtl.networkSettings
    const { deviceKeys, deviceActivation } = NS
    if (deviceKeys) {
      result.deviceKeys = { devEUI: NS.devEUI }
      Object.assign(result.deviceKeys, deviceKeys)
      if (!result.deviceKeys.nwkKey) {
        result.deviceKeys.nwkKey = result.deviceKeys.appKey
      }
    }
    else if (deviceActivation) {
      const mac = deviceProfile.networkSettings.macVersion.slice(0, 3)
      result.deviceActivation = { devEUI: NS.devEUI }
      if (mac === '1.1') {
        Object.assign(result.deviceActivation, deviceActivation)
      }
      else if (mac === '1.0') {
        Object.assign(result.deviceActivation, {
          ...R.pick(['appSKey', 'devAddr', 'fCntUp'], deviceActivation),
          nFCntDown: deviceActivation.fCntDwn,
          fNwkSIntKey: deviceActivation.nwkSKey,
          nwkSEncKey: deviceActivation.nwkSKey,
          sNwkSIntKey: deviceActivation.nwkSKey
        })
      }
    }
    return result
  }
}
