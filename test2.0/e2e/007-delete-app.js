let chai = require('chai')
let chaiHttp = require('chai-http')
let app = require('../../restApp.js')
let setup = require('./setup.js')
let appLogger = require('../../rest/lib/appLogger.js')
let request = require('request')
let requestP = require('request-promise')
let Data = require('../data')
const { assertEqualProps } = require('../lib/helpers')

var should = chai.should()
chai.use(chaiHttp)
let server = chai.request(app).keepOpen()

const describeTTN = process.env.TTN === 'true' ? describe : describe.skip.bind(describe)

const state = {
  adminToken: '',
  remoteApp1: '',
  remoteApp2: '',
  remoteAppLoriot: '',
  remoteDeviceProfileId: '',
  remoteDeviceProfileId2: '',
  lora1BaseUrl: 'https://lora_appserver1:8080/api',
  lora1Key: '',
  lora2BaseUrl: 'https://lora_appserver:8080/api',
  lora2Key: '',
  loriotBaseUrl: 'https://us1.loriot.io/1/nwk',
  loriotKey: 'AAAA-AXsZan9nB1apIzsnsW0Rlf5dAJLr0dGIfzLy6xOMd31o',
  lora: {
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
    ttn: {
      protocolId: '',
      networkId: '',
      apps: []
    },
    loriot: {
      protocolId: '',
      networkId: '',
      apps: []
    }
  }
}

const testData = {
  ...Data.applicationTemplates.default({
    name: 'DLAP',
    companyId: 2
  }),
  ...Data.deviceTemplates.weatherNode({
    name: 'DLAP001',
    companyId: 2,
    devEUI: '0080000000000701'
  })
}

