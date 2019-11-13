const assert = require('assert')
const { createLpwanClient } = require('../../clients/lpwan')
const Lora1 = require('../../clients/lora-server1')
const Lora2 = require('../../clients/lora-server2')
const { seedData } = require('./setup')
const { prisma } = require('../../../../app/generated/prisma-client')
const R = require('ramda')

const Lpwan = createLpwanClient()

describe('Transfer Lora Server v1 network to Lora Server v2', () => {
  let networkTypeId

  before(async () => {
    await Promise.all([
      seedData(),
      Lpwan.client.login({
        data: { username: 'admin', password: 'password' }
      })
    ])
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
        'baseUrl': Lora1.network.baseUrl,
        'networkProtocolId': protocolId,
        'securityData': { authorized: false, ...Lora1.network.securityData },
        networkSettings: {
          organizationID: Lora1.cache.Organization[1].id,
          networkServerID: Lora1.cache.NetworkServer[0].id,
          serviceProfileID: Lora1.cache.ServiceProfile[1].id
        }
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
      const app = Lpwan.cache.applications[0]
      const params = { applicationId: app.id, limit: 100 }
      const res = await Lpwan.client.list('devices', {}, { params })
      assert.strictEqual(res.status, 200)
      assert.strictEqual(res.data.totalCount, 2)
      res.data.records.forEach(rec => {
        assert.ok(names.includes(rec.name))
        assert.ok(descriptions.includes(rec.description))
      })
    })
    it('Verify ApplicationNetworkTypeLink', async () => {
      const app = Lpwan.cache.applications[0]
      const lora1App = Lora1.cache.Application[0]
      const params = { applicationId: app.id }
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
        const ns = devNtl.networkSettings
        assert.strictEqual(ns.devEUI, lora1Dev.devEUI)
        assert.strictEqual(ns.skipFCntCheck, lora1Dev.skipFCntCheck)
        if (dev.name.includes('abp')) {
          const remoteDevAct = Lora1.cache.DeviceActivation.find(x => x.devEUI === ns.devEUI)
          assert.strictEqual(ns.deviceActivation.devAddr, remoteDevAct.devAddr)
          assert.strictEqual(ns.deviceActivation.appSKey, remoteDevAct.appSKey)
          assert.strictEqual(ns.deviceActivation.fCntUp, remoteDevAct.fCntUp)
          assert.strictEqual(ns.deviceActivation.aFCntDown, remoteDevAct.fCntDown)
          assert.strictEqual(ns.deviceActivation.fNwkSIntKey, remoteDevAct.nwkSKey)
          assert.strictEqual(ns.deviceActivation.skipFCntCheck, remoteDevAct.skipFCntCheck)
        }
        else {
          const remoteDevKeys = Lora1.cache.DeviceKey.find(x => x.devEUI === lora1Dev.devEUI)
          console.log(JSON.stringify(remoteDevKeys))
          assert.strictEqual(remoteDevKeys.appKey, ns.deviceKeys.appKey)
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
        'baseUrl': Lora2.network.baseUrl,
        'networkProtocolId': protocolId,
        'securityData': { authorized: false, ...Lora2.network.securityData },
        networkSettings: {
          organizationID: Lora2.cache.Organization[1].id,
          networkServerID: Lora2.cache.NetworkServer[0].id,
          serviceProfileID: Lora2.cache.ServiceProfile[1].id
        }
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
      let res = await Lora2.client.listDeviceProfiles({
        organizationID: Lora2.cache.Organization[0].id,
        limit: 20
      })
      Lora2.cache.DeviceProfile = res.result
      const promises = Lora1.cache.DeviceProfile.map(async lora1Dp => {
        let dp = res.result.find(x => x.name === lora1Dp.name)
        assert.ok(dp, 'No DeviceProfile found.')
        dp = await Lora2.client.loadDeviceProfile(dp.id)
        Lora2.cache.DeviceProfile = [
          ...Lora2.cache.DeviceProfile.filter(x => x.id !== dp.id),
          dp
        ]
        assert.strictEqual(dp.macVersion, lora1Dp.macVersion)
        assert.strictEqual(dp.supportsJoin, lora1Dp.supportsJoin)
      })
      return Promise.all(promises)
    })
    it('Verify Application', async () => {
      let res = await Lora2.client.listApplications({
        organizationID: Lora2.cache.Organization[0].id,
        limit: 20
      })
      const lora1App = Lora1.cache.Application[0]
      let lora2App = res.result.find(x => x.name === lora1App.name)
      assert.ok(lora2App)
      lora2App = await Lora2.client.loadApplication(lora2App.id)
      Lora2.cache.Application = [lora2App]
      assert.strictEqual(lora2App.description, lora1App.description)
      assert.strictEqual(lora2App.payloadCodec, lora1App.payloadCodec)
      assert.strictEqual(lora2App.payloadDecoderScript, lora1App.payloadDecoderScript)
      assert.strictEqual(lora2App.payloadEncoderScript, lora1App.payloadEncoderScript)
    })
    it('Verify Devices', async () => {
      const [lora2App] = Lora2.cache.Application
      let res = await Lora2.client.listDevices(lora2App.id, { limit: 20 })
      const promises = Lora1.cache.Device.map(async lora1Dev => {
        let lora2Dev = res.result.find(x => x.devEUI === lora1Dev.devEUI)
        assert.ok(lora2Dev)
        lora2Dev = await Lora2.client.loadDevice(lora2Dev.devEUI)
        assert.strictEqual(lora2Dev.name, lora1Dev.name)
        assert.strictEqual(lora2Dev.description, lora1Dev.description)
        assert.strictEqual(lora2Dev.skipFCntCheck, lora1Dev.skipFCntCheck)
        const dp = Lora2.cache.DeviceProfile.find(x => x.id === lora2Dev.deviceProfileID)
        assert.strictEqual(dp.supportsJoin, lora2Dev.name.includes('otaa'))
        if (lora2Dev.name.includes('abp')) {
          const lora2DevAct = await Lora2.client.loadDeviceActivation(lora2Dev.devEUI)
          const lora1DevAct = Lora1.cache.DeviceActivation[0]
          assert.strictEqual(lora2DevAct.devAddr, lora1DevAct.devAddr)
          assert.strictEqual(lora2DevAct.appSKey, lora1DevAct.appSKey)
          assert.strictEqual(lora2DevAct.fNwkSIntKey, lora1DevAct.nwkSKey)
          assert.strictEqual(lora2DevAct.aFCntDown, lora1DevAct.fCntDown)
          assert.strictEqual(lora2DevAct.fCntUp, lora1DevAct.fCntUp)
        }
        else {
          const lora2DevKeys = await Lora2.client.loadDeviceKeys(lora2Dev.devEUI)
          const lora1DevKeys = Lora1.cache.DeviceKey[0]
          assert.strictEqual(lora2DevKeys.nwkKey, lora1DevKeys.appKey)
        }
      })
      return Promise.all(promises)
    })
  })
})
