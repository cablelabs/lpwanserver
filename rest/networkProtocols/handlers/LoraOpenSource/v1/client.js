const LoraOpenSourceRestClient = require('../client')
const R = require('ramda')
const appLogger = require('../../../../lib/appLogger.js')

module.exports = class LoraOpenSourceV1RestClient extends LoraOpenSourceRestClient {
  async createDeviceProfile (session, network, body) {
    const props = ['name', 'networkServerID', 'organizationID']
    const { deviceProfileID } = await super.createDeviceProfile(session, network, {
      ...R.pick(props, body),
      deviceProfile: R.omit(props, body)
    })
    return { id: deviceProfileID }
  }

  async loadDeviceProfile (session, network, id) {
    const body = await super.loadDeviceProfile(session, network, id)
    return { ...R.omit(['deviceProfileID'], body), id }
  }

  async listDeviceProfiles (session, network, params) {
    const body = await super.listDeviceProfiles(session, network, params)
    return {
      ...body,
      result: body.result.map(x => ({
        ...R.omit(['deviceProfileID'], x),
        id: x.deviceProfileID
      }))
    }
  }

  replaceDeviceProfile (session, network, id, body) {
    return super.replaceDeviceProfile(session, network, id, {
      deviceProfile: { ...R.omit(['name', 'id'], body), deviceProfileID: body.id },
      ...R.pick(['name'], body)
    })
  }

  createDeviceKeys (session, network, devEUI, body) {
    return super.createDeviceKeys(session, network, devEUI, {
      devEUI: body.devEUI,
      deviceKeys: R.omit(['devEUI', 'nwkKey'], body)
    })
  }

  replaceDeviceKeys (session, network, devEUI, body) {
    return super.replaceDeviceKeys(session, network, devEUI, {
      devEUI: body.devEUI,
      deviceKeys: R.omit(['devEUI', 'nwkKey'], body)
    })
  }

  async loadServiceProfile (session, network, id) {
    const body = await super.loadServiceProfile(session, network, id)
    return { ...R.omit(['serviceProfileID'], body), id }
  }

  async createServiceProfile (session, network, body) {
    const props = ['name', 'networkServerID', 'organizationID']
    const { serviceProfileID } = await super.createServiceProfile(session, network, {
      ...R.pick(props, body),
      serviceProfile: R.omit(props, body)
    })
    return { id: serviceProfileID }
  }

  async listServiceProfiles (session, network, params) {
    const body = await super.listServiceProfiles(session, network, params)
    return {
      ...body,
      result: body.result.map(x => ({
        ...R.omit(['serviceProfileID'], x),
        id: x.serviceProfileID
      }))
    }
  }

  replaceServiceProfile (session, network, id, body) {
    return super.replaceServiceProfile(session, network, id, {
      serviceProfile: { ...R.omit(['name', 'id'], body), serviceProfileID: body.id },
      ...R.pick(['name'], body)
    })
  }

  listDevices (session, network, params) {
    const url = `/applications/${params.applicationID}/devices`
    const opts = { url: this.constructUrl({ url, params: R.omit(['applicationID'], params) }) }
    return this.request(network, opts, session)
  }

  createApplicationIntegration (session, network, appId, id, body) {
    return super.createApplicationIntegration(session, network, appId, id, {
      ...R.omit(['uplinkDataURL'], body),
      dataUpURL: body.uplinkDataURL
    })
  }

  replaceApplicationIntegration (session, network, appId, id, body) {
    return super.replaceApplicationIntegration(session, network, appId, id, {
      ...R.omit(['uplinkDataURL'], body),
      dataUpURL: body.uplinkDataURL
    })
  }

  async loadDeviceActivation (session, network, devEUI) {
    const body = await super.loadDeviceActivation(session, network, devEUI)
    return {
      ...R.omit(['fCntDown', 'nwkSKey'], body),
      aFCntDown: body.fCntDown,
      nwkSEncKey: body.nwkSKey
    }
  }

  activateDevice (session, network, devEUI, body) {
    return super.activateDevice(session, network, devEUI, {
      ...R.omit(['aFCntDown', 'nwkSEncKey', 'fNwkSIntKey', 'sNwkSIntKey', 'nFCntDown'], body),
      fCntDown: body.aFCntDown,
      nwkSKey: body.nwkSEncKey,
      skipFCntCheck: false
    })
  }
}
