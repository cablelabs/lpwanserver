// eslint-disable-next-line no-unused-vars
var assert = require('assert')
var chai = require('chai')
var chaiHttp = require('chai-http')
var app = require('../../restApp.js')
// eslint-disable-next-line no-unused-vars
var should = chai.should()
var setup = require('./setup.js')
var appLogger = require('../../rest/lib/appLogger.js')
var request = require('request')

chai.use(chaiHttp)
var server = chai.request(app).keepOpen()

var request = require('request')

describe('E2E Test for Single TTN', function () {
  var adminToken
  var userId
  var userToken
  var loraProtocolId
  var networkId
  var applicationId
  var baseUrl = 'https://account.thethingsnetwork.org'
  var handlerUrl = 'http://us-west.thethings.network:8084'

  before((done) => {
    setup.start()
      .then(done, done)
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
        .send({'username': 'bobmouse4', 'password': 'mousetrap', 'role': 'user', 'companyId': 2})
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
          userObj.username.should.equal('bobmouse4')
          userObj.role.should.equal('user')
          done()
        })
    })
    it('Application User Login to LPWan Server', (done) => {
      server
        .post('/api/sessions')
        .send({'login_username': 'bobmouse4', 'login_password': 'mousetrap'})
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          userToken = res.text
          userToken.should.not.equal(null)
          done()
        })
    })
  })
  describe('Setup Network', function () {
    it('Verify TTN Protocol Exists', (done) => {
      server
        .get('/api/networkProtocols?search=The Things Network')
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
          loraProtocolId = result.records[0].id
          appLogger.log(loraProtocolId)
          done()
        })
    })
    it('Create the Local TTN Network', (done) => {
      let options = {
        method: 'POST',
        url: 'https://account.thethingsnetwork.org/users/token',
        headers:
          {
            'Postman-Token': 'e525eece-fd47-46bc-89f8-cc420bba2685',
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
            Authorization: 'Basic bHB3YW4tdGVzdC0zOmx0TVNMMGNtSVZrekJZUVpuZFo4c2x6RjM3cUxNalJtN3NYWHQ0cWNla3lDcTNZRW9MTWY5clFy'
          },
        body:
          {
            grant_type: 'password',
            username: 'dschrimpsherr',
            password: 'Ultimum01',
            scope: ['apps', 'gateways', 'components', 'apps:cable-labs-prototype']
          },
        json: true
      }

      request(options, function (error, response, body) {
        if (error) throw new Error(error)

        console.log(body)
        let networkSettings = {
          'name': 'LocalTTN',
          'networkProviderId': -1,
          'networkTypeId': 1,
          'baseUrl': 'https://account.thethingsnetwork.org',
          'networkProtocolId': loraProtocolId,
          'securityData': {
            authorized: true,
            message: 'ok',
            'token_type': 'bearer',
            'refresh_token': body.refresh_token,
            'access_token': body.access_token,
            'expires_in': 3600,
            username: 'dschrimpsherr',
            password: 'Ultimum01'
          }
        }
        console.log(networkSettings)
        server
          .post('/api/networks')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .send(networkSettings)
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
          network.name.should.equal('LocalTTN')
          network.baseUrl.should.equal('https://account.thethingsnetwork.org')
          network.securityData.authorized.should.equal(true)
          network.securityData.message.should.equal('ok')
          done()
        })
    })
  })
  describe('After “authorized” network, automatically pulls the devices & applications', function () {
    let expectedOTAA = {
      'applicationId': 1,
      'name': '00B7641AD008A5FC',
      'deviceModel': null,
      'description': 'TTN Device Using OTAA',
      networks: [1]
    }
    let expectedABP = {
      'applicationId': 1,
      'name': '1234567890987654',
      'deviceModel': null,
      'description': 'CableLabs TTN Device ABP',
      networks: [1]
    }
    it.skip('Pull Applications, Device Profiles, Integrations, and Devices', function (done) {
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
          applicationId = applications.records[0].id
          done()
        })
    })
    it('Verify the Test Application NTL was Created', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks/' + applicationId)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          res.should.have.property('text')
          var applications = JSON.parse(res.text)
          appLogger.log(applications)
          done()
        })
    })
    it('Verify the Test Device 1 was Created', function (done) {
      server
        .get('/api/devices/1')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          res.should.have.property('text')
          let devices = JSON.parse(res.text)
          appLogger.log(devices)
          if (devices.name === '1234567890987654') {
            expectedABP.id = 1
            devices.should.eql(expectedABP)
          }
          else {
            expectedOTAA.id = 1
            devices.should.eql(expectedOTAA)
          }
          done()
        })
    })
    it('Verify the Test Device 2 was Created', function (done) {
      server
        .get('/api/devices/2')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          res.should.have.property('text')
          let devices = JSON.parse(res.text)
          appLogger.log(devices)
          if (devices.name === '1234567890987654') {
            expectedABP.id = 2
            devices.should.eql(expectedABP)
          }
          else {
            expectedOTAA.id = 2
            devices.should.eql(expectedOTAA)
          }
          done()
        })
    })
    it('Verify the Test Device 1 NTL was Created', function (done) {
      let expectedNSOTTA = {
        'applicationID': 'cable-labs-prototype',
        'description': 'TTN Device Using OTAA',
        'devEUI': '00B7641AD008A5FC',
        'deviceKeys': {
          'appKey': '3070CF4FE37A440A58D4864CDD2D9966',
          'devEUI': '00B7641AD008A5FC'
        },
        'deviceProfileID': expectedOTAA.id,
        'deviceStatusBattery': '',
        'deviceStatusMargin': '',
        'name': 'cablelabs-ttn-device-join',
        'skipFCntCheck': false
      }
      let expectedNSABP = {
        'applicationID': 'cable-labs-prototype',
        'description': 'CableLabs TTN Device ABP',
        'devEUI': '1234567890987654',
        'deviceActivation': {
          'appSKey': '15134FFB2AB2936583FCD0AAECF6559C',
          'devAddr': '260214F3',
          'devEUI': '1234567890987654',
          'nwkSEncKey': '693BB52D4C24D878A01B88360F699917'
        },
        'deviceProfileID': expectedABP.id,
        'deviceStatusBattery': '',
        'deviceStatusMargin': '',
        'name': 'cl-weather-station',
        'skipFCntCheck': false
      }
      server
        .get('/api/deviceNetworkTypeLinks/1')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          res.should.have.property('text')
          var devices = JSON.parse(res.text)
          appLogger.log(devices)
          if (devices.networkSettings.description === 'TTN Device Using OTAA') {
            devices.deviceId.should.equal(expectedOTAA.id)
            expectedNSOTTA.deviceProfileID = devices.deviceProfileId
            devices.should.have.property('networkSettings')
            devices.networkSettings.should.eql(expectedNSOTTA)
          }
          else {
            devices.deviceId.should.equal(expectedABP.id)
            expectedNSABP.deviceProfileID = devices.deviceProfileId
            devices.should.have.property('networkSettings')
            devices.networkSettings.should.eql(expectedNSABP)
          }
          done()
        })
    })
    it('Verify the Test Device 2 NTL was Created', function (done) {
      let expectedNSOTTA = {
        'applicationID': 'cable-labs-prototype',
        'description': 'TTN Device Using OTAA',
        'devEUI': '00B7641AD008A5FC',
        'deviceKeys': {
          'appKey': '3070CF4FE37A440A58D4864CDD2D9966',
          'devEUI': '00B7641AD008A5FC'
        },
        'deviceProfileID': expectedOTAA.id,
        'deviceStatusBattery': '',
        'deviceStatusMargin': '',
        'name': 'cablelabs-ttn-device-join',
        'skipFCntCheck': false
      }
      let expectedNSABP = {
        'applicationID': 'cable-labs-prototype',
        'description': 'CableLabs TTN Device ABP',
        'devEUI': '1234567890987654',
        'deviceActivation': {
          'appSKey': '15134FFB2AB2936583FCD0AAECF6559C',
          'devAddr': '260214F3',
          'devEUI': '1234567890987654',
          'nwkSEncKey': '693BB52D4C24D878A01B88360F699917'
        },
        'deviceProfileID': expectedABP.id,
        'deviceStatusBattery': '',
        'deviceStatusMargin': '',
        'name': 'cl-weather-station',
        'skipFCntCheck': false
      }
      server
        .get('/api/deviceNetworkTypeLinks/2')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          res.should.have.property('text')
          var devices = JSON.parse(res.text)
          appLogger.log(devices)
          if (devices.networkSettings.description === 'TTN Device Using OTAA') {
            devices.deviceId.should.equal(expectedOTAA.id)
            expectedNSOTTA.deviceProfileID = devices.deviceProfileId
            devices.should.have.property('networkSettings')
            devices.networkSettings.should.eql(expectedNSOTTA)
          }
          else {
            devices.deviceId.should.equal(expectedABP.id)
            expectedNSABP.deviceProfileID = devices.deviceProfileId
            devices.should.have.property('networkSettings')
            devices.networkSettings.should.eql(expectedNSABP)
          }
          done()
        })
    })
  })
  describe.skip('LPWAN Server modifies any existing application “Integrations” to point to LPWAN Server', function () {
    it('Verify the Lora Server Application Integration was set to LPWan Server', function (done) {
      let options = {}
      options.url = baseUrl + '/1/nwk/apps'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.TTN_KEY
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
          body = JSON.parse(body)
          body.apps.should.have.length(1)
          let app = body.apps[0]
          app.osetup.url.should.equal('http://localhost:3200/api/ingest/1/1')
          done()
        }
      })
    })
  })
  describe.skip('Validate LPWAN Server application integrations are maintained for outbound from LPWAN Server', function () {
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
  describe('At this point, you should be able to view all of the applications and devices from the TTN Server.', function () {
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
          applications.records[0].name.should.equal('cable-labs-prototype')
          applications.records[0].description.should.equal('Prototype Application for CableLabs Trial')
          applicationId = applications.records[0].id
          done()
        })
    })
    it('Verify the Test Device Exists on LPWan', function (done) {
      server
        .get('/api/devices')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          res.should.have.property('text')
          let devices = JSON.parse(res.text)
          appLogger.log(devices)
          done()
        })
    })
  })
})
