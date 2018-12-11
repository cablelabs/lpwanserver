/* eslint-disable no-unused-vars */
let assert = require('assert')
let chai = require('chai')
let chaiHttp = require('chai-http')
let app = require('../../restApp.js')
let should = chai.should()
let setup = require('./setup.js')
let appLogger = require('../../rest/lib/appLogger.js')
let request = require('request')

chai.use(chaiHttp)
let server = chai.request(app).keepOpen()

describe('E2E Test for Updating a Device Use Case #193', () => {
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

  const appName = 'UPDV'
  const appDescription = 'UPDV Description'
  const companyId = 2
  const reportingProtocolId = 1
  const baseUrl = 'http://localhost:5086'

  const deviceProfile = {
    'networkTypeId': 1,
    'companyId': companyId,
    'name': 'LoRaSoilReader',
    'description': 'Soil Sensor that works with LoRa',
    'networkSettings': {
      'name': 'LoRaSoilReader',
      'macVersion': '1.0.0',
      'regParamsRevision': 'A',
      'supportsJoin': true
    }
  }

  const device = {
    'applicationId': '',
    'name': 'UPDV001',
    'description': 'Soil Node Model 001',
    'deviceModel': 'Mark1'
  }

  const deviceNTL = {
    'deviceId': '',
    'networkTypeId': 1,
    'deviceProfileId': '',
    'networkSettings': {
      'devEUI': '0080000000000501',
      name: device.name,
      description: device.description,
      deviceKeys: {
        'appKey': '112233445566889900112233445511'
      }
    }
  }

  const deviceUpdate = {
    'applicationId': '',
    'name': 'UPDV001',
    'description': 'Updated Soil Node Model 001',
    'deviceModel': 'Mark1'
  }

  const deviceNTLUpdate = {
    'deviceId': '',
    'networkTypeId': 1,
    'deviceProfileId': '',
    'networkSettings': {
      'devEUI': '0080000000000501',
      name: deviceUpdate.name,
      description: deviceUpdate.description,
      deviceKeys: {
        'appKey': '112233445566889900112233445522'
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
          'networkTypeId': 1,
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
  describe('Verify LoRaServer V1 has application', function () {
    let baseUrl = 'https://lora_appserver1:8080/api'
    let loraKey = ''
    it('Get LoRaServer V1 Session', function (done) {
      let options = {}
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
    it('Verify the LoRaServer V1 Application Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/applications/' + remoteApp1
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
          app.should.have.property('id')
          app.should.have.property('name')
          app.should.have.property('description')
          app.should.have.property('organizationID')
          app.should.have.property('serviceProfileID')
          app.should.have.property('payloadCodec')
          app.should.have.property('payloadEncoderScript')
          app.should.have.property('payloadDecoderScript')
          app.name.should.equal(appName)
          done()
        }
      })
    })
    it('Verify the LoRaServer V1 Device Profile Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/device-profiles?limit=100'
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
          let remoteDeviceProfile = JSON.parse(body)
          remoteDeviceProfile = remoteDeviceProfile.result
          console.log(remoteDeviceProfile)
          for (let i = 0; i < remoteDeviceProfile.length; i++) {
            if (remoteDeviceProfile[i].name === deviceProfile.networkSettings.name) {
              remoteDeviceProfileId = remoteDeviceProfile[i].deviceProfileID
            }
          }
          remoteDeviceProfileId.should.not.equal('')
          done()
        }
      })
    })
    it('Verify the LoRaServer V1 Device Profile Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/device-profiles/' + remoteDeviceProfileId
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
          appLogger.log(app)
          app.should.have.property('name')
          app.name.should.equal(deviceProfile.networkSettings.name)
          app.should.have.property('organizationID')
          app.should.have.property('networkServerID')
          app.should.have.property('createdAt')
          app.should.have.property('updatedAt')
          app.should.have.property('deviceProfile')
          app.deviceProfile.should.have.property('macVersion')
          app.deviceProfile.should.have.property('regParamsRevision')
          app.deviceProfile.macVersion.should.equal(deviceProfile.networkSettings.macVersion)
          app.deviceProfile.regParamsRevision.should.equal(deviceProfile.networkSettings.regParamsRevision)

          done()
        }
      })
    })
    it('Verify the LoRaServer V1 Device Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/devices/' + deviceNTL.networkSettings.devEUI
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
          app.should.have.property('name')
          app.should.have.property('devEUI')
          app.should.have.property('applicationID')
          app.should.have.property('description')
          app.should.have.property('deviceProfileID')
          app.should.have.property('deviceStatusBattery')
          app.should.have.property('deviceStatusMargin')
          app.should.have.property('lastSeenAt')
          app.should.have.property('skipFCntCheck')

          app.name.should.equal(deviceNTL.networkSettings.name)
          app.devEUI.should.equal(deviceNTL.networkSettings.devEUI)
          app.deviceProfileID.should.equal(remoteDeviceProfileId)
          done()
        }
      })
    })
  })
  describe('Verify LoRaServer V2 has application', function () {
    let baseUrl = 'https://lora_appserver:8080/api'
    let loraKey = ''
    it('Get LoRaServer V2 Session', function (done) {
      let options = {}
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
    it('Verify the LoRaServer V2 Application Exists', function (done) {
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
              remoteApp2 = app[i].id
            }
          }
          done()
        }
      })
    })
    it('Verify the LoRaServer V2 Application Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/applications/' + remoteApp2
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
          app.name.should.equal(appName)
          done()
        }
      })
    })
    it('Verify the LoRaServer V2 Device Profile Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/device-profiles?limit=100'
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
          let remoteDeviceProfile = JSON.parse(body)
          remoteDeviceProfile = remoteDeviceProfile.result
          for (let i = 0; i < remoteDeviceProfile.length; i++) {
            if (remoteDeviceProfile[i].name === deviceProfile.name) {
              remoteDeviceProfileId2 = remoteDeviceProfile[i].id
            }
          }
          done()
        }
      })
    })
    it('Verify the LoRaServer V2 Device Profile Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/device-profiles/' + remoteDeviceProfileId2
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
          console.log(app)
          app = app.deviceProfile
          app.should.have.property('name')
          app.name.should.equal(deviceProfile.networkSettings.name)
          app.should.have.property('organizationID')
          app.should.have.property('networkServerID')
          app.should.have.property('macVersion')
          app.should.have.property('regParamsRevision')
          app.macVersion.should.equal(deviceProfile.networkSettings.macVersion)
          app.regParamsRevision.should.equal(deviceProfile.networkSettings.regParamsRevision)
          done()
        }
      })
    })
    it('Verify the LoRaServer V2 Device Exists', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/devices/' + deviceNTL.networkSettings.devEUI
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

          device.name.should.equal(deviceNTL.networkSettings.name)
          device.devEUI.should.equal(deviceNTL.networkSettings.devEUI)
          device.deviceProfileID.should.equal(remoteDeviceProfileId2)
          done()
        }
      })
    })
  })
  describe('Update Device', () => {
    it('Update Device', function (done) {
      server
        .put('/api/devices/' + deviceId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send(deviceUpdate)
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(204)
          done()
        })
    })
    it('Verify Device Updated', function (done) {
      server
        .get('/api/devices/' + deviceId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          let devObj = JSON.parse(res.text)
          devObj.should.have.property('id')
          devObj.should.have.property('name')
          devObj.should.have.property('description')
          devObj.should.have.property('deviceModel')
          devObj.name.should.equal(deviceUpdate.name)
          devObj.id.should.equal(deviceId1)
          devObj.description.should.equal(deviceUpdate.description)
          devObj.deviceModel.should.equal(deviceUpdate.deviceModel)
          done()
        })
    })
    it('Update Network Type Links for Application', function (done) {
      server
        .put('/api/deviceNetworkTypeLinks/' + dnlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send({
          'networkSettings': deviceNTLUpdate.networkSettings
        })
        .end(function (err, res) {
          if (err) done(err)
          // TODO:  Why does PUT do 200 sometimes and 204 others?
          res.should.have.status(204)
          done()
        })
    })
    it('Verify Device NTL Updated', function (done) {
      server
        .get('/api/deviceNetworkTypeLinks/' + dnlId1)
        .set('Authorization', 'Bearer ' + adminToken)
        .set('Content-Type', 'application/json')
        .send()
        .end(function (err, res) {
          if (err) done(err)
          res.should.have.status(200)
          let deviceNTL = JSON.parse(res.text)
          console.log(deviceNTL)
          done()
        })
    })
  })
  describe('Verify LoRaServer V1 has device', function () {
    let baseUrl = 'https://lora_appserver1:8080/api'
    let loraKey = ''
    it('Get LoRaServer V1 Session', function (done) {
      let options = {}
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
    it('Verify the LoRaServer V1 Device is Updated', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/devices/' + deviceNTL.networkSettings.devEUI
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
          appLogger.log(app)
          app.should.have.property('name')
          app.should.have.property('devEUI')
          app.should.have.property('applicationID')
          app.should.have.property('description')
          app.should.have.property('deviceProfileID')
          app.should.have.property('deviceStatusBattery')
          app.should.have.property('deviceStatusMargin')
          app.should.have.property('lastSeenAt')
          app.should.have.property('skipFCntCheck')

          app.name.should.equal(deviceNTLUpdate.networkSettings.name)
          app.description.should.equal(deviceNTLUpdate.networkSettings.description)
          app.devEUI.should.equal(deviceNTLUpdate.networkSettings.devEUI)
          app.deviceProfileID.should.equal(remoteDeviceProfileId)
          done()
        }
      })
    })
  })
  describe('Verify LoRaServer V2 has application', function () {
    let baseUrl = 'https://lora_appserver:8080/api'
    let loraKey = ''
    it('Get LoRaServer V2 Session', function (done) {
      let options = {}
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
    it('Verify the LoRaServer V2 Device is Updated', function (done) {
      let options = {}
      options.method = 'GET'
      options.url = baseUrl + '/devices/' + deviceNTL.networkSettings.devEUI
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
          appLogger.log(app)
          app.should.have.property('device')
          app.should.have.property('deviceStatusBattery')
          app.should.have.property('deviceStatusMargin')
          app.should.have.property('lastSeenAt')

          let device = app.device
          device.should.have.property('name')
          device.should.have.property('devEUI')
          device.should.have.property('applicationID')
          device.should.have.property('description')
          device.should.have.property('deviceProfileID')
          device.should.have.property('skipFCntCheck')

          device.name.should.equal(deviceNTLUpdate.networkSettings.name)
          device.description.should.equal(deviceNTLUpdate.networkSettings.description)
          device.devEUI.should.equal(deviceNTLUpdate.networkSettings.devEUI)
          device.deviceProfileID.should.equal(remoteDeviceProfileId2)
          done()
        }
      })
    })
  })
})
