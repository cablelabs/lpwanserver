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

  buildDevice (args) {
    const device = super.buildDevice(args)
    if (device.deviceKeys) {
      device.deviceKeys = renameAppKey(device.deviceKeys)
    }
    if (device.deviceActivation) {
      device.deviceActivation = renameKeys({ fCntDown: 'aFCntDown', nwkSKey: 'fNwkSIntKey' }, device.deviceActivation)
    }
    return device
  }

  buildNetworkDevice (args) {
    const { device } = args
    const result = super.buildNetworkDevice(args)
    if (device.deviceKeys) {
      result.deviceKeys = {
        devEUI: device.devEUI,
        appKey: device.deviceKeys.nwkKey
      }
    }
    else if (device.deviceActivation && device.macVersion.slice(0, 3) === '1.0') {
      result.deviceActivation = {
        devEUI: device.devEUI,
        ...R.pick(['appSKey', 'devAddr', 'fCntUp'], device.deviceActivation),
        fCntDwn: device.deviceActivation.aFCntDown,
        nwkSKey: device.deviceActivation.fNwkSIntKey
      }
    }
    return result
  }
}
