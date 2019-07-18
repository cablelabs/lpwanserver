const assert = require('assert')
const { createLpwanClient, nbIotDeviceAgent } = require('../../clients/lpwan')
const Lora2 = require('../../clients/lora-server2')
const cryptoRandomString = require('crypto-random-string')
const axios = require('axios')
// const R = require('ramda')

const Lpwan = createLpwanClient()

function cacheInsert (item, list = []) {
  return [
    ...list.filter(x => x.id !== item.id),
    item
  ]
}

async function createResource (resource, data, status = 200) {
  const res = await Lpwan.client.create(resource, {}, { data })
  assert.strictEqual(res.status, status)
  Lpwan.cache[resource] = cacheInsert({ ...data, ...res.data }, Lpwan.cache[resource])
  return res
}

describe('Manage a device model that supports multiple network types', () => {
  const {
    APP_SERVER_URL
  } = process.env

  const ipDeviceProfileName = 'multi_type_devices_dp_ip'
  const loraDeviceProfileName = 'multi_type_devices_dp_lora'
  const appName = 'multi_type_devices_app'
  const deviceName = 'multi_type_devices_dev'
  const networkName = 'multi_type_devices_nwk'
  const uplinkPath = '/multi-type-devices-uplinks'
  const appBaseUrl = `${APP_SERVER_URL}${uplinkPath}`

  let loraNwkType
  let ipNwkType
  let appId
  let deviceId
  let loraAppId

  before(async () => {
    await Lpwan.client.login({
      data: { login_username: 'admin', login_password: 'password' }
    })
    await Promise.all([
      Lpwan.client.list('networkTypes', {}),
      Lpwan.client.list('companies', {}),
      Lpwan.client.list('reportingProtocols', {})
    ])
    loraNwkType = Lpwan.cache.networkTypes.find(x => x.name === 'LoRa')
    ipNwkType = Lpwan.cache.networkTypes.find(x => x.name === 'IP')
  })

  describe('Create Lora Server v2 network', () => {
    let protocolId

    it('Verify LoraOS 2.0 Protocol Exists', async () => {
      const params = { search: 'LoRa Server', networkProtocolVersion: '2.0' }
      const res = await Lpwan.client.list('networkProtocols', {}, { params })
      assert.strictEqual(res.status, 200)
      assert.strictEqual(res.data.totalCount, 1)
      protocolId = res.data.records[0].id
    })
    it('Create the Local LoraOS 2.0 Network', () => createResource('networks', {
      name: networkName,
      networkTypeId: loraNwkType.id,
      baseUrl: Lora2.network.baseUrl,
      networkProtocolId: protocolId,
      securityData: { authorized: false, ...Lora2.network.securityData }
    }, 201))
  })

  describe('Add Device Profiles', () => {
    it('Create IP DeviceProfile', () => createResource('deviceProfiles', {
      networkTypeId: ipNwkType.id,
      companyId: Lpwan.cache.companies[0].id,
      name: ipDeviceProfileName,
      description: `${ipDeviceProfileName} description`,
      networkSettings: {}
    }))
    it('Create LoRa DeviceProfile', () => createResource('deviceProfiles', {
      networkTypeId: loraNwkType.id,
      companyId: Lpwan.cache.companies[0].id,
      name: loraDeviceProfileName,
      description: `${loraDeviceProfileName} description`,
      networkSettings: {}
    }))
  })

  describe('Create Application and ApplicationNetworkTypeLinks', () => {
    it('Create Application', async () => {
      const res = await createResource('applications', {
        companyId: Lpwan.cache.companies[0].id,
        name: appName,
        description: `${appName} description`,
        baseUrl: appBaseUrl,
        reportingProtocolId: Lpwan.cache.reportingProtocols[0].id
      })
      appId = res.data.id
    })
    it('Create IP ApplicationNetworkTypeLink', () => createResource('applicationNetworkTypeLinks', {
      applicationId: appId,
      networkTypeId: ipNwkType.id,
      networkSettings: {}
    }))
    it('Create LoRa ApplicationNetworkTypeLink', () => createResource('applicationNetworkTypeLinks', {
      applicationId: appId,
      networkTypeId: loraNwkType.id,
      networkSettings: {}
    }))
    it('Confirm application is on LoRa Server', async () => {
      const localApp = Lpwan.cache.applications.find(x => x.name === appName)
      const res = await Lora2.client.listApplications({ search: appName, limit: 1 })
      assert.strictEqual(res.totalCount, '1')
      let [app] = res.result
      assert.ok(app)
      assert.strictEqual(app.name, localApp.name)
      assert.strictEqual(app.description, localApp.description)
      loraAppId = app.id
    })
  })

  describe('Create a Device', () => {
    it('Create Device', async () => {
      const res = await createResource('devices', {
        applicationId: appId,
        name: deviceName,
        description: `${deviceName} description`,
        deviceModel: 'A'
      })
      deviceId = res.data.id
    })
    it('Create IP DeviceNetworkTypeLink', () => createResource('deviceNetworkTypeLinks', {
      deviceId,
      networkTypeId: ipNwkType.id,
      deviceProfileId: Lpwan.cache.deviceProfiles.find(x => x.name === ipDeviceProfileName).id,
      networkSettings: { devEUI: '1122334455667788' }
    }))
    it('Create LoRa DeviceNetworkTypeLink', () => createResource('deviceNetworkTypeLinks', {
      deviceId,
      networkTypeId: loraNwkType.id,
      deviceProfileId: Lpwan.cache.deviceProfiles.find(x => x.name === loraDeviceProfileName).id,
      networkSettings: { devEUI: cryptoRandomString({ length: 16 }) }
    }))
    it('Confirm Device is on LoRa Server', async () => {
      const localDevice = Lpwan.cache.devices.find(x => x.name === deviceName)
      const res = await Lora2.client.listDevices(loraAppId, { limit: 1 })
      assert.strictEqual(res.totalCount, '1')
      let [device] = res.result
      assert.ok(device)
      assert.strictEqual(device.name, localDevice.name)
      assert.strictEqual(device.description, localDevice.description)
    })
    it('Confirm LoRa DeviceProfile is on LoRa Server', async () => {
      const loraLocalDp = Lpwan.cache.deviceProfiles.find(x => x.name === loraDeviceProfileName)
      const res = await Lora2.client.listDeviceProfiles({ limit: 20 })
      Lora2.cache.deviceProfiles = res.result
      assert.ok(res)
      let dp = Lora2.cache.deviceProfiles.find(x => x.name === loraDeviceProfileName)
      assert.ok(dp)
      assert.strictEqual(dp.name, loraLocalDp.name)
    })
  })

  describe('Send Device Uplinks', () => {
    let app
    let network
    before(() => {
      app = Lpwan.cache.applications.find(x => x.name === appName)
      network = Lpwan.cache.networks.find(x => x.name === networkName)
    })
    it('Confirm Lora Server Application Integration', async () => {
      const uplinkDataURL = `${process.env.LPWANSERVER_URL}/api/ingest/${app.id}/${network.id}`
      const res = await Lora2.client.loadApplicationIntegration(loraAppId, 'http')
      assert.strictEqual(res.uplinkDataURL, uplinkDataURL)
    })
    it('Send an uplink as the Lora Server', async () => {
      const data = { msgId: 'multi_type_devices_msg_1_lora' }
      const res = await Lpwan.client.create('uplinks', { applicationId: app.id, networkId: network.id }, { data })
      assert.strictEqual(res.status, 204)
    })
    it('Send an uplink as an IP device', async () => {
      const opts = {
        data: { msgId: 'multi_type_devices_msg_1_ip' },
        useSession: false,
        httpsAgent: nbIotDeviceAgent
      }
      const res = await Lpwan.client.create('ip-device-uplinks', {}, opts)
      assert.strictEqual(res.status, 204)
    })
    it('Confirm app server received uplinks', async () => {
      const opts = {
        url: `${APP_SERVER_URL}/requests`,
        params: { method: 'POST', path: uplinkPath }
      }
      const res = await axios(opts)
      console.log(res.data)
      assert.strictEqual(res.data.length, 2)
    })
  })
})