describe('E2E Test for Deleting an Application Use Case #191', () => {
  before(() => setup.start())

  describe('Verify Login and Administration of Users Works', () => {
    it('Admin Login to LPWan Server', (done) => {
      server
        .post('/api/sessions')
        .send({'login_username': 'admin', 'login_password': 'password'})
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          state.adminToken = res.text
          done()
        })
    })
  })
  describe('Create Application', () => {
    it('should return 200 on admin', function (done) {
      server
        .post('/api/applications')
        .set('Authorization', 'Bearer ' + state.adminToken)
        .set('Content-Type', 'application/json')
        .send(testData.app)
        .end(function (err, res) {
          res.should.have.status(200)
          let ret = JSON.parse(res.text)
          testData.app.id = ret.id
          testData.device.applicationId = ret.id
          testData.appNTL.applicationId = ret.id
          done()
        })
    })
    it('should return 200 on get', function (done) {
      server
        .get('/api/applications/' + testData.app.id)
        .set('Authorization', 'Bearer ' + state.adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          let appObj = JSON.parse(res.text)

          Object.keys(testData.app).forEach(prop => {
            appObj[prop].should.equal(testData.app[prop])
          })

          done()
        })
    })
    it('Create Network Type Links for Application', function (done) {
      server
        .post('/api/applicationNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + state.adminToken)
        .set('Content-Type', 'application/json')
        .send(testData.appNTL)
        .end(function (err, res) {
          res.should.have.status(200)
          let ret = JSON.parse(res.text)
          testData.appNTL.id = ret.id
          done()
        })
    })
    it('should return 200 on get', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks/' + testData.appNTL.id)
        .set('Authorization', 'Bearer ' + state.adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
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
        .set('Authorization', 'Bearer ' + state.adminToken)
        .set('Content-Type', 'application/json')
        .send(testData.deviceProfile)
        .end(function (err, res) {
          res.should.have.status(200)
          let ret = JSON.parse(res.text)
          testData.deviceProfile.id = ret.id
          testData.deviceNTL.deviceProfileId = ret.id
          done()
        })
    })
    it('should return 200 on get', function (done) {
      server
        .get('/api/deviceProfiles/' + testData.deviceProfile.id)
        .set('Authorization', 'Bearer ' + state.adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          assertEqualProps(
            ['name', 'description', 'networkTypeId', 'companyId'],
            JSON.parse(res.text),
            testData.deviceProfile
          )
          done()
        })
    })
  })
  describe('Create Device for Application', () => {
    it('POST Device', function (done) {
      server
        .post('/api/devices')
        .set('Authorization', 'Bearer ' + state.adminToken)
        .set('Content-Type', 'application/json')
        .send(testData.device)
        .end(function (err, res) {
          appLogger.log(res)
          res.should.have.status(200)
          let ret = JSON.parse(res.text)
          testData.device.id = ret.id
          testData.deviceNTL.deviceId = ret.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/devices/' + testData.device.id)
        .set('Authorization', 'Bearer ' + state.adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          let devObj = JSON.parse(res.text)
          console.log(devObj)
          assertEqualProps(
            ['name', 'description', 'deviceModel'],
            devObj,
            testData.device
          )
          done()
        })
    })
    it('Create Device NTL', function (done) {
      server
        .post('/api/deviceNetworkTypeLinks')
        .set('Authorization', 'Bearer ' + state.adminToken)
        .set('Content-Type', 'application/json')
        .send(testData.deviceNTL)
        .end(function (err, res) {
          res.should.have.status(200)
          var dnlObj = JSON.parse(res.text)
          console.log(dnlObj)
          testData.deviceNTL.id = dnlObj.id
          done()
        })
    })

    it('should return 200 on get', function (done) {
      server
        .get('/api/deviceNetworkTypeLinks/' + testData.deviceNTL.id)
        .set('Authorization', 'Bearer ' + state.adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          var dnlObj = JSON.parse(res.text)
          assertEqualProps(
            ['deviceId', 'networkTypeId', 'deviceProfileId'],
            dnlObj,
            testData.deviceNTL
          )
          done()
        })
    })
  })
  describe('Verify LoRaServer V1 has application', function () {
    it('Get LoRaServer V1 Session', function (done) {
      let options = {}
      options.method = 'POST'
      options.url = state.lora1BaseUrl + '/internal/login'
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
          state.lora1Key = body.jwt
          done()
        }
      })
    })
    it('Verify the LoRaServer V1 Application Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora1BaseUrl + '/applications?limit=100'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora1Key
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
            if (app[i].name === testData.app.name) {
              state.remoteApp1 = app[i].id
            }
          }
          done()
        }
      })
    })
    it('Verify the LoRaServer V1 Application Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora1BaseUrl + '/applications/' + state.remoteApp1
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora1Key
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
          console.log(app)
          app.should.have.property('id')
          app.should.have.property('name')
          app.should.have.property('description')
          app.should.have.property('organizationID')
          app.should.have.property('serviceProfileID')
          app.should.have.property('payloadCodec')
          app.should.have.property('payloadEncoderScript')
          app.should.have.property('payloadDecoderScript')
          app.name.should.equal(testData.app.name)
          done()
        }
      })
    })
    it('Verify the LoRaServer V1 Device Profile Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora1BaseUrl + '/device-profiles?limit=100'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora1Key
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
          let remoteDeviceProfile = JSON.parse(body)
          remoteDeviceProfile = remoteDeviceProfile.result
          console.log(remoteDeviceProfile)
          for (let i = 0; i < remoteDeviceProfile.length; i++) {
            if (remoteDeviceProfile[i].name === testData.deviceProfile.networkSettings.name) {
              state.remoteDeviceProfileId = remoteDeviceProfile[i].deviceProfileID
            }
          }
          state.remoteDeviceProfileId.should.not.equal('')
          done()
        }
      })
    })
    it('Verify the LoRaServer V1 Device Profile Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora1BaseUrl + '/device-profiles/' + state.remoteDeviceProfileId
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora1Key
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
          appLogger.log(app)
          app.should.have.property('name')
          app.name.should.equal(testData.deviceProfile.networkSettings.name)
          app.should.have.property('organizationID')
          app.should.have.property('networkServerID')
          app.should.have.property('createdAt')
          app.should.have.property('updatedAt')
          app.should.have.property('deviceProfile')
          app.deviceProfile.should.have.property('macVersion')
          app.deviceProfile.should.have.property('regParamsRevision')
          app.deviceProfile.macVersion.should.equal(testData.deviceProfile.networkSettings.macVersion)
          app.deviceProfile.regParamsRevision.should.equal(testData.deviceProfile.networkSettings.regParamsRevision)

          done()
        }
      })
    })
    it('Verify the LoRaServer V1 Device Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora1BaseUrl + '/devices/' + testData.deviceNTL.networkSettings.devEUI
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora1Key
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
          app.should.have.property('name')
          app.should.have.property('devEUI')
          app.should.have.property('applicationID')
          app.should.have.property('description')
          app.should.have.property('deviceProfileID')
          app.should.have.property('deviceStatusBattery')
          app.should.have.property('deviceStatusMargin')
          app.should.have.property('lastSeenAt')
          app.should.have.property('skipFCntCheck')

          app.name.should.equal(testData.deviceNTL.networkSettings.name)
          app.devEUI.should.equal(testData.deviceNTL.networkSettings.devEUI)
          app.deviceProfileID.should.equal(state.remoteDeviceProfileId)
          done()
        }
      })
    })
  })
  describe('Verify LoRaServer V2 has application', function () {
    it('Get LoRaServer V2 Session', function (done) {
      let options = {}
      options.method = 'POST'
      options.url = state.lora2BaseUrl + '/internal/login'
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
          state.lora2Key = body.jwt
          done()
        }
      })
    })
    it('Verify the LoRaServer V2 Application Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora2BaseUrl + '/applications?limit=100'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora2Key
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
            if (app[i].name === testData.app.name) {
              state.remoteApp2 = app[i].id
            }
          }
          done()
        }
      })
    })
    it('Verify the LoRaServer V2 Application Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora2BaseUrl + '/applications/' + state.remoteApp2
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora2Key
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
          app = app.application
          console.log(app)
          app.should.have.property('id')
          app.should.have.property('name')
          app.should.have.property('description')
          app.should.have.property('organizationID')
          app.should.have.property('serviceProfileID')
          app.should.have.property('payloadCodec')
          app.should.have.property('payloadEncoderScript')
          app.should.have.property('payloadDecoderScript')
          app.name.should.equal(testData.app.name)
          done()
        }
      })
    })
    it('Verify the LoRaServer V2 Device Profile Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora2BaseUrl + '/device-profiles?limit=100'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora2Key
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
          let remoteDeviceProfile = JSON.parse(body).result
          state.remoteDeviceProfileId2 = remoteDeviceProfile.find(x => x.name === testData.deviceProfile.name).id
          done()
        }
      })
    })
    it('Verify the LoRaServer V2 Device Profile Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora2BaseUrl + '/device-profiles/' + state.remoteDeviceProfileId2
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora2Key
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
          console.log(app)
          app = app.deviceProfile
          app.should.have.property('name')
          app.name.should.equal(testData.deviceProfile.networkSettings.name)
          app.should.have.property('organizationID')
          app.should.have.property('networkServerID')
          app.should.have.property('macVersion')
          app.should.have.property('regParamsRevision')
          app.macVersion.should.equal(testData.deviceProfile.networkSettings.macVersion)
          app.regParamsRevision.should.equal(testData.deviceProfile.networkSettings.regParamsRevision)
          done()
        }
      })
    })
    it('Verify the LoRaServer V2 Device Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora2BaseUrl + '/devices/' + testData.deviceNTL.networkSettings.devEUI
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora2Key
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
          let device = app.device
          device.should.have.property('name')
          device.should.have.property('devEUI')
          device.should.have.property('applicationID')
          device.should.have.property('description')
          device.should.have.property('deviceProfileID')
          device.should.have.property('skipFCntCheck')
          app.should.have.property('deviceStatusBattery')
          app.should.have.property('deviceStatusMargin')
          app.should.have.property('lastSeenAt')

          device.name.should.equal(testData.deviceNTL.networkSettings.name)
          device.devEUI.should.equal(testData.deviceNTL.networkSettings.devEUI)
          device.deviceProfileID.should.equal(state.remoteDeviceProfileId2)
          done()
        }
      })
    })
  })
  describeLoriot('Verify Loriot has application', function () {
    it('Verify the Loriot Application Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.loriotBaseUrl + '/apps?page=1&perPage=100'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.loriotKey
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) {
          done(error)
        }
        else {
          let { apps } = JSON.parse(body)
          let app = apps.find(x => x.name === testData.app.name)
          should.exist(app)
          state.remoteAppLoriot = app._id
          done()
        }
      })
    })
    it('Verify the LoRaServer V2 Application Exists', function (done) {
      const appIdRest = state.remoteAppLoriot.toString(16).toUpperCase()
      let options = {}
      options.method = 'GET'
      options.url = state.loriotBaseUrl + '/app/' + appIdRest
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.loriotKey
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) {
          done(error)
        }
        else {
          let app = JSON.parse(body)
          console.log(app)
          app.should.have.property('_id')
          app.should.have.property('name')
          app.name.should.equal(testData.app.name)
          done()
        }
      })
    })
    it('Verify the Loriot Device Exists', function (done) {
      const appIdRest = state.remoteAppLoriot.toString(16).toUpperCase()
      let options = {}
      options.method = 'GET'
      options.url = state.loriotBaseUrl + '/app/' + appIdRest + '/device/' + testData.deviceNTL.networkSettings.devEUI
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.loriotKey
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) {
          done(error)
        }
        else {
          let device = JSON.parse(body)
          console.log(device)
          device.should.have.property('title')
          device.should.have.property('deveui')
          device.should.have.property('description')

          device.title.should.equal(testData.deviceNTL.networkSettings.name)
          device.deveui.should.equal(testData.deviceNTL.networkSettings.devEUI)
          done()
        }
      })
    })
  })
  describe('Remove Device from Application', () => {
    it('Delete Device NTL', function (done) {
      server
        .delete(`/api/deviceNetworkTypeLinks/${testData.deviceNTL.id}`)
        .set('Authorization', 'Bearer ' + state.adminToken)
        .send()
        .end(function (err, res) {
          res.should.have.status(204)
          done()
        })
    })
    it('should return 404 on get', function (done) {
      server
        .get(`/api/deviceNetworkTypeLinks/${testData.deviceNTL.id}`)
        .set('Authorization', 'Bearer ' + state.adminToken)
        .send()
        .end(function (err, res) {
          res.should.have.status(404)
          done()
        })
    })
    it('Delete Device', function (done) {
      server
        .delete(`/api/devices/${testData.device.id}`)
        .set('Authorization', 'Bearer ' + state.adminToken)
        .send()
        .end(function (err, res) {
          res.should.have.status(204)
          done()
        })
    })
    it('should return 404 on get', function (done) {
      server
        .get(`/api/devices/${testData.device.id}`)
        .set('Authorization', 'Bearer ' + state.adminToken)
        .send()
        .end(function (err, res) {
          res.should.have.status(404)
          done()
        })
    })
    it('Delete Device Profile', function (done) {
      server
        .delete('/api/deviceProfiles/' + testData.deviceProfile.id)
        .set('Authorization', 'Bearer ' + state.adminToken)
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })
    it('should return 404 on get', function (done) {
      server
        .get('/api/deviceProfiles/' + testData.deviceProfile.id)
        .set('Authorization', 'Bearer ' + state.adminToken)
        .send()
        .end(function (err, res) {
          res.should.have.status(404)
          done()
        })
    })
  })
  describe('Verify Device Removed from LoRaServer V1', () => {
    it('Verify the LoRaServer V1 Device Does Not Exist', (done) => {
      let options = {}
      options.method = 'GET'
      options.url = state.lora1BaseUrl + '/devices/' + testData.deviceNTL.networkSettings.devEUI
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora1Key
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
          response.statusCode.should.equal(404)
          done()
        }
      })
    })
    it('Verify the LoRaServer V1 Device Profile Does Not Exist', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora1BaseUrl + '/device-profiles/' + state.remoteDeviceProfileId
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora1Key
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
          response.statusCode.should.equal(404)
          done()
        }
      })
    })
    it('Verify the LoRaServer V2 Device Does Not Exist', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora2BaseUrl + '/devices/' + testData.deviceNTL.networkSettings.devEUI
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora2Key
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
          response.statusCode.should.equal(404)
          done()
        }
      })
    })
    it('Verify the LoRaServer V2 Device Profile Does Not Exist', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora2BaseUrl + '/device-profiles/' + state.remoteDeviceProfileId2
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora2Key
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
          response.statusCode.should.equal(404)
          done()
        }
      })
    })
  })
  describeLoriot('Verify Device Removed from Loriot', () => {
    it('Verify the Loriot Device Does Not Exist', (done) => {
      const appIdRest = state.remoteAppLoriot.toString(16).toUpperCase()
      let options = {}
      options.method = 'GET'
      options.url = state.loriotBaseUrl + '/app/' + appIdRest + '/device/' + testData.deviceNTL.networkSettings.devEUI
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.loriotKey
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) {
          done(error)
        }
        else {
          response.statusCode.should.equal(404)
          done()
        }
      })
    })
  })
  describe('Delete Application', () => {
    it('Delete Network Type Links for Application', function (done) {
      server
        .delete('/api/applicationNetworkTypeLinks/' + testData.appNTL.id)
        .set('Authorization', 'Bearer ' + state.adminToken)
        .send()
        .end(function (err, res) {
          res.should.have.status(200)
          done()
        })
    })
    it('should return 404 on get', function (done) {
      server
        .get('/api/applicationNetworkTypeLinks/' + testData.appNTL.id)
        .set('Authorization', 'Bearer ' + state.adminToken)
        .send()
        .end(function (err, res) {
          res.should.have.status(404)
          done()
        })
    })
    it('should return 204 on delete', function (done) {
      server
        .delete('/api/applications/' + testData.app.id)
        .set('Authorization', 'Bearer ' + state.adminToken)
        .send()
        .end(function (err, res) {
          res.should.have.status(204)
          done()
        })
    })
    it('should return 404 on get', function (done) {
      server
        .get('/api/applications/' + testData.app.id)
        .set('Authorization', 'Bearer ' + state.adminToken)
        .send()
        .end(function (err, res) {
          res.should.have.status(404)
          done()
        })
    })
  })
  describe('Verify LoRaServer V1 does not have application', function () {
    it('Verify the LoRaServer V1 Application Does Not Exist', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora1BaseUrl + '/applications?limit=100'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora1Key
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) return done(error)
        let apps = JSON.parse(body)
          .result
          .filter(x => x.id === state.remoteApp1)
        apps.should.have.length(0)
        done()
      })
    })
    it('Verify the LoRaServer V1 Application Does Not Exist', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora1BaseUrl + '/applications/' + state.remoteApp1
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora1Key
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      appLogger.log(options)
      request(options, function (error, res, body) {
        if (error) return done(error)
        res.should.have.status(404)
        done()
      })
    })
  })
  describe('Verify LoRaServer V2 does not have application', function () {
    it('Verify the LoRaServer V2 Application Does Not Exist', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora2BaseUrl + '/applications?limit=100'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora2Key
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) return done(error)
        let apps = JSON.parse(body)
          .result
          .filter(x => x.id === state.remoteApp1)
        apps.should.have.length(0)
        done()
      })
    })
    it('Verify the LoRaServer V2 Application Does Not Exist', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.lora2BaseUrl + '/applications/' + state.remoteApp2
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.lora2Key
      }
      options.agentOptions = {
        'secureProtocol': 'TLSv1_2_method',
        'rejectUnauthorized': false
      }
      appLogger.log(options)
      request(options, function (error, res, body) {
        if (error) return done(error)
        res.should.have.status(404)
        done()
      })
    })
  })
  describeLoriot('Verify Loriot does not have application', function () {
    it('Verify the Loriot Application Does Not Exist', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = state.loriotBaseUrl + '/apps?page=1&perPage=100'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.loriotKey
      }
      appLogger.log(options)
      request(options, function (error, response, body) {
        if (error) return done(error)
        let apps = JSON.parse(body)
          .apps
          .filter(x => x._id === state.remoteAppLoriot)
        apps.should.have.length(0)
        done()
      })
    })
    it('Verify the Loriot Application Does Not Exist', function (done) {
      const appIdRest = state.remoteAppLoriot.toString(16).toUpperCase()
      let options = {}
      options.method = 'GET'
      options.url = state.loriotBaseUrl + '/app/' + appIdRest
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.loriotKey
      }
      appLogger.log(options)
      request(options, function (error, res, body) {
        if (error) return done(error)
        res.should.have.status(403)
        done()
      })
    })
  })
  describeLoriot('Remove Loriot apps and devices', () => {
    it('Remove Loriot apps and devices', async () => {
      let options = { method: 'GET', json: true }
      options.url = state.loriotBaseUrl + '/apps?page=1&perPage=100'
      options.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.loriotKey
      }
      let { apps } = await requestP(options)
      apps = apps.filter(x => x.name !== 'ApiTest')
      let appDevices = await Promise.all(apps.map(app => {
        const appIdRest = app._id.toString(16).toUpperCase()
        let opts = { ...options, url: `${state.loriotBaseUrl}/app/${appIdRest}/devices` }
        return requestP(opts).then(x => ({ appIdRest, devices: x.devices }))
      }))
      await Promise.all(appDevices.map(async ({ appIdRest, devices }) => {
        await Promise.all(devices.map(dev => requestP({
          ...options,
          method: 'DELETE',
          url: `${state.loriotBaseUrl}/app/${appIdRest}/device/${dev._id}`
        })))
        let opts = { ...options, method: 'DELETE', url: `${state.loriotBaseUrl}/app/${appIdRest}` }
        await requestP(opts)
      }))
    })
  })
})
