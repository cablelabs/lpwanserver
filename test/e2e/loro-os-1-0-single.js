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

describe('E2E Test for Single LoraOS 1.0', function () {
  var adminToken
  var userId
  var userToken
  var loraProtocolId
  var networkId
  var applicationId

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
          done()
        })
    })
  })
  describe('Setup Network', function () {
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
          loraProtocolId = result.records[0].id
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
          'baseUrl': 'https://localhost:8080/api',
          'networkProtocolId': loraProtocolId,
          'securityData': {authorized: false, 'username': 'admin', 'password': 'admin'}
        })
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(201)
          var network = JSON.parse(res.text)
          appLogger.log(network)
          network.securityData.authorized.should.equal(true)
          network.securityData.message.should.equal('ok')
          networkId = network.id
          done()
        })
    })

    it('Get Network', (done) => {
      server
        .get('/api/networks/' + networkId)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          var network = JSON.parse(res.text)
          network.name.should.equal('LocalLoraOS1_0')
          network.baseUrl.should.equal('https://localhost:8080/api')
          network.securityData.authorized.should.equal(true)
          network.securityData.message.should.equal('ok')
          done()
        })
    })
  })
  describe('After “authorized” network, automatically pulls the devices & applications', function () {
    it('Pull Applications, Device Profiles, Integrations, and Devices', function (done) {
      server
        .post('/api/networks/' + networkId + '/pull')
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
          applications.totalCount.should.equal(1)
          applications.records[0].name.should.equal('TestApplication')
          applications.records[0].description.should.equal('CableLabs Test Application')
          applicationId = applications.records[0].id
          done()
        })
    })
    it('Verify the Test Application NTL was Created', function (done) {
      let expected = {
        'totalCount': 1,
        'records': [{
          'id': 1,
          'applicationId': 1,
          'networkTypeId': 1,
          'networkSettings': {'payloadCodec': '', 'payloadDecoderScript': '', 'payloadEncoderScript': ''}
        }]
      }
      server
        .get('/api/applicationNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          res.should.have.property('text')
          var applications = JSON.parse(res.text)
          applications.should.have.property('totalCount')
          applications.should.have.property('records')
          applications.totalCount.should.equal(1)
          appLogger.log(applications)
          applications.should.eql(expected)
          done()
        })
    })
    it('Verify the Test1 Device Profile was Created', function (done) {
      let expected = {
        'totalCount': 1,
        'records': [{
          'id': 1,
          'networkTypeId': 1,
          'companyId': 2,
          'name': 'TestDevice',
          'networkSettings': {
            'deviceProfileID': '9a713913-4850-496e-bf63-547ec7fb66f4',
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
        }]
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
          deviceProfiles.totalCount.should.equal(1)
          deviceProfiles.should.eql(expected)
          done()
        })
    })
    it('Verify the Test Device was Created', function (done) {
      let expected = {
        'totalCount': 1,
        'records': [{
          'id': 1,
          'applicationId': 1,
          'name': 'TestDevice',
          'deviceModel': null,
          'description': 'Test Device for E2E'
        }]
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
          devices.totalCount.should.equal(1)
          appLogger.log(devices)
          devices.should.eql(expected)
          done()
        })
    })
    it('Verify the Test Device NTL was Created', function (done) {
      let expected = {
        'totalCount': 1,
        'records': [{
          'id': 1,
          'deviceId': 1,
          'networkTypeId': 1,
          'deviceProfileId': 1,
          'networkSettings': {
            'devEUI': '1234567890123456',
            'name': 'TestDevice',
            'applicationID': '1',
            'description': 'Test Device for E2E',
            'deviceProfileID': '9a713913-4850-496e-bf63-547ec7fb66f4',
            'deviceStatusBattery': 256,
            'deviceStatusMargin': 256,
            'lastSeenAt': '',
            'skipFCntCheck': false
          }
        }]
      }
      server
        .get('/api/deviceNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          res.should.have.property('text')
          var devices = JSON.parse(res.text)
          devices.should.have.property('totalCount')
          devices.should.have.property('records')
          devices.totalCount.should.equal(1)
          appLogger.log(devices)
          devices.should.eql(expected)
          done()
        })
    })
  })
  describe('LPWAN Server modifies any existing application “Integrations” to point to LPWAN Server', function () {
    let baseUrl = 'https://localhost:8080/api'
    let loraKey = ''
    it('Get Lora Session', function (done) {
      var options = {}
      options.method = 'POST'
      options.url = baseUrl + '/internal/login'
      options.headers = {'Content-Type': 'application/json'}
      options.json = {username: 'admin', password: 'admin'}
      options.agentOptions = {'secureProtocol': 'TLSv1_2_method', 'rejectUnauthorized': false}
      request(options, function (error, response, body) {
        if (error) {
          appLogger.log('Error on signin: ' + error)
          done(error)
        }
        else if (response.statusCode >= 400 || response.statusCode === 301) {
          appLogger.log('Error on signin: ' + response.statusCode + ', ' + response.body.error)
          done(response.statusCode)
        }
        else if (!body.jwt) {
          done(new Error('No token'))
        }
        else {
          loraKey = body.jwt
          done()
        }
      })
    })
    it('Verify the Lora Server Application Integration was set to LPWan Server', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/applications/' + 1 + '/integrations/http'
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
          let integration = JSON.parse(body)
          integration.should.have.property('dataUpURL')
          integration.dataUpURL.should.equal('http://localhost:3200/api/ingest/1/1')
          done()
        }
      })
    })
  })
  describe('Validate LPWAN Server application integrations are maintained for outbound from LPWAN Server', function () {
    it('Verify the Test Application Integration was Updated', function (done) {
      server
        .get('/api/applications/' + applicationId)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          res.should.have.property('text')
          var application = JSON.parse(res.text)
          appLogger.log(application)
          application.should.have.property('baseUrl')
          application.baseUrl.should.equal('http://localhost:9999')
          done()
        })
    })
  })
  describe('At this point, you should be able to view all of the applications and devices from the LoraOS 1.0 Server.', function () {
    it('Verify the Test Application Exists on LPWan', function (done) {
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
          applications.totalCount.should.equal(1)
          applications.records[0].name.should.equal('TestApplication')
          applications.records[0].description.should.equal('CableLabs Test Application')
          applicationId = applications.records[0].id
          done()
        })
    })
    it('Verify the Test1 Device Exists on LPWan', function (done) {
      let expected = {
        'totalCount': 1,
        'records': [{
          'id': 1,
          'networkTypeId': 1,
          'companyId': 2,
          'name': 'TestDevice',
          'networkSettings': {
            'deviceProfileID': '9a713913-4850-496e-bf63-547ec7fb66f4',
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
        }]
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
          deviceProfiles.totalCount.should.equal(1)
          deviceProfiles.should.eql(expected)
          done()
        })
    })
    it('Verify the Test Device Exists on LPWan', function (done) {
      let expected = {
        'totalCount': 1,
        'records': [{
          'id': 1,
          'applicationId': 1,
          'name': 'TestDevice',
          'deviceModel': null,
          'description': 'Test Device for E2E'
        }]
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
          devices.totalCount.should.equal(1)
          appLogger.log(devices)
          devices.should.eql(expected)
          done()
        })
    })
  })
})
