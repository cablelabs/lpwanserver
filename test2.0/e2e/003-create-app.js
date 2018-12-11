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

describe('E2E Test for Creating an Application Use Case #188', () => {
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

  const appName = 'CATA'
  const appDescription = 'CATA Description'
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
    'name': 'CATA001',
    'description': 'GPS Node Model 001',
    'deviceModel': 'Mark1'
  }

  const deviceNTL = {
    'deviceId': '',
    'networkTypeId': 1,
    'deviceProfileId': '',
    'networkSettings': {
      'devEUI': '0080000000000301',
      name: device.name,
      deviceKeys: {
        'appKey': '11223344556677889900112233443311'
      }
    }
  }

  let lora = {
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
  describe.skip('Setup Networks', () => {
    describe('Setup Lora 1.0 Network', () => {
      it('Verify LoraOS 1.0 Protocol Exists', (done) => {
        server
          .get('/api/networkProtocols?search=LoRa Server&networkProtocolVersion=1.0')
          .set('Authorization', 'Bearer ' + adminToken)
          .set('Content-Type', 'application/json')
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(200)
            let result = JSON.parse(res.text)
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
            'baseUrl': 'https://lora_appserver1:8080/api',
            'networkProtocolId': lora.loraV1.protocolId,
            'securityData': {authorized: false, 'username': 'admin', 'password': 'admin'}
          })
          .end(function (err, res) {
            if (err) done(err)
            res.should.have.status(201)
            let network = JSON.parse(res.text)
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
            let network = JSON.parse(res.text)
            network.name.should.equal('LocalLoraOS1_0')
            network.baseUrl.should.equal('https://lora_appserver1:8080/api')
            network.securityData.authorized.should.equal(true)
            network.securityData.message.should.equal('ok')
            network.securityData.enabled.should.equal(true)
            done()
          })
      })
    })
    describe('Setup Lora 2.0 Network', () => {
      it('Verify LoraOS 2.0 Protocol Exists', (done) => {
        server
          .get('/api/networkProtocols?search=LoRa Server&networkProtocolVersion=2.0')
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
            'baseUrl': 'https://lora_appserver:8080/api',
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
            network.baseUrl.should.equal('https://lora_appserver:8080/api')
            network.securityData.authorized.should.equal(true)
            network.securityData.message.should.equal('ok')
            network.securityData.enabled.should.equal(true)
            done()
          })
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
})
