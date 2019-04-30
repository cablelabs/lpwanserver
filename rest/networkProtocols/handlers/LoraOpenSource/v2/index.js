const LoraOpenSource = require('../LoraOpenSource')
const appLogger = require('../../../../lib/appLogger')
const ApiClient = require('./client')
const R = require('ramda')

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
