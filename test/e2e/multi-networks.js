var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
var app = require('../../restApp.js')
var should = chai.should()
var setup = require('./setup.js')
var appLogger = require('../../rest/lib/appLogger.js')
var request = require('request')

chai.use(chaiHttp)
var server = chai.request(app).keepOpen()

describe.only('E2E Test for Multiple Networks', function () {
  var adminToken
  var userId
  var userToken
  var lora = {
    loraV1: {
      protocolId: '',
      networkId: '',
      apps: []
    },
    loraV2: {
      protocolId: '',
      networkId: '',
      apps: []
    },
    loriot: {
      protocolId: '',
      networkId: '',
      apps: []
    },
    ttn: {
      protocolId: '',
      networkId: '',
      apps: []

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
  describe('Verify Login and Administration of Users Works', function () {
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

    it('Create a Application User Account', (done) => {
      server
        .post('/api/users')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({'username': 'bobmouse', 'password': 'mousetrap', 'role': 'user', 'companyId': 2})
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          var ret = JSON.parse(res.text)
          ret.should.have.property('id')
          userId = ret.id
          done()
        })
    })
    it('Verify Application User Exists', (done) => {
      server
        .get('/api/users/' + userId)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          var userObj = JSON.parse(res.text)
          userObj.username.should.equal('bobmouse')
          userObj.role.should.equal('user')
          done()
        })
    })
    it('Application User Login to LPWan Server', (done) => {
      server
        .post('/api/sessions')
        .send({'login_username': 'bobmouse', 'login_password': 'mousetrap'})
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          userToken = res.text
          should.exist(userToken)
          done()
        })
    })
  })
  describe('Setup Networks', function () {
    describe('Setup Lora 1.0 Network', function () {
      it('Verify LoraOS 1.0 Protocol Exists', (done) => {
        server
          .get('/api/networkProtocols?search=Lora Open Source&networkProtocolVersion=1.0')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            var result = JSON.parse(res.text)
            appLogger.log(result)
            result.records.should.be.instanceof(Array)
            result.records.should.have.length(1)
            result.totalCount.should.equal(1)
            result.records[0].should.have.property('networkProtocolVersion')
            result.records[0].networkProtocolVersion.should.equal('1.0')
            lora.loraV1.protocolId = result.records[0].id
            done()
          })
      })
      it('Create the Local LoraOS 1.0 Network', (done) => {
        server
          .post('/api/networks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .send({
            'name': 'LocalLoraOS1_0',
            'networkProviderId': -1,
            'networkTypeId': 1,
            'baseUrl': 'https://localhost:8081/api',
            'networkProtocolId': lora.loraV1.protocolId,
            'securityData': {authorized: false, 'username': 'admin', 'password': 'admin'}
          })
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(201)
            var network = JSON.parse(res.text)
            appLogger.log(network)
            network.securityData.authorized.should.equal(true)
            network.securityData.message.should.equal('ok')
            lora.loraV1.networkId = network.id
            done()
          })
      })

      it('Get Network', (done) => {
        server
          .get('/api/networks/' + lora.loraV1.networkId)
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .send()
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            var network = JSON.parse(res.text)
            network.name.should.equal('LocalLoraOS1_0')
            network.baseUrl.should.equal('https://localhost:8081/api')
            network.securityData.authorized.should.equal(true)
            network.securityData.message.should.equal('ok')
            network.securityData.enabled.should.equal(true)
            done()
          })
      })
    })
    describe('Setup Lora 2.0 Network', function () {
      it('Verify LoraOS 2.0 Protocol Exists', (done) => {
        server
          .get('/api/networkProtocols?search=Lora Open Source&networkProtocolVersion=2.0')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            var result = JSON.parse(res.text)
            appLogger.log(result)
            result.records.should.be.instanceof(Array)
            result.records.should.have.length(1)
            result.totalCount.should.equal(1)
            result.records[0].should.have.property('networkProtocolVersion')
            result.records[0].networkProtocolVersion.should.equal('2.0')
            lora.loraV2.protocolId = result.records[0].id
            done()
          })
      })
      it('Create the Local LoraOS 2.0 Network', (done) => {
        server
          .post('/api/networks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .send({
            'name': 'LocalLoraOS2_0',
            'networkProviderId': -1,
            'networkTypeId': 1,
            'baseUrl': 'https://localhost:8080/api',
            'networkProtocolId': lora.loraV2.protocolId,
            'securityData': {authorized: false, 'username': 'admin', 'password': 'admin'}
          })
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(201)
            var network = JSON.parse(res.text)
            appLogger.log(network)
            network.securityData.authorized.should.equal(true)
            network.securityData.message.should.equal('ok')
            lora.loraV2.networkId = network.id
            done()
          })
      })

      it('Get Network', (done) => {
        server
          .get('/api/networks/' + lora.loraV2.networkId)
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .send()
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            var network = JSON.parse(res.text)
            network.name.should.equal('LocalLoraOS2_0')
            network.baseUrl.should.equal('https://localhost:8080/api')
            network.securityData.authorized.should.equal(true)
            network.securityData.message.should.equal('ok')
            network.securityData.enabled.should.equal(true)
            done()
          })
      })
    })
  })
  describe('After “authorized” network, automatically pulls the devices & applications', function () {
    describe('Lora 1.0', function () {
      it('Pull Applications, Device Profiles, Integrations, and Devices', function (done) {
        server
          .post('/api/networks/' + lora.loraV1.networkId + '/pull')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            done()
          })
      })
      it('Verify the Cablelabs Organization was Created', function (done) {
        server
          .get('/api/companies')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            var companies = JSON.parse(res.text)
            companies.should.have.property('totalCount')
            companies.should.have.property('records')
            companies.totalCount.should.equal(2)
            companies.records[0].name.should.equal('cl-admin')
            companies.records[1].name.should.equal('cablelabs')
            done()
          })
      })
    })
    describe('Lora 2.0', function () {
      it('Pull Applications, Device Profiles, Integrations, and Devices', function (done) {
        server
          .post('/api/networks/' + lora.loraV2.networkId + '/pull')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            done()
          })
      })
      it('Verify the Cablelabs Organization was Created', function (done) {
        server
          .get('/api/companies')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            var companies = JSON.parse(res.text)
            companies.should.have.property('totalCount')
            companies.should.have.property('records')
            companies.totalCount.should.equal(2)
            companies.records[0].name.should.equal('cl-admin')
            companies.records[1].name.should.equal('cablelabs')
            done()
          })
      })
    })
    describe('Lora 1.0 Application Verification', function () {
      it('Verify the Test Application was Created', function (done) {
        server
          .get('/api/applications')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            var applications = JSON.parse(res.text)
            appLogger.log(applications)
            applications.should.have.property('totalCount')
            applications.should.have.property('records')
            // applications.totalCount.should.equal(2)
            let application = {}
            for (let index = 0; index < applications.records.length; index++) {
              if (applications.records[index].name === 'BobMouseTrapLv1') {
                application = applications.records[index]
              }
            }
            application.should.have.property('name')
            application.name.should.equal('BobMouseTrapLv1')
            application.description.should.equal('CableLabs Test Application')
            lora.loraV1.apps.push({
              appId: application.id,
              appNTLId: '',
              deviceIds: [],
              deviceProfileIds: [],
              deviceNTLIds: []
            })
            done()
          })
      })
      it('Verify the Test Application NTL was Created', function (done) {
        let expected = {
          'id': 1,
          'applicationId': 1,
          'networkTypeId': 1,
          networkSettings: {

          }
        }
        should.exist(lora.loraV1.apps[0].appId)
        server
          .get('/api/applicationNetworkTypeLinks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let appNTLs = JSON.parse(res.text)
            appLogger.log(appNTLs)
            appLogger.log(lora.loraV1.apps)
            appNTLs.should.have.property('totalCount')
            appNTLs.should.have.property('records')
            // appNTLs.totalCount.should.equal(2)
            let appNTL = {}
            for (let index = 0; index < appNTLs.records.length; index++) {
              if (appNTLs.records[index].applicationId === lora.loraV1.apps[0].appId) {
                appNTL = appNTLs.records[index]
              }
            }
            should.exist(appNTL)
            appLogger.log(appNTL)
            appNTL.should.eql(expected)
            lora.loraV1.apps[0].appNTLId = appNTL.id
            done()
          })
      })
    })
    describe('Lora 2.0 Application Verification', function () {
      it('Verify the Test Application was Created', function (done) {
        server
          .get('/api/applications')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            var applications = JSON.parse(res.text)
            applications.should.have.property('totalCount')
            applications.should.have.property('records')
            // applications.totalCount.should.equal(2)
            let application = {}
            for (let index = 0; index < applications.records.length; index++) {
              if (applications.records[index].name === 'BobMouseTrapLv2') {
                application = applications.records[index]
              }
            }
            should.exist(application)
            appLogger.log(application)
            application.name.should.equal('BobMouseTrapLv2')
            application.description.should.equal('CableLabs Test Application')
            lora.loraV2.apps.push({
              appId: application.id,
              appNTLId: '',
              deviceIds: [],
              deviceProfileIds: [],
              deviceNTLIds: []
            })
            done()
          })
      })
      it('Verify the Test Application NTL was Created', function (done) {
        let expected = {
          'id': 2,
          'applicationId': 2,
          'networkTypeId': 1,
          'networkSettings': {'payloadCodec': '', 'payloadDecoderScript': '', 'payloadEncoderScript': ''}
        }
        appLogger.log(lora.loraV2)
        should.exist(lora.loraV2.apps[0].appId)
        server
          .get('/api/applicationNetworkTypeLinks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let appNTLs = JSON.parse(res.text)
            appNTLs.should.have.property('totalCount')
            appNTLs.should.have.property('records')
            // appNTLs.totalCount.should.equal(2)
            let appNTL = {}
            for (let index = 0; index < appNTLs.records.length; index++) {
              if (appNTLs.records[index].applicationId === lora.loraV2.apps[0].appId) {
                appNTL = appNTLs.records[index]
              }
            }
            should.exist(appNTL)
            appLogger.log(appNTL)
            appNTL.should.eql(expected)
            lora.loraV2.apps[0].appNTLId = appNTL.id
            done()
          })
      })
    })
    describe('Lora 1.0 Device Verification', function () {
      it('Verify the Test1 Device Profile was Created', function (done) {
        let expected = {
          'id': 1,
          'networkTypeId': 1,
          'companyId': 2,
          'name': 'BobMouseTrapDeviceProfileLv1',
          'networkSettings': {
            'deviceProfileID': '5d1e49eb-28c8-411b-9cbf-87650d103d51',
            'supportsClassB': false,
            'classBTimeout': 0,
            'pingSlotPeriod': 0,
            'pingSlotDR': 0,
            'pingSlotFreq': 0,
            'supportsClassC': false,
            'classCTimeout': 0,
            'macVersion': '1.0.0',
            'regParamsRevision': 'A',
            'rxDelay1': 0,
            'rxDROffset1': 0,
            'rxDataRate2': 0,
            'rxFreq2': 0,
            'factoryPresetFreqs': [],
            'maxEIRP': 0,
            'maxDutyCycle': 0,
            'supportsJoin': false,
            'rfRegion': 'US902',
            'supports32bitFCnt': false
          },
          'description': 'Device Profile managed by LPWAN Server, perform changes via LPWAN'
        }
        server
          .get('/api/deviceProfiles')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let deviceProfiles = JSON.parse(res.text)
            deviceProfiles.should.have.property('totalCount')
            deviceProfiles.should.have.property('records')
            // deviceProfiles.totalCount.should.equal(2)
            let deviceProfile = {}
            for (let index = 0; index < deviceProfiles.records.length; index++) {
              if (deviceProfiles.records[index].name === 'BobMouseTrapDeviceProfileLv1') {
                deviceProfile = deviceProfiles.records[index]
              }
            }
            should.exist(deviceProfile)
            deviceProfile.description.should.equal('Device Profile managed by LPWAN Server, perform changes via LPWAN')
            deviceProfile.id.should.equal(1)
            deviceProfile.name.should.equal('BobMouseTrapDeviceProfileLv1')
            deviceProfile.networkSettings.name.should.equal('BobMouseTrapDeviceProfileLv1')
            deviceProfile.networkSettings.networkServerID.should.equal('5')
            deviceProfile.networkSettings.organizationID.should.equal('2')
            lora.loraV1.apps[0].deviceProfileIds.push(deviceProfile.id)
            done()
          })
      })
      it('Verify the Test Device was Created', function (done) {
        let expected = {
          'id': 1,
          'applicationId': lora.loraV1.apps[0].appId,
          'name': 'BobMouseTrapDeviceLv1',
          'deviceModel': null,
          'description': 'Test Device for E2E'
        }
        server
          .get('/api/devices')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let devices = JSON.parse(res.text)
            devices.should.have.property('totalCount')
            devices.should.have.property('records')
            // devices.totalCount.should.equal(2)
            let device = {}
            for (let index = 0; index < devices.records.length; index++) {
              if (devices.records[index].name === 'BobMouseTrapDeviceLv1') {
                device = devices.records[index]
              }
            }
            should.exist(device)
            appLogger.log(device)
            device.should.eql(expected)
            lora.loraV1.apps[0].deviceIds.push(device.id)
            done()
          })
      })
      it('Verify the Test Device NTL was Created', function (done) {
        let expected = {
          'id': 1,
          'deviceId': lora.loraV1.apps[0].deviceIds[0],
          'networkTypeId': 1,
          'deviceProfileId': lora.loraV1.apps[0].deviceProfileIds[0],
          'networkSettings': {
            'devEUI': '1234567890123456',
            'name': 'BobMouseTrapDeviceLv1',
            'applicationID': '2',
            'description': 'Test Device for E2E',
            'deviceProfileID': 'da2c61af-4d85-4057-a734-2e97a5afb25a',
            'deviceStatusBattery': 256,
            'deviceStatusMargin': 256,
            'lastSeenAt': '',
            'skipFCntCheck': false
          }
        }
        server
          .get('/api/deviceNetworkTypeLinks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let deviceNTLs = JSON.parse(res.text)
            deviceNTLs.should.have.property('totalCount')
            deviceNTLs.should.have.property('records')
            // deviceNTLs.totalCount.should.equal(2)
            let deviceNTL = {}
            for (let index = 0; index < deviceNTLs.records.length; index++) {
              if (deviceNTLs.records[index].deviceId === lora.loraV1.apps[0].deviceIds[0]) {
                deviceNTL = deviceNTLs.records[index]
              }
            }
            should.exist(deviceNTL)
            appLogger.log(deviceNTL)
            deviceNTL.should.eql(expected)
            lora.loraV1.apps[0].deviceNTLIds.push(deviceNTL.id)
            done()
          })
      })
    })
    describe('Lora 2.0 Device Verification', function () {
      it('Verify the Test1 Device Profile was Created', function (done) {
        let expected = {
          'id': 2,
          'networkTypeId': 1,
          'companyId': 2,
          'name': 'BobMouseTrapDeviceProfileLv2',
          'networkSettings': {
            'id': 'c504e774-4c3d-483e-ad0a-8550ce2caf0e',
            'supportsClassB': false,
            'classBTimeout': 0,
            'pingSlotPeriod': 0,
            'pingSlotDR': 0,
            'pingSlotFreq': 0,
            'supportsClassC': false,
            'classCTimeout': 0,
            'macVersion': '1.0.0',
            'regParamsRevision': 'A',
            'rxDelay1': 0,
            'rxDROffset1': 0,
            'rxDataRate2': 0,
            'rxFreq2': 0,
            'factoryPresetFreqs': [],
            'maxEIRP': 0,
            'name': 'BobMouseTrapDeviceProfileLv2',
            'networkServerID': '1',
            'organizationID': '1',
            'maxDutyCycle': 0,
            'supportsJoin': false,
            'rfRegion': 'US902',
            'supports32BitFCnt': false
          },
          'description': 'Device Profile managed by LPWAN Server, perform changes via LPWAN'
        }
        server
          .get('/api/deviceProfiles')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let deviceProfiles = JSON.parse(res.text)
            deviceProfiles.should.have.property('totalCount')
            deviceProfiles.should.have.property('records')
            // deviceProfiles.totalCount.should.equal(2)
            let deviceProfile = {}
            for (let index = 0; index < deviceProfiles.records.length; index++) {
              if (deviceProfiles.records[index].name === 'BobMouseTrapDeviceProfileLv2') {
                deviceProfile = deviceProfiles.records[index]
              }
            }
            should.exist(deviceProfile)
            deviceProfile.should.eql(expected)
            lora.loraV2.apps[0].deviceProfileIds.push(deviceProfile.id)
            done()
          })
      })
      it('Verify the Test Device was Created', function (done) {
        let expected = {
          'id': 2,
          'applicationId': lora.loraV2.apps[0].appId,
          'name': 'BobMouseTrapDeviceLv2',
          'deviceModel': null,
          'description': 'Test Device for E2E'
        }
        server
          .get('/api/devices')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let devices = JSON.parse(res.text)
            devices.should.have.property('totalCount')
            devices.should.have.property('records')
            // devices.totalCount.should.equal(2)
            let device = {}
            for (let index = 0; index < devices.records.length; index++) {
              if (devices.records[index].name === 'BobMouseTrapDeviceLv2') {
                device = devices.records[index]
              }
            }
            should.exist(device)
            appLogger.log(device)
            device.should.eql(expected)
            lora.loraV2.apps[0].deviceIds.push(device.id)
            done()
          })
      })
      it('Verify the Test Device NTL was Created', function (done) {
        let expected = {
          'id': 2,
          'deviceId': lora.loraV2.apps[0].deviceIds[0],
          'networkTypeId': 1,
          deviceProfileId: 2,
          'networkSettings': {
            'devEUI': '8484932090909090',
            'name': 'BobMouseTrapDeviceLv2',
            'applicationID': '1',
            'description': 'Test Device for E2E',
            'deviceProfileID': 'c504e774-4c3d-483e-ad0a-8550ce2caf0e',
            'skipFCntCheck': false
          }
        }
        server
          .get('/api/deviceNetworkTypeLinks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            res.should.have.property('text')
            let deviceNTLs = JSON.parse(res.text)
            deviceNTLs.should.have.property('totalCount')
            deviceNTLs.should.have.property('records')
            // deviceNTLs.totalCount.should.equal(2)
            let deviceNTL = {}
            for (let index = 0; index < deviceNTLs.records.length; index++) {
              if (deviceNTLs.records[index].deviceId === lora.loraV2.apps[0].deviceIds[0]) {
                deviceNTL = deviceNTLs.records[index]
              }
            }
            should.exist(deviceNTL)
            appLogger.log(deviceNTL)
            deviceNTL.should.eql(expected)
            lora.loraV2.apps[0].deviceNTLIds.push(deviceNTL.id)
            done()
          })
      })
    })
  })
  describe('Sync with each network server the current state of devices', function () {
    describe('Push Lora 1.0 Network', function () {
      it('Push Applications, Device Profiles, Integrations, and Devices', function (done) {
        server
          .post('/api/networks/' + lora.loraV1.networkId + '/push')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            done()
          })
      })
    })
  })
})
