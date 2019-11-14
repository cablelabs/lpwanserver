const ChirpStack = require('../ChirpStack')
const ApiClient = require('./client')
const R = require('ramda')

module.exports = class ChirpStackV2 extends ChirpStack {
  constructor (opts) {
    super(opts)
    this.client = new ApiClient({ logger: opts.logger })
  }

  buildNetworkDevice (args) {
    const { device, deviceProfile } = args
    const result = super.buildNetworkDevice(args)
    if (device.deviceKeys) {
      result.deviceKeys = R.merge(device.deviceKeys, { devEUI: device.devEUI })
      if (!result.deviceKeys.nwkKey) {
        result.deviceKeys.nwkKey = result.deviceKeys.appKey
        delete result.deviceKeys.appKey
      }
    }
    else if (device.deviceActivation && deviceProfile.macVersion) {
      const mac = deviceProfile.macVersion.slice(0, 3)
      result.deviceActivation = R.merge(device.deviceActivation, { devEUI: device.devEUI })
      if (mac === '1.0') {
        result.deviceActivation.nwkSEncKey = device.deviceActivation.fNwkSIntKey
        result.deviceActivation.sNwkSIntKey = device.deviceActivation.fNwkSIntKey
      }
    }
    return result
  }
}
