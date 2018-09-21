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

describe('E2E Test for Single TTN', function () {
  var adminToken
  var userId
  var userToken
  var loraProtocolId
  var networkId
  var applicationId
  var baseUrl = 'https://account.thethingsnetwork.org'

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
      let body = {
        'name': 'LocalTTN',
        'networkProviderId': -1,
        'networkTypeId': 1,
        'baseUrl': 'https://account.thethingsnetwork.org',
        'networkProtocolId': loraProtocolId,
        'securityData': {
          authorized: true,
          message: 'ok',
          'token_type': 'bearer',
          'refresh_token': 'EVJn366LdRBljTPA_5E9GHed6YNUIoQamwNmPsKMh6U',
          'access_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI1YjJhN2IyMTZhNDFhZTAwMzBhOTExZWQiLCJpc3MiOiJ0dG4tYWNjb3VudC12MiIsImlhdCI6MTUzNzU0MTU2OCwidHlwZSI6InVzZXIiLCJjbGllbnQiOiJscHdhbi10ZXN0Iiwic2NvcGUiOlsicHJvZmlsZSIsImFwcHMiLCJjb21wb25lbnRzIiwiZ2F0ZXdheXMiXSwiaW50ZXJjaGFuZ2VhYmxlIjp0cnVlLCJ1c2VybmFtZSI6ImRzY2hyaW1wc2hlcnIiLCJlbWFpbCI6ImQuc2NocmltcHNoZXJAY2FibGVsYWJzLmNvbSIsImNyZWF0ZWQiOiIyMDE4LTA2LTIwVDE2OjA0OjQ5Ljc2N1oiLCJuYW1lIjp7ImZpcnN0IjoiRGFuIiwibGFzdCI6IlNjaHJpbXBzaGVyIn0sInZhbGlkIjp0cnVlLCJfaWQiOiI1YjJhN2IyMTZhNDFhZTAwMzBhOTExZWQiLCJleHAiOjE1Mzc1NDUyMjh9.ChaZqhGYfsVu_xwUEvj5jddVGbGZnoeMoz2kftG3tVXYgc5n_EeU4xVYmwr8yiSmWrb0XRlPps6uBKPaXOiXg7SfS4ywQOBPtqdUNU0RMcNe0k5nV3P2JrTYEOBBxH-m7kAJMS_r6aRqFAphXfNuRd2MjXoMb0zCf0I94KCwaulRWznhnzrMdIzeNDI_JpLdx4jKQkKTKkIhArqIViI8eBnKgloIPbbaVYKIsraRuOoax72mktH58dw_5PVF8HRM469DP-jEIBnmCQ0yTl4kmS7Fjb8bS4sCyBq1EtM_1S5eCzQAzuLkdvkgHWQ7uRXba0hxpIwIF4PKMoAmr2j5ea-8nKkvx0kmdRXvf4moWoGSRTp0CkWNXtpAGBQHKzjP6oK6Z2MWyBbSLd1Rp51vJD1frd98z4nyzz3qIe_WolIlOqCxfZtHYSp9soeka40gHylhM2oR2Z47Y5245jPUn9RxQA4VnLfAoYyyT7lxG2QoRmAyr7sIuoZZ9XwcGKZKuXgzjPmbwQkzS8VpBHxlq48CN4UuWjteJvHuocoynh9Y_fDHTmiTNWc-rnadSw3JREtej9MAe-JDSHaXFX0KN_IN46yK5UVXooG7UG70Uo6C--F3VxE9WkHyAG22K0ATei_kUwpzRI-u7T7DcNspn4ypsl9642vmdtDdLYbxHDg',
          'expires_in': 3600
        }
      }
      console.log(body)
      server
        .post('/api/networks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send(body)
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
          network.name.should.equal('LocalTTN')
          network.baseUrl.should.equal('https://account.thethingsnetwork.org')
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
    it('Verify the Test Device was Created', function (done) {
      let expected = {
        'id': 1,
        'applicationId': applicationId,
        'name': '1234567890987654',
        'deviceModel': null,
        'description': 'Test Weather Device',
        networks: [1]
      }
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
          devices.should.eql(expected)
          done()
        })
    })
    it('Verify the Test Device NTL was Created', function (done) {
      let expected = {
        'id': 1,
        'deviceId': 1,
        'networkTypeId': 1,
        'deviceProfileId': -1,
        'networkSettings': {
          'app_id': 'cable-labs-prototype',
          'dev_id': 'cl-weather-station',
          'lorawan_device': {
            'app_eui': '70B3D57ED000FEEA',
            'dev_eui': '1234567890987654',
            'app_id': 'cable-labs-prototype',
            'dev_id': 'cl-weather-station',
            'dev_addr': '',
            'nwk_s_key': '',
            'app_s_key': '',
            'app_key': '21124307FD27462856CC7A67799FFEB9',
            'uses32_bit_f_cnt': true,
            'activation_constraints': 'local'
          },
          'latitude': 34.74164,
          'longitude': -86.69502,
          'altitude': 183,
          'description': 'Test Weather Device'
        }
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
          devices.should.eql(expected)
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
          applications.records[0].name.should.equal('Prototype Application for CableLabs Trial')
          applications.records[0].description.should.equal('Prototype Application for CableLabs Trial')
          applicationId = applications.records[0].id
          done()
        })
    })
    it('Verify the Test Device Exists on LPWan', function (done) {
      let expected = {
        'id': 1,
        'applicationId': 1,
        'name': '1234567890987654',
        'deviceModel': null,
        'description': 'Test Weather Device',
        networks: [1]
      }
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
          devices.should.eql(expected)
          done()
        })
    })
  })
})
