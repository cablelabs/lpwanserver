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

describe.only('E2E Test for Single Loriot', function () {
  var adminToken
  var userId
  var userToken
  var loraProtocolId
  var networkId
  var applicationId
  var baseUrl = 'https://us1.loriot.io'

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
        .send({'username': 'bobmouse3', 'password': 'mousetrap', 'role': 'user', 'companyId': 2})
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
          userObj.username.should.equal('bobmouse3')
          userObj.role.should.equal('user')
          done()
        })
    })
    it('Application User Login to LPWan Server', (done) => {
      server
        .post('/api/sessions')
        .send({'login_username': 'bobmouse3', 'login_password': 'mousetrap'})
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          userToken = res.text
          done()
        })
    })
  })
  describe('Setup Network', function () {
    it('Verify Loriot Protocol Exists', (done) => {
      server
        .get('/api/networkProtocols?search=Loriot')
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
          appLogger.log(loraProtocolId)
          done()
        })
    })
    it('Create the Local Loriot Network', (done) => {
      let key = process.env.LORIOT_KEY
      should.exist(key)
      server
        .post('/api/networks')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({
          'name': 'LocalLoriot',
          'networkProviderId': -1,
          'networkTypeId': 1,
          'baseUrl': 'https://us1.loriot.io',
          'networkProtocolId': loraProtocolId,
          'securityData': {authorized: false, apikey: process.env.LORIOT_KEY}
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
          network.name.should.equal('LocalLoriot')
          network.baseUrl.should.equal('https://us1.loriot.io')
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
          applications.records[0].name.should.equal('ApiTest')
          applications.records[0].description.should.equal('ApiTest')
          applicationId = applications.records[0].id
          done()
        })
    })
    it('Verify the Test Application NTL was Created', function (done) {
      let expected = {
        'applicationId': 1,
        'id': 1,
        'networkSettings': {
          '_id': 3195929586,
          'accessRights': [
            {
              'appServer': true,
              'data': true,
              'devProvisioning': true,
              'token': '60cdd88e0e3b1fb2113791c58bb86878'
            },
            {
              'appServer': true,
              'data': true,
              'devProvisioning': true,
              'token': '2978dcb86393676e0c83607d2e218c3c'
            }
          ],
          'canotaa': true,
          'cansend': true,
          'cfgDevBase': {
            'adr': true,
            'adrFix': null,
            'adrMax': null,
            'adrMin': null,
            'devclass': 'A',
            'dutycycle': 0,
            'rxw': 1,
            'seqdnreset': true,
            'seqrelax': true
          },
          'clientsLimit': 10,
          'created': '2018-06-28T16:27:19.980Z',
          'deviceLimit': 10,
          'devices': 1,
          'downloads': {
            'json': 2
          },
          'hexId': 'BE7E03F2',
          'joinServer': null,
          'masterkey': 'kTcgTMkHQtShPY2j3VJ22A==',
          'name': 'ApiTest',
          'odataenc': 'hex',
          'ogwinfo': 'rssi',
          'orx': true,
          'osetup': {
            'auth': '',
            'url': 'http://localhost:3200/api/ingest/1/1'
          },
          'output': 'httppush',
          'overbosity': 'full',
          'owneremail': 'd.malas@cablelabs.com',
          'ownerid': 248,
          'publishAppSKey': false,
          'suspended': false,
          'tier': 2,
          'tierStr': 'PoC'
        },
        'networkTypeId': 1
      }

      server
        .get('/api/applicationNetworkTypeLinks/1')
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          res.should.have.property('text')
          var applications = JSON.parse(res.text)

          appLogger.log(applications)
          applications.should.eql(expected)
          done()
        })
    })
    it('Verify the Test Device was Created', function (done) {
      let expected = {
        'id': 1,
        'applicationId': 1,
        'name': '0080000004001546',
        'deviceModel': null,
        'description': null,
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
        'deviceId': 1,
        'deviceProfileId': -1,
        'id': 1,
        'networkSettings': {
          '_id': '0080000004001546',
          'adr': true,
          'adrCnt': 0,
          'adrFix': null,
          'adrMax': null,
          'adrMin': null,
          'appeui': 'BE7E0000000003F2',
          'bat': null,
          'createdAt': '2018-07-20T18:32:11.557Z',
          'description': null,
          'devSnr': null,
          'devaddr': '002AF013',
          'devclass': 'A',
          'deveui': '0080000004001546',
          'dutycycle': 0,
          'packetLimit': null,
          'rx1': {
            'delay': 1000000,
            'offset': 0
          },
          'rxrate': null,
          'rxw': 1,
          'seqdn': 0,
          'seqdnreset': true,
          'seqno': -1,
          'seqq': 0,
          'seqrelax': true,
          'subscription': 2,
          'txrate': null,
          'title': '00-80-00-00-04-00-15-46'
        },
        'networkTypeId': 1
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
  describe('LPWAN Server modifies any existing application “Integrations” to point to LPWAN Server', function () {
    it('Verify the Lora Server Application Integration was set to LPWan Server', function (done) {
      let options = {}
      options.url = baseUrl + '/1/nwk/apps'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.LORIOT_KEY
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
  describe.skip('Validate LPWAN Server application integrations are maintained for outbound from LPWAN Server' +
    'Note: Loriot does not support updating httppush from the API.  So the application PUSH URL will need' +
    'to be entered manually.', function () {
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
  describe('At this point, you should be able to view all of the applications and devices from the Loriot Server.', function () {
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
          applications.records[0].name.should.equal('ApiTest')
          applications.records[0].description.should.equal('ApiTest')
          applicationId = applications.records[0].id
          done()
        })
    })
    it('Verify the Test Device Exists on LPWan', function (done) {
      let expected = {
        'id': 1,
        'applicationId': 1,
        'name': '0080000004001546',
        'deviceModel': null,
        'description': null,
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
