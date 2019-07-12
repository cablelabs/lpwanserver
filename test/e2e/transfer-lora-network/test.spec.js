const assert = require('assert')
const { createLpwanClient } = require('../../clients/lpwan')
const Lora1 = require('./lora1')
const { network: Lora1Network } = require('../../clients/lora-server1')
const { network: Lora2Network } = require('../../clients/lora-server2')
const { createLoraServer2Client } = require('../../clients/lora-server2')
const { prisma } = require('../../../prisma/generated/prisma-client')
const R = require('ramda')

const Lpwan = createLpwanClient()
const Lora2 = createLoraServer2Client()

function verifyAbpDeviceNtl (devNtl, removeDevActivation) {
  const da = devNtl.networkSettings.deviceActivation
  const props = ['devAddr', 'appSKey', 'fCntUp', 'fCntDown', 'nwkSKey', 'skipFCntCheck']
  props.forEach(prop => {
    const msg = `Invalid ${prop} value for ABP deviceNtl. Expected ${removeDevActivation[prop]} received ${da[prop]}`
    assert.strictEqual(da[prop], removeDevActivation[prop], msg)
  })
}

describe.only('Transfer Lora Server v1 network to Lora Server v2', () => {
  let networkTypeId

  before(async () => {
    await Lora1.seedData()
    await Lpwan.client.login({
      data: { login_username: 'admin', login_password: 'password' }
    })
    const nwkType = await prisma.networkType({ name: 'LoRa' })
    networkTypeId = nwkType.id
  })

  describe('Create Lora Server v1 network', () => {
    let protocolId
    let network

    it('Verify LoraOS 1.0 Protocol Exists', async () => {
      const params = { search: 'LoRa Server', networkProtocolVersion: '1.0' }
      const res = await Lpwan.client.list('networkProtocols', {}, { params })
      assert.strictEqual(res.status, 200)
      assert.strictEqual(res.data.totalCount, 1)
      protocolId = res.data.records[0].id
    })
    it('Create the Local LoraOS 1.0 Network', async () => {
      network = {
        'name': 'transfer_lora_network_v1',
        'networkTypeId': networkTypeId,
        'baseUrl': Lora1Network.baseUrl,
        'networkProtocolId': protocolId,
        'securityData': { authorized: false, ...Lora1Network.securityData }
      }
      const res = await Lpwan.client.create('networks', {}, { data: network })
      assert.strictEqual(res.status, 201)
      network.id = res.data.id
    })
    it('Get Network', async () => {
      const res = await Lpwan.client.load('networks', network)
      assert.strictEqual(res.status, 200)
      assert.strictEqual(res.data.name, network.name)
    })
  })

  describe('Verify data pulled from Lora Server v1', () => {
    it('Verify Device Profiles', async () => {
      const promises = Lora1.cache.DeviceProfile.map(async lora1Dp => {
        const params = { search: lora1Dp.name }
        const res = await Lpwan.client.list('deviceProfiles', {}, { params })
        assert.strictEqual(res.status, 200)
        let [dp] = res.data.records
        assert.ok(dp, 'No DeviceProfile found.')
        assert.strictEqual(dp.networkSettings.macVersion, lora1Dp.macVersion)
        assert.strictEqual(dp.networkSettings.supportsJoin, lora1Dp.supportsJoin)
      })
      return Promise.all(promises)
    })
    it('Verify Application', async () => {
      const lora1App = Lora1.cache.Application[0]
      const lora1HttpIntegration = Lora1.cache.Integration[0]
      const params = { search: lora1App.name }
      const res = await Lpwan.client.list('applications', {}, { params })
      assert.strictEqual(res.status, 200)
      let [app] = res.data.records
      assert.ok(app, 'No Application found.')
      assert.strictEqual(app.description, lora1App.description)
      assert.strictEqual(app.baseUrl, lora1HttpIntegration.uplinkDataURL)
    })
    it('Verify Devices', async () => {
      const names = Lora1.cache.Device.map(R.prop('name'))
      const descriptions = Lora1.cache.Device.map(R.prop('description'))
      const localApp = Lpwan.cache.applications[0]
      const params = { applicationId: localApp.id, limit: 100 }
      const res = await Lpwan.client.list('devices', {}, { params })
      assert.strictEqual(res.status, 200)
      assert.strictEqual(res.data.totalCount, 2)
      res.data.records.forEach(rec => {
        assert.ok(names.includes(rec.name))
        assert.ok(descriptions.includes(rec.description))
      })
    })
    it('Verify ApplicationNetworkTypeLink', async () => {
      const localApp = Lpwan.cache.applications[0]
      const lora1App = Lora1.cache.Application[0]
      const params = { applicationId: localApp.id }
      const res = await Lpwan.client.list('applicationNetworkTypeLinks', {}, { params })
      assert.strictEqual(res.status, 200)
      let [appNtl] = res.data.records
      assert.ok(appNtl, 'No ApplicationNetworkTypeLink found.')
      assert.strictEqual(lora1App.payloadCodec, appNtl.networkSettings.payloadCodec)
      assert.strictEqual(lora1App.payloadDecoderScript, appNtl.networkSettings.payloadDecoderScript)
      assert.strictEqual(lora1App.payloadEncoderScript, appNtl.networkSettings.payloadEncoderScript)
    })
    it('Verify DeviceNetworkTypeLinks', () => {
      const promises = Lpwan.cache.devices.map(async dev => {
        let lora1Dev = Lora1.cache.Device.find(x => x.name === dev.name)
        const params = { deviceId: dev.id, limit: 1 }
        const res = await Lpwan.client.list('deviceNetworkTypeLinks', {}, { params })
        assert.strictEqual(res.status, 200)
        const [devNtl] = res.data.records
        assert.strictEqual(devNtl.networkSettings.devEUI, lora1Dev.devEUI)
        assert.strictEqual(devNtl.networkSettings.skipFCntCheck, lora1Dev.skipFCntCheck)
        if (dev.name.includes('abp')) {
          const remoteDevAct = Lora1.cache.DeviceActivation.find(x => x.devEUI === devNtl.networkSettings.devEUI)
          verifyAbpDeviceNtl(devNtl, remoteDevAct)
        }
        else {
          const remoteDevKeys = Lora1.cache.DeviceKey.find(x => x.devEUI === lora1Dev.devEUI)
          assert.strictEqual(remoteDevKeys.appKey, devNtl.networkSettings.deviceKeys.nwkKey)
        }
      })
      return Promise.all(promises)
    })
  })

  describe('Create Lora Server v2 network', () => {
    let protocolId
    let network

    it('Verify LoraOS 2.0 Protocol Exists', async () => {
      const params = { search: 'LoRa Server', networkProtocolVersion: '2.0' }
      const res = await Lpwan.client.list('networkProtocols', {}, { params })
      assert.strictEqual(res.status, 200)
      assert.strictEqual(res.data.totalCount, 1)
      protocolId = res.data.records[0].id
    })
    it('Create the Local LoraOS 2.0 Network', async () => {
      network = {
        'name': 'transfer_lora_network_v2',
        'networkTypeId': networkTypeId,
        'baseUrl': Lora2Network.baseUrl,
        'networkProtocolId': protocolId,
        'securityData': { authorized: false, ...Lora2Network.securityData }
      }
      const res = await Lpwan.client.create('networks', {}, { data: network })
      assert.strictEqual(res.status, 201)
      network.id = res.data.id
    })
    it('Get Network', async () => {
      const res = await Lpwan.client.load('networks', network)
      assert.strictEqual(res.status, 200)
      assert.strictEqual(res.data.name, network.name)
    })
  })

  describe('Verify data pushed to Lora Server v2', () => {
    it('Verify Device Profiles', async () => {
      let res = await Lora2.client.listDeviceProfiles()
      const lora2Dps = res.data.result
      assert.strictEqual(res.status, 200)
      const promises = Lora1.cache.DeviceProfile.map(async lora1Dp => {
        const dp = lora2Dps.find(x => x.name === lora1Dp.name)
        assert.ok(dp, 'No DeviceProfile found.')
        assert.strictEqual(dp.macVersion, lora1Dp.macVersion)
        assert.strictEqual(dp.supportsJoin, lora1Dp.supportsJoin)
      })
      return Promise.all(promises)
    })
  })
})
