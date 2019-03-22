const LoraOpenSourceRestClient = require('../client')
const R = require('ramda')

module.exports = class LoraOpenSourceV1RestClient extends LoraOpenSourceRestClient {
  async createDeviceProfile (network, session, body) {
    const props = ['name', 'networkServerID', 'organizationID']
    const { deviceProfileID } = await super.createDeviceProfile(network, session, {
      ...R.pick(props, body),
      deviceProfile: R.omit(props, body)
    })
    return { id: deviceProfileID }
  }

  async loadDeviceProfile (network, session, id) {
    const body = await super.loadDeviceProfile(network, session, id)
    return { ...R.omit(['deviceProfileID'], body), id }
  }

  async listDeviceProfiles (network, session, params) {
    const body = await super.listDeviceProfiles(network, session, params)
    return {
      ...body,
      result: body.result.map(x => ({
        ...R.omit(['deviceProfileID'], x),
        id: x.serviceProfileID
      }))
    }
  }

  replaceDeviceProfile (network, session, body) {
    return super.replaceDeviceProfile(network, session, {
      deviceProfile: { ...R.omit(['name', 'id'], body), deviceProfileID: body.id },
      ...R.pick(['name'], body)
    })
  }

  createDeviceKeys (network, session, devEUI, body) {
    return super.createDeviceKeys(network, session, devEUI, {
      devEUI: body.devEUI,
      deviceKeys: R.omit(['devEUI', 'nwkKey'], body)
    })
  }

  replaceDeviceKeys (network, session, devEUI, body) {
    return super.replaceDeviceKeys(network, session, devEUI, {
      devEUI: body.devEUI,
      deviceKeys: R.omit(['devEUI', 'nwkKey'], body)
    })
  }

  async loadServiceProfile (network, session, id) {
    const body = await super.loadServiceProfile(network, session, id)
    return { ...R.omit(['serviceProfileID'], body), id }
  }

  async createServiceProfile (network, session, body) {
    const props = ['name', 'networkServerID', 'organizationID']
    const { serviceProfileID } = await super.createServiceProfile(network, session, {
      ...R.pick(props, body),
      serviceProfile: R.omit(props, body)
    })
    return { id: serviceProfileID }
  }

  async listServiceProfiles (network, session, params) {
    const body = await super.listServiceProfiles(network, session, params)
    return {
      ...body,
      result: body.result.map(x => ({
        ...R.omit(['serviceProfileID'], x),
        id: x.serviceProfileID
      }))
    }
  }

  replaceServiceProfile (network, session, body) {
    return super.replaceServiceProfile(network, session, {
      serviceProfile: { ...R.omit(['name', 'id'], body), serviceProfileID: body.id },
      ...R.pick(['name'], body)
    })
  }

  listDevices (network, session, params) {
    const url = `/applications/${params.applicationID}/devices`
    const opts = { url: this.constructUrl({ url, params: R.omit(['applicationID'], params) }) }
    return this.request(network, opts, session)
  }

  createApplicationIntegration (network, session, appId, id, body) {
    return super.createApplicationIntegration(network, session, appId, id, {
      ...R.omit(['uplinkDataURL'], body),
      dataUpURL: body.uplinkDataURL
    })
  }

  replaceApplicationIntegration (network, session, appId, id, body) {
    return super.createApplicationIntegration(network, session, appId, id, {
      ...R.omit(['uplinkDataURL'], body),
      dataUpURL: body.uplinkDataURL
    })
  }

  async loadDeviceActivation (network, session, devEUI) {
    const body = await super.loadDeviceActivation(network, session, devEUI)
    return {
      ...R.omit(['fCntDown', 'nwkSKey'], body),
      aFCntDown: body.fCntDown,
      nwkSEncKey: body.nwkSKey
    }
  }

  activateDevice (network, session, devEUI, body) {
    return super.activateDevice(network, session, devEUI, {
      ...R.omit(['aFCntDown', 'nwkSEncKey', 'fNwkSIntKey', 'sNwkSIntKey', 'nFCntDown'], body),
      fCntDown: body.aFCntDown,
      nwkSKey: body.nwkSEncKey,
      skipFCntCheck: false
    })
  }
}
