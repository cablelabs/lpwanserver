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
  let deviceId
  let loraAppId
  let app
  let network

  before(async () => {
    await Lpwan.client.login({
      data: { username: 'admin', password: 'password' }
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
    it('Create the Local LoraOS 2.0 Network', async () => {
      await createResource('networks', {
        name: networkName,
        networkTypeId: loraNwkType.id,
        baseUrl: Lora2.network.baseUrl,
        networkProtocolId: protocolId,
        securityData: { authorized: false, ...Lora2.network.securityData }
      }, 201)
      network = Lpwan.cache.networks[0]
    })
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
      networkSettings: {
        macVersion: '1.1.0'
      }
    }))
  })

  describe('Create Application and ApplicationNetworkTypeLinks', () => {
    it('Create Application', async () => {
      await createResource('applications', {
        companyId: Lpwan.cache.companies[0].id,
        name: appName,
        description: `${appName} description`,
        baseUrl: appBaseUrl,
        reportingProtocolId: Lpwan.cache.reportingProtocols[0].id
      })
      app = Lpwan.cache.applications[0]
    })
    it('Create IP ApplicationNetworkTypeLink', () => createResource('applicationNetworkTypeLinks', {
      applicationId: app.id,
      networkTypeId: ipNwkType.id,
      networkSettings: {}
    }))
    it('Create LoRa ApplicationNetworkTypeLink', () => createResource('applicationNetworkTypeLinks', {
      applicationId: app.id,
      networkTypeId: loraNwkType.id,
      networkSettings: {}
    }))
    it('Confirm application is on LoRa Server', async () => {
      const res = await Lora2.client.listApplications({ search: appName, limit: 1 })
      assert.strictEqual(res.totalCount, '1')
      let [remoteApp] = res.result
      assert.ok(app)
      assert.strictEqual(remoteApp.name, app.name)
      assert.strictEqual(remoteApp.description, app.description)
      loraAppId = remoteApp.id
    })
  })

  describe('Create a Device', () => {
    it('Create Device', async () => {
      const res = await createResource('devices', {
        applicationId: app.id,
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
    it('Create LoRa DeviceNetworkTypeLink', async () => {
      const devEUI = cryptoRandomString({ length: 16 })
      await createResource('deviceNetworkTypeLinks', {
        deviceId,
        networkTypeId: loraNwkType.id,
        deviceProfileId: Lpwan.cache.deviceProfiles.find(x => x.name === loraDeviceProfileName).id,
        networkSettings: {
          devEUI,
          deviceActivation: {
            appSKey: cryptoRandomString({ length: 32 }),
            devAddr: cryptoRandomString({ length: 8 }),
            devEUI,
            fCntDown: 0,
            fCntUp: 0,
            fNwkSIntKey: cryptoRandomString({ length: 32 }),
            nwkSEncKey: cryptoRandomString({ length: 32 }),
            sNwkSIntKey: cryptoRandomString({ length: 32 }),
            skipFCntCheck: true
          }
        }
      })
    })
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
    it('Confirm Lora Server Application Integration', async () => {
      const uplinkDataURL = `${process.env.LPWANSERVER_URL}/api/ingest/${app.id}/${network.id}`
      const res = await Lora2.client.loadApplicationIntegration(loraAppId, 'http')
      assert.strictEqual(res.uplinkDataURL, uplinkDataURL)
    })
    it('Send an uplink as the Lora Server', async () => {
      const data = { msgId: 'multi_type_devices_uplink_lora' }
      const res = await Lpwan.client.create('uplinks', { applicationId: app.id, networkId: network.id }, { data })
      assert.strictEqual(res.status, 204)
    })
    it('Send an uplink as an IP device', async () => {
      const opts = {
        data: { msgId: 'multi_type_devices_uplink_ip' },
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
      assert.strictEqual(res.data.length, 2)
    })
  })

  describe('Send downlink to devices', () => {
    const downlink = { data: cryptoRandomString({ length: 8 }), fCnt: 0, fPort: 1 }
    it('Create downlink', async () => {
      const res = await Lpwan.client.create('deviceDownlinks', { id: deviceId }, { data: downlink })
      assert.strictEqual(res.status, 200)
    })
    it('Confirm downlink was received by Lora Server', async () => {
      const devNtl = Lpwan.cache.deviceNetworkTypeLinks.find(x => x.deviceId === deviceId && x.networkTypeId === loraNwkType.id)
      const res = await Lora2.client.listDeviceMessages(devNtl.networkSettings.devEUI)
      assert.strictEqual(res.result.length, 1)
      const [msg] = res.result
      assert.deepStrictEqual(msg.data, downlink.data)
      assert.strictEqual(msg.fCnt, downlink.fCnt)
    })
    it('Confirm downlink is available to IP devices', async () => {
      const opts = { httpsAgent: nbIotDeviceAgent }
      const res = await Lpwan.client.list('ip-device-downlinks', {}, opts)
      assert.deepStrictEqual(res.data[0], downlink)
    })
  })

  describe('Remove LoRa ApplicationNetworkTypeLink', () => {
    it('Remove ApplicationNetworkTypeLink', async () => {
      const appNtl = Lpwan.cache.applicationNetworkTypeLinks.find(x => x.networkTypeId === loraNwkType.id)
      let res = await Lpwan.client.remove('applicationNetworkTypeLinks', { id: appNtl.id })
      assert.strictEqual(res.status, 200)
    })
    it('Confirm Application is not on Lora Server', async () => {
      const res = await Lora2.client.listApplications({ search: appName, limit: 1 })
      assert.strictEqual(res.totalCount, '0')
    })
    it('Confirm Device is not on LoRa Server', async () => {
      const res = await Lora2.client.listDevices(loraAppId, { limit: 1 })
      assert.strictEqual(res.totalCount, '0')
    })
  })
})
