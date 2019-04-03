const LoraOpenSourceRestClient = require('../LoraOpenSourceRestClient')
const R = require('ramda')

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

  updateDeviceProfile (session, network, id, body) {
    return super.updateDeviceProfile(session, network, id, {
      deviceProfile: { ...R.omit(['name', 'id'], body), deviceProfileID: body.id },
      ...R.pick(['name'], body)
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

  updateServiceProfile (session, network, id, body) {
    return super.updateServiceProfile(session, network, id, {
      serviceProfile: { ...R.omit(['name', 'id'], body), serviceProfileID: body.id },
      ...R.pick(['name'], body)
    })
  }

  listDevices (session, network, appId, params) {
    const url = `/applications/${appId}/devices`
    const opts = { url: this.constructUrl({ url, params }) }
    return this.request(network, opts, session)
  }

  createApplicationIntegration (session, network, appId, id, body) {
    return super.createApplicationIntegration(session, network, appId, id, {
      ...R.omit(['uplinkDataURL'], body),
      dataUpURL: body.uplinkDataURL
    })
  }

  updateApplicationIntegration (session, network, appId, id, body) {
    return super.updateApplicationIntegration(session, network, appId, id, {
      ...R.omit(['uplinkDataURL'], body),
      dataUpURL: body.uplinkDataURL
    })
  }

  createDeviceKeys (session, network, id, body) {
    return super.createDeviceKeys(session, network, id, {
      devEUI: body.devEUI,
      deviceKeys: {
        appKey: body.appKey
      }
    })
  }
}
