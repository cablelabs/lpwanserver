/* eslint-disable no-unused-vars */
let chai = require('chai')
let chaiHttp = require('chai-http')
const { createApp } = require('../../../app/express-app')
let should = chai.should()
let setup = require('../setup.js')
const Lora1 = require('../../networks/lora-v1')
const Lora2 = require('../../networks/lora-v2')
const { prisma } = require('../../../app/generated/prisma-client')

chai.use(chaiHttp)
let server

describe('E2E Test for Updating an Application Use Case #189', () => {
  let companyId
  let reportingProtocolId
  let networkTypeId

  let adminToken
  let appId1
  let anlId1
  let dpId1
  let deviceId1
  let dnlId1
  let remoteApp1
  let remoteApp2
  let remoteDeviceProfileId
  let remoteDeviceProfileId2

  const appName = 'UPAP'
  const appDescription = 'UPAP Description'
  const appDescriptionUpdate = 'UPAP New Description'
  const baseUrl = 'http://localhost:5086'

  const device = {
    'applicationId': '',
    'name': 'UPAP001',
    'description': 'Soil Node Model 001',
    'deviceModel': 'Mark1'
  }

  let deviceProfile
  let deviceNTL
  let application
  let applicationUpdate

  before(async () => {
    const app = await createApp()
    server = chai.request(app).keepOpen()
    const cos = await prisma.companies({ first: 1 })
    companyId = cos[0].id
    const reportingProtocols = await prisma.reportingProtocols({ first: 1 })
    reportingProtocolId = reportingProtocols[0].id
    const nwkTypes = await prisma.networkTypes({ first: 1 })
    networkTypeId = nwkTypes[0].id
    await setup.start()

    deviceProfile = {
      'networkTypeId': networkTypeId,
      'companyId': companyId,
      'name': 'LoRaSoilReaderA',
      'description': 'Soil Sensor that works with LoRa',
      'networkSettings': {
        'name': 'LoRaSoilReaderA',
        'macVersion': '1.0.0',
        'regParamsRevision': 'A',
        'supportsJoin': true
      }
    }

    deviceNTL = {
      'deviceId': '',
      'networkTypeId': networkTypeId,
      'deviceProfileId': '',
      'networkSettings': {
        'devEUI': '0080000000000401',
        name: device.name,
        deviceKeys: {
          'appKey': '11223344556677889900112233444411'
        }
      }
    }

    application = {
      'companyId': companyId,
      'name': appName,
      'description': appDescription,
      'baseUrl': baseUrl,
      'reportingProtocolId': reportingProtocolId
    }

    applicationUpdate = {
      'companyId': companyId,
      'name': appName,
      'description': appDescriptionUpdate,
      'baseUrl': baseUrl,
      'reportingProtocolId': reportingProtocolId
    }
  })

  describe('Verify Login and Administration of Users Works', () => {
    it('Admin Login to LPWan Server', (done) => {
      server
        .post('/api/sessions')
        .send({'login_username': 'admin', 'login_password': 'password'})
        .end(function (err, res) {
          if (err) done(err)
          if (err) done(err)
          res.should.have.status(200)
          adminToken = res.text
          done()
        })
    })
  })
  describe('Create Application', () => {
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
          if (err) done(err)
          res.should.have.status(200)
          let ret = JSON.parse(res.text)
          appId1 = ret.id
          device.applicationId = appId1
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
          if (err) done(err)
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
          'networkTypeId': networkTypeId,
          'networkSettings': applicationNetworkSettings
        })
        .end(function (err, res) {
          if (err) done(err)
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
          if (err) done(err)
          res.should.have.status(200)
          let appObj = JSON.parse(res.text)
          console.log(appObj)
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
          if (err) done(err)
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
          if (err) done(err)
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
          if (err) done(err)
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
          if (err) done(err)
          res.should.have.status(200)
          let devObj = JSON.parse(res.text)
          console.log(devObj)
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
          if (err) done(err)
          res.should.have.status(200)
          var dnlObj = JSON.parse(res.text)
          console.log(dnlObj)
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
          if (err) done(err)
          res.should.have.status(200)
          var dnlObj = JSON.parse(res.text)
          dnlObj.deviceId.should.equal(deviceNTL.deviceId)
          dnlObj.networkTypeId.should.equal(deviceNTL.networkTypeId)
          dnlObj.deviceProfileId.should.equal(deviceNTL.deviceProfileId)
          done()
        })
    })
  })
  describe('Verify ChirpStack V1 has application', function () {
    it('Verify the ChirpStack V1 Application Exists', async () => {
      const { result } = await Lora1.client.listApplications(Lora1.network, { limit: 100 })
      const app = result.find(x => x.name === appName)
      should.exist(app)
      remoteApp1 = app.id
    })
    it('Verify the ChirpStack V1 Application Exists', async () => {
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
    it('Verify the ChirpStack V1 Device Profile Exists', async () => {
      const { result } = await Lora1.client.listDeviceProfiles(Lora1.network, { limit: 100 })
      const dp = result.find(x => x.name === deviceProfile.networkSettings.name)
      should.exist(dp)
      remoteDeviceProfileId = dp.id
    })
    it('Verify the ChirpStack V1 Device Profile Exists', async () => {
      const dp = await Lora1.client.loadDeviceProfile(Lora1.network, remoteDeviceProfileId)
      dp.should.have.property('name')
      dp.name.should.equal(deviceProfile.networkSettings.name)
      dp.should.have.property('organizationID')
      dp.should.have.property('networkServerID')
      dp.should.have.property('createdAt')
      dp.should.have.property('updatedAt')
      dp.should.have.property('macVersion')
      dp.should.have.property('regParamsRevision')
      dp.macVersion.should.equal(deviceProfile.networkSettings.macVersion)
      dp.regParamsRevision.should.equal(deviceProfile.networkSettings.regParamsRevision)
    })
    it('Verify the ChirpStack V1 Device Exists', async () => {
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
  describe('Verify ChirpStack V2 has application', function () {
    it('Verify the ChirpStack V2 Application Exists', async () => {
      const { result } = await Lora2.client.listApplications(Lora2.network, { limit: 100 })
      const app = result.find(x => x.name === appName)
      should.exist(app)
      remoteApp2 = app.id
    })
    it('Verify the ChirpStack V2 Application Exists', async () => {
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
    it('Verify the ChirpStack V2 Device Profile Exists', async () => {
      const { result } = await Lora2.client.listDeviceProfiles(Lora2.network, { limit: 100 })
      const dp = result.find(x => x.name === deviceProfile.name)
      should.exist(dp)
      remoteDeviceProfileId2 = dp.id
    })
    it('Verify the ChirpStack V2 Device Profile Exists', async () => {
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
    it('Verify the ChirpStack V2 Device Exists', async () => {
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
  describe('Update Application', () => {
    let applicationNetworkSettingsUpdate = {
      'description': appDescriptionUpdate,
      'name': appName
    }
    it('Update Application', function (done) {
      server
        .put('/api/applications/' + appId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send(applicationUpdate)
        .end(function (err, res) {
          if (err) return done(err)
          console.log(res.text)
          res.should.have.status(204)
          done()
        })
    })

    it('Verify Application Updated', function (done) {
      server
        .get('/api/applications/' + appId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) done(err)
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
          appObj.description.should.equal(appDescriptionUpdate)
          appObj.baseUrl.should.equal(baseUrl)
          appObj.reportingProtocolId.should.equal(reportingProtocolId)

          done()
        })
    })
    it('Update Network Type Links for Application', function (done) {
      server
        .put('/api/applicationNetworkTypeLinks/' + anlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({
          'networkSettings': applicationNetworkSettingsUpdate
        })
        .end(function (err, res) {
          if (err) done(err)
          // TODO:  Why does PUT do 200 sometimes and 204 others?
          res.should.have.status(200)
          done()
        })
    })
    it('Verify Application NTL Updated', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks/' + anlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          let appObj = JSON.parse(res.text)
          console.log(appObj)
          done()
        })
    })
  })
  describe('Verify app updated on ChirpStack networks', function () {
    it('Verify app updated on ChirpStack V1', async () => {
      const app = await Lora1.client.loadApplication(Lora1.network, remoteApp1)
      app.description.should.equal(appDescriptionUpdate)
    })
    it('Verify app updated on ChirpStack V2', async () => {
      const app = await Lora1.client.loadApplication(Lora1.network, remoteApp2)
      app.description.should.equal(appDescriptionUpdate)
    })
  })
})
