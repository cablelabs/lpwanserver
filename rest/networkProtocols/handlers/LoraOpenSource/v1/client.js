const LoraOpenSourceRestClient = require('../LoraOpenSourceRestClient')
const R = require('ramda')

module.exports = class LoraOpenSourceV1RestClient extends LoraOpenSourceRestClient {
  async createDeviceProfile (network, body) {
    const props = ['name', 'networkServerID', 'organizationID']
    const { deviceProfileID } = await super.createDeviceProfile(network, {
      ...R.pick(props, body),
      deviceProfile: R.omit(props, body)
    })
    return { id: deviceProfileID }
  }

  async loadDeviceProfile (network, id) {
    const body = await super.loadDeviceProfile(network, id)
    return { ...R.omit(['deviceProfileID'], body), id }
  }

  async listDeviceProfiles (network, params) {
    const body = await super.listDeviceProfiles(network, params)
    return {
      ...body,
      result: body.result.map(x => ({
        ...R.omit(['deviceProfileID'], x),
        id: x.deviceProfileID
      }))
    }
  }

  updateDeviceProfile (network, id, body) {
    return super.updateDeviceProfile(network, id, {
      deviceProfile: { ...R.omit(['name', 'id'], body), deviceProfileID: body.id },
      ...R.pick(['name'], body)
    })
  }

  async loadServiceProfile (network, id) {
    const body = await super.loadServiceProfile(network, id)
    return { ...R.omit(['serviceProfileID'], body), id }
  }

  async createServiceProfile (network, body) {
    const props = ['name', 'networkServerID', 'organizationID']
    const { serviceProfileID } = await super.createServiceProfile(network, {
      ...R.pick(props, body),
      serviceProfile: R.omit(props, body)
    })
    return { id: serviceProfileID }
  }

  async listServiceProfiles (network, params) {
    const body = await super.listServiceProfiles(network, params)
    return {
      ...body,
      result: body.result.map(x => ({
        ...R.omit(['serviceProfileID'], x),
        id: x.serviceProfileID
      }))
    }
  }

  updateServiceProfile (network, id, body) {
    return super.updateServiceProfile(network, id, {
      serviceProfile: { ...R.omit(['name', 'id'], body), serviceProfileID: body.id },
      ...R.pick(['name'], body)
    })
  }

  listDevices (network, appId, params) {
    const url = `/applications/${appId}/devices`
    const opts = { url: this.constructUrl({ url, params }) }
    return this.request(network, opts)
  }

  createApplicationIntegration (network, appId, id, body) {
    return super.createApplicationIntegration(network, appId, id, {
      ...R.omit(['uplinkDataURL'], body),
      dataUpURL: body.uplinkDataURL
    })
  }

  updateApplicationIntegration (network, appId, id, body) {
    return super.updateApplicationIntegration(network, appId, id, {
      ...R.omit(['uplinkDataURL'], body),
      dataUpURL: body.uplinkDataURL
    })
  }

  createDeviceKeys (network, id, body) {
    return super.createDeviceKeys(network, id, {
      devEUI: body.devEUI,
      deviceKeys: {
        appKey: body.appKey
      }
    })
  }

  updateDeviceKeys (network, id, body) {
    return super.updateDeviceKeys(network, id, {
      devEUI: body.devEUI,
      deviceKeys: {
        appKey: body.appKey
      }
    })
  }
}
