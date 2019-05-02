let assert = require('assert')
let chai = require('chai')
let chaiHttp = require('chai-http')
let app = require('../../../restApp.js')
let should = chai.should()
let setup = require('../setup.js')
let appLogger = require('../../../rest/lib/appLogger.js')
let request = require('request')
const Lora1 = require('../networks/lora-v1')
const Lora2 = require('../networks/lora-v2')

chai.use(chaiHttp)
let server = chai.request(app).keepOpen()

describe('E2E Test for Adding a Device to an Existing Application Use Case #190', () => {
  let adminToken
  let appId1
  let anlId1
  let dpId1
  let deviceId1
  let deviceId2
  let dnlId1
  let dnlId2
  let remoteApp1
  let remoteApp2
  let remoteDeviceProfileId
  let remoteDeviceProfileId2

  const appName = 'ADEA'
  const appDescription = 'ADEA Description'
  const companyId = 2
  const reportingProtocolId = 1
  const baseUrl = 'http://localhost:5086'

  const deviceProfile = {
    'networkTypeId': 1,
    'companyId': companyId,
    'name': 'LoRaWeatherNode',
    'description': 'GPS Node that works with LoRa',
    'networkSettings': {
      'name': 'LoRaWeatherNode',
      'macVersion': '1.0.0',
      'regParamsRevision': 'A',
      'supportsJoin': true
    }
  }

  const device = {
    'applicationId': '',
    'name': 'ADEA0001',
    'description': 'GPS Node Model 001',
    'deviceModel': 'Mark1'
  }

  const device2 = {
    'applicationId': '',
    'name': 'ADEA0002',
    'description': 'GPS Node Model 002',
    'deviceModel': 'Mark2'
  }

  const deviceNTL = {
    'deviceId': '',
    'networkTypeId': 1,
    'deviceProfileId': '',
    'networkSettings': {
      'devEUI': '0080000000000201',
      name: device.name,
      deviceKeys: {
        'appKey': '11223344556677889900112233442211'
      }
    }
  }

  const device2NTL = {
    'deviceId': '',
    'networkTypeId': 1,
    'deviceProfileId': '',
    'networkSettings': {
      'devEUI': '0080000000000202',
      name: device2.name,
      deviceKeys: {
        'appKey': '11223344556677889900112233442222'
      }
    }
  }

  before((done) => {
    setup.start()
      .then(() => {
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
  describe('Verify Login and Administration of Users Works', () => {
    it('Admin Login to LPWan Server', (done) => {
      server
        .post('/api/sessions')
        .send({'login_username': 'admin', 'login_password': 'password'})
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          adminToken = res.text
          done()
        })
    })
  })
  describe('Create Application', () => {
    let application =
      {
        'companyId': companyId,
        'name': appName,
        'description': appDescription,
        'baseUrl': baseUrl,
        'reportingProtocolId': reportingProtocolId
      }
    let applicationNetworkSettings = {
      'description': appDescription,
      'name': appName
    }
    it('should return 200 on admin', function (done) {
      server
        .post('/api/applications')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send(application)
        .end(function (err, res) {
          res.should.have.status(200)
          let ret = JSON.parse(res.text)
          appId1 = ret.id
          device.applicationId = appId1
          device2.applicationId = appId1
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/applications/' + appId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          let appObj = JSON.parse(res.text)
          appObj.should.have.property('id')
          appObj.should.have.property('companyId')
          appObj.should.have.property('name')
          appObj.should.have.property('description')
          appObj.should.have.property('baseUrl')
          appObj.should.have.property('reportingProtocolId')

          appObj.companyId.should.equal(companyId)
          appObj.name.should.equal(appName)
          appObj.description.should.equal(appDescription)
          appObj.baseUrl.should.equal(baseUrl)
          appObj.reportingProtocolId.should.equal(reportingProtocolId)

          done()
        })
    })
    it('Create Network Type Links for Application', function (done) {
      server
        .post('/api/applicationNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({
          'applicationId': appId1,
          'networkTypeId': 1,
          'networkSettings': applicationNetworkSettings
        })
        .end(function (err, res) {
          res.should.have.status(200)
          let ret = JSON.parse(res.text)
          anlId1 = ret.id
          done()
        })
    })
    it('should return 200 on get', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks/' + anlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          let appObj = JSON.parse(res.text)
          appLogger.log(appObj)
          done()
        })
    })
  })
  describe('Create Device Profile for Application', () => {
    it('Create Device Profile', function (done) {
      server
        .post('/api/deviceProfiles')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send(deviceProfile)
        .end(function (err, res) {
          res.should.have.status(200)
          let ret = JSON.parse(res.text)
          dpId1 = ret.id
          done()
        })
    })
    it('should return 200 on get', function (done) {
      server
        .get('/api/deviceProfiles/' + dpId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          let dpObj = JSON.parse(res.text)
          dpObj.name.should.equal(deviceProfile.name)
          dpObj.description.should.equal(deviceProfile.description)
          dpObj.networkTypeId.should.equal(deviceProfile.networkTypeId)
          dpObj.companyId.should.equal(deviceProfile.companyId)
          done()
        })
    })
  })
  describe('Create Device for Application', () => {
    it('POST Device', function (done) {
      server
        .post('/api/devices')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send(device)
        .end(function (err, res) {
          appLogger.log(res)
          res.should.have.status(200)
          let ret = JSON.parse(res.text)
          deviceId1 = ret.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/devices/' + deviceId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          let devObj = JSON.parse(res.text)
          appLogger.log(devObj)
          devObj.name.should.equal(device.name)
          devObj.description.should.equal(device.description)
          devObj.deviceModel.should.equal(device.deviceModel)
          done()
        })
    })
    it('Create Device NTL', function (done) {
      deviceNTL.deviceId = deviceId1
      deviceNTL.deviceProfileId = dpId1
      server
        .post('/api/deviceNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send(deviceNTL)
        .end(function (err, res) {
          res.should.have.status(200)
          var dnlObj = JSON.parse(res.text)
          appLogger.log(dnlObj)
          dnlId1 = dnlObj.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/deviceNetworkTypeLinks/' + dnlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var dnlObj = JSON.parse(res.text)
          dnlObj.deviceId.should.equal(deviceNTL.deviceId)
          dnlObj.networkTypeId.should.equal(deviceNTL.networkTypeId)
          dnlObj.deviceProfileId.should.equal(deviceNTL.deviceProfileId)
          done()
        })
    })
  })
  describe('Verify LoRaServer V1 has application', () => {
    it('Verify the LoRaServer V1 Application Exists', async () => {
      const { result } = await Lora1.client.listApplications(Lora1.network)
      const app = result.find(x => x.name === appName)
      should.exist(app)
      remoteApp1 = app.id
    })
    it('Verify the LoRaServer V1 Application Exists', async () => {
      const app = await Lora1.client.loadApplication(Lora1.network, remoteApp1)
      app.should.have.property('id')
      app.should.have.property('name')
      app.should.have.property('description')
      app.should.have.property('organizationID')
      app.should.have.property('serviceProfileID')
      app.should.have.property('payloadCodec')
      app.should.have.property('payloadEncoderScript')
      app.should.have.property('payloadDecoderScript')
      app.name.should.equal(appName)
    })
    it('Verify the LoRaServer V1 Device Profile Exists', async () => {
      const { result } = await Lora1.client.listDeviceProfiles(Lora1.network)
      const dp = result.find(x => x.name === deviceProfile.networkSettings.name)
      remoteDeviceProfileId = dp.id
    })
    it('Verify the LoRaServer V1 Device Profile Exists', async () => {
      const dp = await Lora1.client.loadDeviceProfile(Lora1.network, remoteDeviceProfileId)
      dp.should.have.property('name')
      dp.name.should.equal(deviceProfile.networkSettings.name)
      dp.should.have.property('organizationID')
      dp.should.have.property('networkServerID')
      dp.should.have.property('createdAt')
      dp.should.have.property('updatedAt')
      dp.should.have.property('deviceProfile')
      dp.deviceProfile.should.have.property('macVersion')
      dp.deviceProfile.should.have.property('regParamsRevision')
      dp.deviceProfile.macVersion.should.equal(deviceProfile.networkSettings.macVersion)
      dp.deviceProfile.regParamsRevision.should.equal(deviceProfile.networkSettings.regParamsRevision)
    })
    it('Verify the LoRaServer V1 Device Exists', async () => {
      const device = await Lora1.client.loadDevice(Lora1.network, deviceNTL.networkSettings.devEUI)
      device.should.have.property('name')
      device.should.have.property('devEUI')
      device.should.have.property('applicationID')
      device.should.have.property('description')
      device.should.have.property('deviceProfileID')
      device.should.have.property('deviceStatusBattery')
      device.should.have.property('deviceStatusMargin')
      device.should.have.property('lastSeenAt')
      device.should.have.property('skipFCntCheck')
      device.name.should.equal(deviceNTL.networkSettings.name)
      device.devEUI.should.equal(deviceNTL.networkSettings.devEUI)
      device.deviceProfileID.should.equal(remoteDeviceProfileId)
    })
  })
  describe('Verify LoRaServer V2 has application', function () {
    it('Verify the LoRaServer V2 Application Exists', async () => {
      const { result } = await Lora2.client.listApplications(Lora2.network)
      const app = result.find(x => x.name === appName)
      remoteApp2 = app.id
    })
    it('Verify the LoRaServer V2 Application Exists', async () => {
      const app = await Lora2.client.loadApplication(Lora2.network, remoteApp2)
      app.should.have.property('id')
      app.should.have.property('name')
      app.should.have.property('description')
      app.should.have.property('organizationID')
      app.should.have.property('serviceProfileID')
      app.should.have.property('payloadCodec')
      app.should.have.property('payloadEncoderScript')
      app.should.have.property('payloadDecoderScript')
      app.name.should.equal(appName)
    })
    it('Verify the LoRaServer V2 Device Profile Exists', async () => {
      const { result } = await Lora2.client.listDeviceProfiles(Lora2.network)
      const dp = result.find(x => x.name === deviceProfile.name)
      remoteDeviceProfileId2 = dp.id
    })
    it('Verify the LoRaServer V2 Device Profile Exists', async () => {
      const dp = await Lora2.client.loadDeviceProfile(Lora2.network, remoteDeviceProfileId2)
      dp.should.have.property('name')
      dp.name.should.equal(deviceProfile.networkSettings.name)
      dp.should.have.property('organizationID')
      dp.should.have.property('networkServerID')
      dp.should.have.property('macVersion')
      dp.should.have.property('regParamsRevision')
      dp.macVersion.should.equal(deviceProfile.networkSettings.macVersion)
      dp.regParamsRevision.should.equal(deviceProfile.networkSettings.regParamsRevision)
    })
    it('Verify the LoRaServer V2 Device Exists', async () => {
      const device = await Lora2.client.loadDevice(Lora2.network, deviceNTL.networkSettings.devEUI)
      device.should.have.property('name')
      device.should.have.property('devEUI')
      device.should.have.property('applicationID')
      device.should.have.property('description')
      device.should.have.property('deviceProfileID')
      device.should.have.property('skipFCntCheck')
      device.should.have.property('deviceStatusBattery')
      device.should.have.property('deviceStatusMargin')
      device.should.have.property('lastSeenAt')
      device.name.should.equal(deviceNTL.networkSettings.name)
      device.devEUI.should.equal(deviceNTL.networkSettings.devEUI)
      device.deviceProfileID.should.equal(remoteDeviceProfileId2)
    })
  })
  describe('Create 2nd Device2 for Application', () => {
    it('POST Device2', function (done) {
      server
        .post('/api/devices')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send(device2)
        .end(function (err, res) {
          appLogger.log(res)
          res.should.have.status(200)
          let ret = JSON.parse(res.text)
          deviceId2 = ret.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/devices/' + deviceId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          let devObj = JSON.parse(res.text)
          appLogger.log(devObj)
          devObj.name.should.equal(device2.name)
          devObj.description.should.equal(device2.description)
          devObj.deviceModel.should.equal(device2.deviceModel)
          done()
        })
    })
    it('Create Device2 NTL', function (done) {
      device2NTL.deviceId = deviceId2
      device2NTL.deviceProfileId = dpId1
      server
        .post('/api/deviceNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send(device2NTL)
        .end(function (err, res) {
          res.should.have.status(200)
          var dnlObj = JSON.parse(res.text)
          appLogger.log(dnlObj)
          dnlId2 = dnlObj.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/deviceNetworkTypeLinks/' + dnlId2)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var dnlObj = JSON.parse(res.text)
          dnlObj.deviceId.should.equal(device2NTL.deviceId)
          dnlObj.networkTypeId.should.equal(device2NTL.networkTypeId)
          dnlObj.deviceProfileId.should.equal(device2NTL.deviceProfileId)
          done()
        })
    })
  })
  describe('Verify LoRaServer V1 has 2nd application', function () {
    it('Verify the LoRaServer V1 Application Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/applications?limit=100'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + loraKey
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) {
          done(error)
        }
        else {
          let app = JSON.parse(body)
          app = app.result
          for (let i = 0; i < app.length; i++) {
            if (app[i].name === appName) {
              remoteApp1 = app[i].id
            }
          }
          done()
        }
      })
    })
    it('Verify the LoRaServer V1 Application Exists', async () => {
      const app = await Lora1.client.loadApplication(Lora1.network, remoteApp1)
      app.should.have.property('id')
      app.should.have.property('name')
      app.should.have.property('description')
      app.should.have.property('organizationID')
      app.should.have.property('serviceProfileID')
      app.should.have.property('payloadCodec')
      app.should.have.property('payloadEncoderScript')
      app.should.have.property('payloadDecoderScript')
      app.name.should.equal(appName)
    })
    it('Verify the LoRaServer V1 Device Profile Exists', async () => {
      const { result } = await Lora1.listDeviceProfiles(Lora1.network)
      const dp = result.find(x => x.name === deviceProfile.networkSettings.name)
      remoteDeviceProfileId = dp.id
    })
    it('Verify the LoRaServer V1 Device Profile Exists', async () => {
      const dp = await Lora1.loadDeviceProfile(Lora1.network, remoteDeviceProfileId)
      dp.should.have.property('name')
      dp.name.should.equal(deviceProfile.networkSettings.name)
      dp.should.have.property('organizationID')
      dp.should.have.property('networkServerID')
      dp.should.have.property('createdAt')
      dp.should.have.property('updatedAt')
      dp.should.have.property('deviceProfile')
      dp.deviceProfile.should.have.property('macVersion')
      dp.deviceProfile.should.have.property('regParamsRevision')
      dp.deviceProfile.macVersion.should.equal(deviceProfile.networkSettings.macVersion)
      dp.deviceProfile.regParamsRevision.should.equal(deviceProfile.networkSettings.regParamsRevision)
    })
    it('Verify the LoRaServer V1 2nd Device Exists', async () => {
      const device = await Lora1.loadDevice(Lora1.network, device2NTL.networkSettings.devEUI)
      device.should.have.property('name')
      device.should.have.property('devEUI')
      device.should.have.property('applicationID')
      device.should.have.property('description')
      device.should.have.property('deviceProfileID')
      device.should.have.property('deviceStatusBattery')
      device.should.have.property('deviceStatusMargin')
      device.should.have.property('lastSeenAt')
      device.should.have.property('skipFCntCheck')
      device.name.should.equal(device2NTL.networkSettings.name)
      device.devEUI.should.equal(device2NTL.networkSettings.devEUI)
      device.deviceProfileID.should.equal(remoteDeviceProfileId)
    })
  })
  describe('Verify LoRaServer V2 has 2nd application', function () {
    it('Verify the LoRaServer V2 Application Exists', async () => {
      const { result } = await Lora2.client.listApplications(Lora2.network)
      const app = result.find(x => x.name === appName)
      remoteApp2 = app.id
    })
    it('Verify the LoRaServer V2 Application Exists', async () => {
      const app = await Lora2.client.loadApplication(Lora2.network, remoteApp2)
      app.should.have.property('id')
      app.should.have.property('name')
      app.should.have.property('description')
      app.should.have.property('organizationID')
      app.should.have.property('serviceProfileID')
      app.should.have.property('payloadCodec')
      app.should.have.property('payloadEncoderScript')
      app.should.have.property('payloadDecoderScript')
      app.name.should.equal(appName)
    })
    it('Verify the LoRaServer V2 Device Profile Exists', async () => {
      const { result } = await Lora2.listDeviceProfiles(Lora2.network)
      const dp = result.find(x => x.name === deviceProfile.name)
      remoteDeviceProfileId2 = dp.id
    })
    it('Verify the LoRaServer V2 Device Profile Exists', async () => {
      const dp = await Lora2.loadDeviceProfile(Lora2.network, remoteDeviceProfileId2)
      dp.should.have.property('name')
      dp.name.should.equal(deviceProfile.networkSettings.name)
      dp.should.have.property('organizationID')
      dp.should.have.property('networkServerID')
      dp.should.have.property('macVersion')
      dp.should.have.property('regParamsRevision')
      dp.macVersion.should.equal(deviceProfile.networkSettings.macVersion)
      dp.regParamsRevision.should.equal(deviceProfile.networkSettings.regParamsRevision)
    })
    it('Verify the LoRaServer V2 2nd Device Exists', async () => {
      const device = await Lora2.loadDevice(Lora2.network, device2NTL.networkSettings.devEUI)
      device.should.have.property('name')
      device.should.have.property('devEUI')
      device.should.have.property('applicationID')
      device.should.have.property('description')
      device.should.have.property('deviceProfileID')
      device.should.have.property('skipFCntCheck')
      device.should.have.property('deviceStatusBattery')
      device.should.have.property('deviceStatusMargin')
      device.should.have.property('lastSeenAt')
      device.name.should.equal(device2NTL.networkSettings.name)
      device.devEUI.should.equal(device2NTL.networkSettings.devEUI)
      device.deviceProfileID.should.equal(remoteDeviceProfileId2)
    })
  })
})
