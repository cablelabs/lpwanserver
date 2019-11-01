const LoraOpenSource = require('../LoraOpenSource')
const ApiClient = require('./client')
const R = require('ramda')

module.exports = class LoraOpenSourceV2 extends LoraOpenSource {
  constructor (opts) {
    super(opts)
    this.client = new ApiClient()
  }

  buildNetworkDevice (args) {
    const { device, deviceProfile } = args
    const result = super.buildNetworkDevice(args)
    if (device.deviceKeys) {
      result.deviceKeys = R.merge(device.deviceKeys, { devEUI: device.devEUI })
      if (!result.deviceKeys.nwkKey) {
        result.deviceKeys.nwkKey = result.deviceKeys.appKey
      }
    }
    else if (device.deviceActivation && deviceProfile.networkSettings.macVersion) {
      const mac = deviceProfile.networkSettings.macVersion.slice(0, 3)
      result.deviceActivation = R.merge(device.deviceActivation, { devEUI: device.devEUI })
      if (mac === '1.0') {
        result.deviceActivation.nwkSEncKey = device.deviceActivation.fNwkSIntKey
        result.deviceActivation.sNwkSIntKey = device.deviceActivation.fNwkSIntKey
      }
    }
    return result
  }
}
